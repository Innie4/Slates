import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL || 'http://localhost:4173';
const origin = new URL(base);
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'Service-picker tests create disposable accounts and must use a local app');
const out = 'shots/service-picker';
mkdirSync(out, { recursive: true });
const services = [
  { id: 'svc-home-weekly', name: 'Slate Home', amount: '₦7,000', unit: '/month', frequency: '2 collections per week' },
  { id: 'svc-home-lite', name: 'Slate Home Lite', amount: '₦4,500', unit: '/month', frequency: '1 collection per week' },
  { id: 'svc-bulk', name: 'Bulk Waste Pickup', amount: '₦15,000', unit: '/pickup', frequency: 'One-time collection' },
  { id: 'svc-recycling', name: 'Recycling Pickup', amount: '₦1,500', unit: '/month', frequency: '1 collection per month' },
  { id: 'svc-special', name: 'Special Collection', amount: '₦45,000', unit: '/job', frequency: 'One-time collection' },
  { id: 'svc-event', name: 'Event Cleanup', amount: '₦60,000', unit: '/event', frequency: 'One-time collection' },
];
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Africa/Lagos' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(12_000);
const trigger = page.getByRole('button', { name: /^Service / });
const dialog = page.getByRole('dialog', { name: 'Choose a service', exact: true });
const rowFor = service => dialog.getByRole('button').filter({ has: page.getByText(service.name, { exact: true }) });
const address = '42 Ewet Housing Estate, Uyo';
const notes = 'Bins are beside the gate. Please call on arrival.';

async function assertTrigger(service) {
  const text = await trigger.innerText();
  for (const value of [service.name, service.amount, service.unit, service.frequency]) {
    assert.ok(text.includes(value), `Selected service must show ${value}`);
  }
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
}

async function assertClosedAndFocused() {
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await trigger.evaluate(element => document.activeElement === element), true, 'Closing the picker must return focus to Service');
}

