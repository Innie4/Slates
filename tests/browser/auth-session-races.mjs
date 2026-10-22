import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL || 'http://localhost:5173';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Authentication race tests must use a local app');
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const user = { id: '11111111-1111-4111-8111-111111111111', name: 'Authentication Test', email: 'authentication@example.test', phone: '+2348000000000', role: 'household' };
const options = { challenge: 'dGVzdC1jaGFsbGVuZ2U', rpId: 'localhost', userVerification: 'required' };

async function withPage({ signedIn = false, delayedPath } = {}, run) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  const pending = [];
  let assertions = 0;
  let providerNavigations = 0;
  page.setDefaultTimeout(10_000);
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__passkeyPrompts = 0;
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: {
      get: async () => { window.__passkeyPrompts++; throw new DOMException('Test prompt closed', 'NotAllowedError'); },
    } });
  });
  await context.route('https://accounts.google.com/**', route => {
    providerNavigations++;
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Local provider navigation interception</p>' });
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === delayedPath) { pending.push(route); return; }
    if (path === '/api/auth/passkeys/login/verify') assertions++;
    const json = path === '/api/session' ? { user: signedIn ? user : null }
      : path === '/api/auth/config' ? { methods: { google: true, apple: false, passkeys: true } }
      : path === '/api/auth/security' ? { hasPassword: true, recentAuth: true, identities: [], passkeys: [] }
      : path === '/api/bookings' ? { bookings: [] } : { tickets: [] };
    await route.fulfill({ status: 200, json });
  });
  try {
    await run({ page, pending, assertionCount: () => assertions, navigationCount: () => providerNavigations });
    assert.deepEqual(errors, [], 'Authentication lifecycle checks must not emit browser errors');
  } finally { await context.close(); }
}

try {
  await withPage({ signedIn: true }, async ({ page }) => {
    await page.goto(`${base}/login?authError=account_exists`);
    await page.waitForURL(url => url.pathname === '/app/settings' && url.searchParams.get('authError') === 'account_exists');
    await page.getByText('An account already uses this email. Sign in with your existing method, then connect Google in Your account.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Sign-in and security', exact: true }).count(), 1);
    console.log('PASS: signed-in linking errors remain visible after the login-to-settings redirect.');
  });

  await withPage({ delayedPath: '/api/auth/passkeys/login/options' }, async ({ page, pending, assertionCount }) => {
    await page.goto(`${base}/login`);
    await page.getByRole('button', { name: 'Sign in with a passkey', exact: true }).click();
    await page.getByRole('link', { name: 'Create an account', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/signup');
    await page.getByRole('button', { name: 'Sign up with Google', exact: true }).waitFor();
    assert.equal(pending.length, 1, 'The option request must still be delayed when the login screen unmounts');
    await pending[0].fulfill({ status: 200, json: { options } });
    await page.waitForLoadState('networkidle');
    assert.equal(await page.evaluate(() => window.__passkeyPrompts), 0, 'An unmounted login screen must not open a delayed passkey prompt');
    assert.equal(assertionCount(), 0, 'An unmounted login screen must not verify an assertion');
    assert.equal(new URL(page.url()).pathname, '/signup');
    console.log('PASS: leaving login cancels delayed passkey options before a device prompt or assertion.');
  });

  await withPage({ delayedPath: '/api/auth/oauth/google/start' }, async ({ page, pending, navigationCount }) => {
    await page.goto(`${base}/login`);
    await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
    await page.getByRole('link', { name: 'Create an account', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/signup');
    await page.getByRole('button', { name: 'Sign up with Google', exact: true }).waitFor();
    assert.equal(pending.length, 1, 'The provider-start request must still be delayed when login unmounts');
    await pending[0].fulfill({ status: 200, json: { url: 'https://accounts.google.com/o/oauth2/v2/auth?state=local-test' } });
    await page.waitForLoadState('networkidle');
    assert.equal(navigationCount(), 0, 'An unmounted login screen must not redirect to a provider');
    assert.equal(new URL(page.url()).pathname, '/signup');
    console.log('PASS: leaving login cancels a delayed Google start before external navigation.');
  });
} finally { await browser.close(); }
