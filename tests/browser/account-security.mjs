import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const user = { id: '11111111-1111-4111-8111-111111111111', name: 'Security Test', email: 'security@example.test', phone: '+2348000000000', role: 'household' };
const passkey = { id: 'dGVzdC1wYXNza2V5', name: 'My test phone', createdAt: '2026-10-22T08:00:00Z' };
const methods = { google: true, apple: false, passkeys: true };
if (process.env.SCREENSHOT_DIR) await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });

async function scenario(details, run, override = () => undefined) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  const writes = [];
  let security = structuredClone(details);
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(10_000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: {
      create: async () => { throw new DOMException('Test prompt closed', 'NotAllowedError'); },
      get: async () => { throw new DOMException('Test prompt closed', 'NotAllowedError'); },
    } });
  });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') writes.push({ path, method: request.method(), body: request.postDataJSON() });
    const changed = await override({ route, request, path, security, writes });
    if (changed) return;
    if (path === '/api/session') return route.fulfill({ status: 200, json: { user } });
    if (path === '/api/auth/config') return route.fulfill({ status: 200, json: { methods } });
    if (path === '/api/auth/security') return route.fulfill({ status: 200, json: security });
    if (path === '/api/bookings') return route.fulfill({ status: 200, json: { bookings: [] } });
    if (path === '/api/tickets') return route.fulfill({ status: 200, json: { tickets: [] } });
    if (path === '/api/auth/reauthenticate') {
      assert.deepEqual(request.postDataJSON(), { password: 'test-only-password' });
      security.recentAuth = true;
      return route.fulfill({ status: 200, json: { user } });
    }
    if (path === `/api/auth/passkeys/${passkey.id}` && request.method() === 'DELETE') {
      security.passkeys = [];
      return route.fulfill({ status: 200, json: { ok: true } });
    }
    if (path === '/api/auth/passkeys/register/options') return route.fulfill({ status: 200, json: { options: {
      challenge: 'dGVzdC1jaGFsbGVuZ2U', rp: { id: 'localhost', name: 'Slate' }, user: { id: 'dGVzdC11c2Vy', name: user.email, displayName: user.name },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }], authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    } } });
    if (path === '/api/auth/passkeys/reauthenticate/options') return route.fulfill({ status: 200, json: { options: { challenge: 'dGVzdC1jaGFsbGVuZ2U', rpId: 'localhost', userVerification: 'required' } } });
    throw new Error(`Unexpected account security request: ${request.method()} ${path}`);
  });
  try {
    await page.goto(`${base}/app/settings`);
    await page.getByRole('heading', { name: 'Sign-in and security', exact: true }).waitFor();
    await run({ page, writes });
    assert.deepEqual(errors, [], 'Account security must not emit browser errors');
  } catch (error) {
    console.error('Account security regression failed:', await page.locator('body').innerText());
    throw error;
  } finally { await context.close(); }
}