async function assertFits(width) {
  await dialog.evaluate(async element => {
    await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Request page must not overflow at ${width}px`);
  const bounds = await dialog.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
  });
  assert.ok(bounds.left >= -1 && bounds.right <= bounds.viewportWidth + 1, `Service dialog must fit horizontally at ${width}px`);
  assert.ok(bounds.top >= -1 && bounds.bottom <= bounds.viewportHeight + 1, `Service dialog must fit vertically at ${width}px: ${JSON.stringify(bounds)}`);
  assert.ok(bounds.scrollWidth <= bounds.clientWidth + 1, `Service dialog content must not overflow at ${width}px`);
}

try {
  await page.goto(`${base}/signup`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Full name', { exact: true }).fill('Service Picker Test');
  await page.getByLabel('Email', { exact: true }).fill(`service-picker-${crypto.randomUUID()}@example.test`);
  await page.getByLabel('Mobile number', { exact: true }).fill('8031234567');
  const password = `local-test-${crypto.randomUUID()}`;
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.waitForURL('**/app/dashboard');

  const preselected = services[1];
  const selected = services[2];
  await page.goto(`${base}/app/book?service=${preselected.id}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Request a collection', exact: true }).waitFor();
  await assertTrigger(preselected);
  assert.equal(await trigger.getAttribute('aria-haspopup'), 'dialog');
  await page.getByLabel('Collection address', { exact: true }).fill(address);
  await page.getByLabel('Area in Uyo', { exact: true }).selectOption('Ewet Housing Estate');
  await page.getByLabel('Notes for the collection team', { exact: false }).fill(notes);

  await trigger.click();
  await dialog.waitFor();
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(await dialog.locator('button[aria-pressed]').count(), services.length, 'Every household service must be available once');
  for (const service of services) {
    const row = rowFor(service);
    assert.equal(await row.count(), 1, `${service.name} must have one choice`);
    const text = await row.innerText();
    for (const value of [service.amount, service.unit, service.frequency]) assert.ok(text.includes(value), `${service.name} must show ${value}`);
    assert.match(text, /From/i, `${service.name} must identify the amount as a starting price`);
    assert.equal(await row.getAttribute('aria-pressed'), String(service.id === preselected.id), 'The query-selected service must be indicated');
  }
  await assertFits(1440);
  await page.screenshot({ path: `${out}/open-desktop.png` });
  await rowFor(selected).click();
  await assertClosedAndFocused();
  await assertTrigger(selected);
  assert.equal(await page.getByLabel('Collection address', { exact: true }).inputValue(), address);
  assert.equal(await page.getByLabel('Area in Uyo', { exact: true }).inputValue(), 'Ewet Housing Estate');
  assert.equal(await page.getByLabel('Notes for the collection team', { exact: false }).inputValue(), notes);
  await page.screenshot({ path: `${out}/selected-desktop.png`, fullPage: true });

  await trigger.press('Enter');
  await dialog.waitFor();
  assert.equal(await rowFor(selected).getAttribute('aria-pressed'), 'true');
  for (let count = 0; count < 9; count++) {
    await page.keyboard.press('Tab');
    assert.equal(await dialog.evaluate(element => element.contains(document.activeElement)), true, 'Tab focus must stay inside the service dialog');
  }
  await page.keyboard.press('Escape');
  await assertClosedAndFocused();
  await assertTrigger(selected);

  await trigger.click();
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await assertClosedAndFocused();
  await assertTrigger(selected);
  await trigger.click();
  await dialog.waitFor();
  await page.mouse.click(8, 8);
  await assertClosedAndFocused();
  await assertTrigger(selected);

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 667 : width < 600 ? 844 : 1000 });
    if (width < 600) await page.screenshot({ path: `${out}/selected-${width}.png`, fullPage: true });
    await trigger.click();
    await dialog.waitFor();
    await assertFits(width);
    await rowFor(services.at(-1)).scrollIntoViewIfNeeded();
    assert.equal(await rowFor(services.at(-1)).isVisible(), true, 'The last service must remain reachable in a compact picker');
    if (width < 600) await page.screenshot({ path: `${out}/open-last-${width}.png` });
    await rowFor(services[0]).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/open-${width}.png` });
    await page.keyboard.press('Escape');
    await assertClosedAndFocused();
    await assertTrigger(selected);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await trigger.click();
  await dialog.waitFor();
  await assertFits(390);
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  await page.screenshot({ path: `${out}/open-dark-mobile.png` });
  await page.keyboard.press('Escape');
  await assertClosedAndFocused();
  await assertTrigger(selected);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.getByRole('button', { name: 'Preferred date', exact: false }).click();
  await page.getByRole('dialog', { name: 'Preferred date', exact: true }).locator('button[data-date]:enabled').first().click();
  await page.getByRole('checkbox').check();
  const requestPromise = page.waitForRequest(request => new URL(request.url()).pathname === '/api/bookings' && request.method() === 'POST');
  const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/bookings' && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Send request', exact: true }).click();
  const request = await requestPromise;
  const payload = request.postDataJSON();
  assert.equal(payload.serviceId, selected.id, 'The submitted request must record the chosen service ID');
  assert.equal(payload.address, address);
  assert.equal(payload.area, 'Ewet Housing Estate');
  assert.equal(payload.notes, notes);
  const response = await responsePromise;
  assert.equal(response.ok(), true, 'The real booking endpoint must accept the selected service');
  const { booking } = await response.json();
  assert.equal(booking.serviceId, selected.id);
  assert.equal(booking.serviceName, selected.name);
  await page.waitForURL(/\/app\/pickups\/[a-f0-9-]+$/);
  await page.getByRole('heading', { name: selected.name, exact: true }).waitFor();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: selected.name, exact: true }).waitFor();
  const saved = await context.request.get(`${base}/api/bookings/${booking.id}`);
  assert.equal(saved.ok(), true);
  const persisted = (await saved.json()).booking;
  assert.equal(persisted.serviceId, selected.id);
  assert.equal(persisted.serviceName, selected.name);
  assert.equal(persisted.address, address);
  assert.equal(persisted.notes, notes);
  await page.screenshot({ path: `${out}/saved-request.png`, fullPage: true });
  assert.deepEqual(errors, [], 'The picker flow must not emit browser errors');
  console.log('PASS: all six service prices/frequencies, query preselection, popup selection and cancellation, keyboard focus, draft preservation, responsive/dark/reduced-motion layouts, submitted service and persistence after reload.');
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png`, fullPage: true }).catch(() => {});
  throw error;
} finally {
  await context.close();
  await browser.close();
}
