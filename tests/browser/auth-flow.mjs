import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL || 'http://localhost:4173';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Auth-flow tests may only run against an isolated local server');
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(15_000);
const email = `passkey-journey-${crypto.randomUUID()}@example.test`;
const password = `local-test-${crypto.randomUUID()}`;
const passkeyName = 'Automated test passkey';
const cdp = await context.newCDPSession(page);
let authenticatorId;

async function signOut() {
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.waitForURL(url => url.pathname === '/login');
  const response = await context.request.get(`${base}/api/session`);
  assert.equal((await response.json()).user, null, 'Signing out must end the server session');
}

try {
  await cdp.send('WebAuthn.enable', { enableUI: false });
  ({ authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', { options: {
    protocol: 'ctap2', transport: 'internal', hasResidentKey: true,
    hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true,
  } }));
  await page.goto(`${base}/signup`);
  await page.getByLabel('Full name', { exact: true }).fill('Passkey Journey');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mobile number', { exact: true }).fill('8031234567');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.waitForURL(url => url.pathname === '/app/dashboard');
  await page.goto(`${base}/app/settings`);
  await page.getByRole('button', { name: 'Add passkey', exact: true }).click();
  await page.getByLabel('Passkey name', { exact: true }).fill(passkeyName);
  await page.getByRole('button', { name: 'Create passkey', exact: true }).click();
  await page.getByText(passkeyName, { exact: true }).waitFor();
  let security = await (await context.request.get(`${base}/api/auth/security`)).json();
  assert.equal(security.passkeys.length, 1, 'A real verified credential must be persisted');
  assert.equal(security.passkeys[0].name, passkeyName);
  assert.equal(security.hasPassword, true, 'Enrollment must preserve password access');
  console.log('PASS: browser passkey registration verifies and persists a resident, user-verified credential.');

  await signOut();
  await page.goto(`${base}/login?next=${encodeURIComponent('/app/settings')}`);
  await page.getByRole('button', { name: 'Sign in with a passkey', exact: true }).click();
  await page.waitForURL(url => url.pathname === '/app/settings');
  const signedIn = await (await context.request.get(`${base}/api/session`)).json();
  assert.equal(signedIn.user?.email, email, 'The assertion must open the matching server-side account');
  console.log('PASS: passkey assertion after logout creates the correct authenticated server session.');

  await page.goto(`${base}/app/settings`);
  await page.getByText(passkeyName, { exact: true }).waitFor();
  await page.reload();
  await page.getByText(passkeyName, { exact: true }).waitFor();
  await page.getByRole('button', { name: `Remove passkey ${passkeyName}`, exact: true }).click();
  await page.getByRole('button', { name: 'Remove passkey', exact: true }).click();
  await page.getByText('No passkeys saved. Add one on a device you trust.', { exact: true }).waitFor();
  security = await (await context.request.get(`${base}/api/auth/security`)).json();
  assert.equal(security.passkeys.length, 0, 'Revocation must remove the persisted server credential');
  await signOut();
  await page.goto(`${base}/login?next=${encodeURIComponent('/app/settings')}`);
  await page.getByRole('button', { name: 'Sign in with a passkey', exact: true }).click();
  await page.getByText('The passkey could not be verified. Try again or use another sign-in method.', { exact: true }).waitFor();
  assert.equal((await (await context.request.get(`${base}/api/session`)).json()).user, null, 'A revoked passkey must not create a session');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(url => url.pathname === '/app/settings');
  console.log('PASS: revocation survives reload, prevents passkey sign-in, and preserves password access.');
  assert.deepEqual(errors, [], 'The real authentication journey must not emit browser errors');
  console.log('Verified with an isolated Chrome virtual authenticator. Physical fingerprint and Face ID hardware were not tested.');
} finally {
  if (authenticatorId) await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId }).catch(() => {});
  await context.close();
  await browser.close();
}