try {
  await scenario({ hasPassword: true, recentAuth: false, identities: [], passkeys: [passkey] }, async ({ page, writes }) => {
    assert.equal(await page.getByRole('dialog').count(), 0, 'Security settings must not prompt for reauthentication automatically');
    assert.equal(writes.length, 0, 'Viewing settings must not begin an authentication ceremony');
    assert.equal(await page.getByRole('button', { name: 'Connect Apple', exact: true }).isDisabled(), true);
    for (const [name, width] of [['mobile', 390], ['desktop', 1440]]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `${name} security settings must not overflow`);
      if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/account-security-${name}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: 'Add passkey', exact: true }).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.getByLabel('Passkey name', { exact: true }).evaluate(element => element === document.activeElement), true, 'The passkey dialog must move keyboard focus into its form');
    await page.getByLabel('Passkey name', { exact: true }).fill('My laptop');
    await page.getByRole('button', { name: 'Create passkey', exact: true }).click();
    await page.getByRole('heading', { name: 'Confirm your sign-in', exact: true }).waitFor();
    assert.equal(writes.length, 0, 'A stale session must not request registration options before confirmation');
    await page.getByLabel('Current password', { exact: true }).fill('test-only-password');
    await page.getByRole('button', { name: 'Confirm with password', exact: true }).click();
    await page.getByRole('heading', { name: 'Add a passkey', exact: true }).waitFor();
    assert.equal(await page.getByLabel('Passkey name', { exact: true }).inputValue(), 'My laptop');
    assert.equal(writes.filter(write => write.path.endsWith('/register/options')).length, 0, 'Passkey creation still requires its explicit user action');
    await page.getByRole('button', { name: 'Create passkey', exact: true }).click();
    await page.getByText('The passkey prompt was closed or timed out. Try again, or use another sign-in method.', { exact: true }).waitFor();
    assert.deepEqual(writes.find(write => write.path.endsWith('/register/options')).body, { name: 'My laptop' });
    assert.equal(writes.filter(write => write.path.endsWith('/register/verify')).length, 0, 'Canceling the device prompt must not submit a credential');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(await page.getByRole('dialog').count(), 0);
    console.log('PASS: passkey enrollment waits for explicit reauthentication and handles canceled prompts.');
  });

  await scenario({ hasPassword: true, recentAuth: true, identities: [], passkeys: [passkey] }, async ({ page, writes }) => {
    await page.getByRole('button', { name: `Remove passkey ${passkey.name}`, exact: true }).click();
    await page.getByRole('button', { name: 'Keep passkey', exact: true }).click();
    assert.equal(writes.length, 0, 'Canceling removal must preserve the passkey');
    await page.getByRole('button', { name: `Remove passkey ${passkey.name}`, exact: true }).click();
    await page.getByRole('button', { name: 'Remove passkey', exact: true }).click();
    await page.getByText(`Passkey removed: ${passkey.name}.`, { exact: true }).waitFor();
    await page.getByText('No passkeys saved. Add one on a device you trust.', { exact: true }).waitFor();
    assert.equal(writes.filter(write => write.method === 'DELETE').length, 1);
    console.log('PASS: passkey removal requires confirmation and refreshes the list.');
  });

  await scenario({ hasPassword: true, recentAuth: true, identities: [], passkeys: [] }, async ({ page, writes }) => {
    await page.getByRole('button', { name: 'Connect Google', exact: true }).click();
    await page.getByRole('heading', { name: 'Confirm your sign-in', exact: true }).waitFor();
    assert.equal(writes.filter(write => write.path.endsWith('/google/start')).length, 1);
    assert.deepEqual(writes.find(write => write.path.endsWith('/google/start')).body, { intent: 'link', next: '/app/settings' });
    console.log('PASS: server-required reauthentication cannot be bypassed by a stale client flag.');
  }, async ({ route, path }) => {
    if (path !== '/api/auth/oauth/google/start') return false;
    await route.fulfill({ status: 403, json: { error: { code: 'REAUTH_REQUIRED', message: 'Confirm your sign-in before changing account security.' } } });
    return true;
  });

  await scenario({ hasPassword: true, recentAuth: false, identities: [], passkeys: [passkey] }, async ({ page, writes }) => {
    await page.getByRole('button', { name: `Remove passkey ${passkey.name}`, exact: true }).click();
    await page.getByRole('button', { name: 'Remove passkey', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm with passkey', exact: true }).click();
    await page.getByText('The passkey prompt was closed or timed out. Try again, or use another sign-in method.', { exact: true }).waitFor();
    assert.equal(writes.filter(write => write.path.endsWith('/reauthenticate/options')).length, 1);
    assert.equal(writes.filter(write => write.method === 'DELETE' || write.path.endsWith('/reauthenticate/verify')).length, 0);
    console.log('PASS: canceling passkey confirmation cannot remove a credential.');
  });
} finally { await browser.close(); }
