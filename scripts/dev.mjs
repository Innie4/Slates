import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const origin = process.env.APP_ORIGIN || "http://localhost:5173";
const parsed = new URL(origin);
if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.protocol !== 'http:') throw new Error('Development APP_ORIGIN must be an HTTP localhost or 127.0.0.1 address.');
const children = [
  spawn(process.execPath, ["--watch", "server/index.ts"], { cwd: root, stdio: "inherit", env: { ...process.env, APP_ORIGIN: origin, NODE_ENV: "development" } }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", parsed.hostname, "--port", parsed.port || "5173", "--strictPort"], { cwd: root, stdio: "inherit" }),
];
let closing = false;
function close(code) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
  setTimeout(() => { for (const child of children) child.kill('SIGKILL'); }, 5000).unref();
}
for (const child of children) {
  child.once('error', error => { console.error(error.message); close(1); });
  child.once('exit', code => close(code ?? 1));
}
process.on('SIGINT', () => close(0));
process.on('SIGTERM', () => close(0));
