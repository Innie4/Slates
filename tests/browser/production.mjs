import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { request } from 'node:http';
import { createServer as createTLS } from 'node:https';
import { createServer } from '../../server/server.ts';

// A local TLS gateway exercises Secure cookies and CSP with the actual built app.
// The generated certificate and isolated customer database are deleted after the run.
await access('dist/index.html');
const directory = await mkdtemp(join(tmpdir(), 'slate-production-test-'));
let gateway, app;
try {
  const keyPath = join(directory, 'key.pem');
  const certPath = join(directory, 'cert.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyPath, '-out', certPath, '-subj', '/CN=localhost', '-days', '1'], { stdio: 'ignore' });
  let appPort;
  gateway = createTLS({ key: await readFile(keyPath), cert: await readFile(certPath) }, (incoming, outgoing) => {
    const peer = incoming.socket.remoteAddress?.replace(/^::ffff:/, '');
    const upstream = request({ host: '127.0.0.1', port: appPort, method: incoming.method, path: incoming.url, headers: { ...incoming.headers, 'x-real-ip': peer } }, response => {
      outgoing.writeHead(response.statusCode || 502, response.headers);
      response.pipe(outgoing);
    });
    upstream.on('error', () => { outgoing.writeHead(502); outgoing.end(); });
    incoming.pipe(upstream);
  });
  gateway.listen(0, '127.0.0.1');
  await once(gateway, 'listening');
  const gatewayAddress = gateway.address();
  assert.ok(gatewayAddress && typeof gatewayAddress === 'object');
  const origin = `https://127.0.0.1:${gatewayAddress.port}`;
  app = createServer({ origin, databasePath: join(directory, 'slate.sqlite'), staticDirectory: resolve('dist'), trustedProxyIPs: ['127.0.0.1'], logger: () => {} });
  app.listen(0, '127.0.0.1');
  await once(app, 'listening');
  const address = app.address();
  assert.ok(address && typeof address === 'object');
  appPort = address.port;
  const child = spawn(process.execPath, ['tests/browser/journey.mjs'], { env: { ...process.env, BASE_URL: origin, BROWSER_IGNORE_HTTPS_ERRORS: 'true' }, stdio: 'inherit' });
  const [code] = await once(child, 'exit');
  assert.equal(code, 0, 'The built app must pass the account journey through HTTPS');
  console.log('Production build browser check passed through a local TLS gateway with Secure sessions and the actual dist assets.');
} finally {
  for (const server of [gateway, app]) {
    if (!server) continue;
    const closed = once(server, 'close');
    server.close(); server.closeAllConnections();
    await closed;
  }
  await rm(directory, { recursive: true, force: true });
}
