import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const user = { id: '11111111-1111-4111-8111-111111111111', name: 'First Customer', email: 'first@example.test', phone: '+2348000000000', role: 'household' };
const booking = { id: '33333333-3333-4333-8333-333333333333', reference: 'REQ-PRIVATE1', serviceId: 'svc-home-weekly', serviceName: 'Slate Home', status: 'requested', createdAt: '2026-10-18T00:00:00Z', updatedAt: '2026-10-18T00:00:00Z', date: '2026-10-20', address: 'FIRST CUSTOMER PRIVATE ADDRESS', area: 'Ewet Housing Estate', window: 'morning' };

async function withPage(run) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(10_000);
  try { await run(page); assert.deepEqual(errors, []); }
  catch (error) { console.error('Browser regression failed at', page.url(), await page.locator('body').innerText()); throw error; }
  finally { await context.close(); }
}

try {
  await withPage(async page => {
    const pending = [];
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/session') { pending.push(route); return; }
      await route.fulfill({ status: 200, json: path === '/api/auth/login' ? { user } : path === '/api/bookings' ? { bookings: [] } : { tickets: [] } });
    });
    await page.goto(`${base}/login`);
    await page.getByLabel('Email', { exact: true }).fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill('a very long password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('heading', { name: 'Your collections', exact: true }).waitFor();
    assert.ok(pending.length, 'Initial session request must remain pending until login succeeds');
    await Promise.all(pending.map(route => route.fulfill({ status: 200, json: { user: null } })));
    await page.waitForLoadState('networkidle');
    assert.equal(new URL(page.url()).pathname, '/app/dashboard', 'An earlier null session response must not erase a completed sign-in');
    assert.equal(await page.getByRole('heading', { name: 'Your collections', exact: true }).count(), 1);
    console.log('PASS: delayed anonymous session response cannot erase sign-in.');
  });

  await withPage(async page => {
    const pending = [];
    let holdSession = false;
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/session' && holdSession) { pending.push(route); return; }
      await route.fulfill({ status: 200, json: path === '/api/session' ? { user } : path === '/api/auth/logout' ? { user: null } : path === '/api/bookings' ? { bookings: [] } : { tickets: [] } });
    });
    await page.goto(`${base}/app/dashboard`);
    await page.getByRole('heading', { name: 'Your collections', exact: true }).waitFor();
    holdSession = true;
    const refresh = page.waitForRequest('**/api/session');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await refresh;
    await page.getByRole('button', { name: 'Account', exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/login');
    assert.ok(pending.length, 'Account refresh must remain pending until logout succeeds');
    await Promise.all(pending.map(route => route.fulfill({ status: 200, json: { user } })));
    await page.waitForLoadState('networkidle');
    assert.equal(new URL(page.url()).pathname, '/login', 'An earlier account response must not restore a completed sign-out');
    assert.equal(await page.getByRole('heading', { name: 'Sign in', exact: true }).count(), 1);
    console.log('PASS: delayed authenticated session response cannot undo sign-out.');
  });

  await withPage(async page => {
    const pending = [];
    let activeUser = user;
    let holdBookings = true;
    let sessionReads = 0;
    await page.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === '/api/bookings' && holdBookings) { pending.push(route); return; }
      if (path === '/api/session') sessionReads++;
      if (path === '/api/auth/logout') activeUser = null;
      if (path === '/api/auth/login') activeUser = { ...user, id: '22222222-2222-4222-8222-222222222222', name: 'Second Customer' };
      await route.fulfill({ status: 200, json: path === '/api/session' || path.startsWith('/api/auth/') ? { user: activeUser } : path === '/api/bookings' ? { bookings: [] } : { tickets: [] } });
    });
    await page.goto(`${base}/app/dashboard`);
    await page.getByRole('button', { name: 'Account', exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/login');
    holdBookings = false;
    await page.getByLabel('Email', { exact: true }).fill('second@example.test');
    await page.getByLabel('Password', { exact: true }).fill('a very long password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByText('Collection requests and support for Second Customer.', { exact: true }).waitFor();
    assert.ok(pending.length, 'Previous customer requests must remain pending until the new sign-in succeeds');
    const previousReads = sessionReads;
    await Promise.all(pending.map(route => route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Previous session expired.' }, requestId: 'synthetic-old-session' } })));
    await page.waitForLoadState('networkidle');
    assert.ok(sessionReads > previousReads, 'An unauthorized response must recheck the current session');
    assert.equal(new URL(page.url()).pathname, '/app/dashboard', 'An earlier customer request must not expire a newer sign-in');
    assert.equal(await page.getByText('Collection requests and support for Second Customer.', { exact: true }).count(), 1);
    console.log('PASS: delayed unauthorized request cannot clear a newer customer session.');
  });

  await withPage(async page => {
    const secondUser = { ...user, id: '22222222-2222-4222-8222-222222222222', name: 'Second Customer', email: 'second@example.test' };
    let activeUser = user;
    let bookingReads = 0;
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/bookings') bookingReads++;
      await route.fulfill({ status: 200, json: path === '/api/session' ? { user: activeUser } : path === '/api/bookings' ? { bookings: activeUser.id === user.id ? [booking] : [] } : { tickets: [] } });
    });
    await page.goto(`${base}/app/dashboard`);
    await page.getByText('Collection requests and support for First Customer.', { exact: true }).waitFor();
    assert.equal(await page.getByText(/FIRST CUSTOMER PRIVATE ADDRESS/).count(), 1);
    const previousReads = bookingReads;
    activeUser = secondUser;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.getByText('Collection requests and support for Second Customer.', { exact: true }).waitFor();
    assert.equal(await page.getByText(/FIRST CUSTOMER PRIVATE ADDRESS/).count(), 0, 'Switching account must discard the previous customer cache');
    assert.ok(bookingReads > previousReads, 'Switching account must load the new customer records');
    console.log('PASS: account switch discards the previous customer records.');
  });

  await withPage(async page => {
    let detailReads = 0;
    let supportBody;
    await page.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === `/api/bookings/${booking.id}`) {
        detailReads++;
        await route.fulfill({ status: 200, json: { booking } });
      } else if (path === '/api/tickets' && request.method() === 'POST') {
        supportBody = request.postDataJSON();
        await route.fulfill({ status: 201, json: { ticket: { ...supportBody, id: '44444444-4444-4444-8444-444444444444', reference: 'SUP-LINKED01', status: 'open', createdAt: '2026-10-18T00:00:00Z' } } });
      } else {
        await route.fulfill({ status: 200, json: path === '/api/session' ? { user } : path === '/api/bookings' ? { bookings: [] } : { tickets: [] } });
      }
    });
    await page.goto(`${base}/app/pickups/${booking.id}`);
    await page.getByRole('heading', { name: 'Slate Home', exact: true }).waitFor();
    assert.equal(await page.getByText(booking.address, { exact: true }).count(), 1, 'A saved request link must resolve outside the limited list');
    assert.ok(detailReads > 0, 'Detail route must request its record directly');
    await page.getByRole('link', { name: 'Ask about this request', exact: true }).click();
    await page.getByRole('button', { name: 'Send message', exact: true }).waitFor();
    await page.waitForFunction(id => document.querySelector('select')?.value === id, booking.id);
    assert.equal(await page.getByLabel('Collection request', { exact: false }).inputValue(), booking.id, 'Support must preserve an out-of-list request association');
    await page.getByLabel('Subject', { exact: true }).fill('Confirm older collection');
    await page.getByLabel('Your message', { exact: true }).fill('Please confirm this earlier collection request.');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await page.getByText('Message saved', { exact: true }).waitFor();
    assert.equal(supportBody.bookingId, booking.id);
    console.log('PASS: saved request outside the recent list opens and stays linked to support.');
  });

  await withPage(async page => {
    const submissions = [];
    await page.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === '/api/tickets' && request.method() === 'POST') {
        submissions.push({ key: request.headers()['idempotency-key'], body: request.postDataJSON() });
        if (submissions.length === 1) {
          await route.fulfill({ status: 503, json: { error: { code: 'TEMPORARY_FAILURE', message: 'Temporary test failure. Retry your message.' }, requestId: 'synthetic-test' } });
        } else {
          await route.fulfill({ status: 201, json: { ticket: { ...request.postDataJSON(), id: '55555555-5555-4555-8555-555555555555', reference: `SUP-RETRY00${submissions.length}`, status: 'open', createdAt: '2026-10-18T00:00:00Z' } } });
        }
      } else {
        await route.fulfill({ status: 200, json: path === '/api/session' ? { user } : path === '/api/bookings' ? { bookings: [] } : { tickets: [] } });
      }
    });
    await page.goto(`${base}/app/support`);
    const subject = page.getByLabel('Subject', { exact: true });
    const message = page.getByLabel('Your message', { exact: true });
    const send = page.getByRole('button', { name: 'Send message', exact: true });
    await subject.fill('Collection not confirmed');
    await message.fill('Please confirm my collection request.');
    await send.click();
    await page.getByText('Temporary test failure. Retry your message.', { exact: true }).waitFor();
    assert.equal(await subject.inputValue(), 'Collection not confirmed', 'Failed requests must preserve the draft');
    await send.click();
    await page.getByText('Message saved', { exact: true }).waitFor();
    assert.equal(submissions[0].key, submissions[1].key, 'An unchanged failed submission must retry with the same key');
    assert.deepEqual(submissions[0].body, submissions[1].body);
    assert.equal(await subject.inputValue(), '', 'Confirmed success must clear the completed draft');
    await subject.fill('Collection not confirmed');
    await message.fill('Please confirm my collection request.');
    await send.click();
    await page.getByText('SUP-RETRY003', { exact: true }).waitFor();
    assert.equal(submissions.length, 3);
    assert.notEqual(submissions[1].key, submissions[2].key, 'A new confirmed submission needs a new key even when its text matches');
    assert.deepEqual(submissions[1].body, submissions[2].body);
    console.log('PASS: failed support retry keeps its key; a new identical message gets a new key.');
  });
} finally { await browser.close(); }
