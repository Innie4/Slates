import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright-core";

// Uses the real component and project CSS without adding a public test route.
const fixture = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/src/index.css"></head><body><div id="fixture"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { DatePicker } from '/src/components/ui/DatePicker.tsx';
import { Modal } from '/src/components/ui/Overlay.tsx';
const root = createRoot(document.getElementById('fixture'));
function Fixture({ config }) {
  const [value, setValue] = React.useState(config.value ?? '2026-02-14');
  const form = React.createElement('form', { style: { padding: '16px', maxWidth: '500px' } },
    React.createElement(DatePicker, { label: 'Collection date', value, onChange: setValue,
      min: '2026-02-01', max: '2026-03-31',
      isDateDisabled: key => new Date(key + 'T12:00:00').getDay() === 0, ...config }),
    React.createElement('output', { id: 'selected-value' }, value),
    React.createElement('button', { type: 'button', id: 'after' }, 'Next field'));
  return config.modal ? React.createElement(Modal, { open: true, onClose: () => { window.modalCloseCount = (window.modalCloseCount ?? 0) + 1; }, title: 'Plan service', sheet: false }, form) : form;
}
let revision = 0;
window.mountPicker = config => flushSync(() => root.render(React.createElement(Fixture, { key: revision++, config })));
window.mountPicker({});
</script></body></html>`;

const server = await createServer({
  root: fileURLToPath(new URL("../", import.meta.url)),
  server: { host: "127.0.0.1", port: 0 },
  plugins: [{ name: "date-picker-test-fixture", configureServer(vite) {
    vite.middlewares.use(async (request, response, next) => {
      if (request.url !== "/__date-picker-test") return next();
      response.setHeader("Content-Type", "text/html");
      response.end(await vite.transformIndexHtml(request.url, fixture));
    });
  } }],
});
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, timezoneId: "Africa/Lagos" });
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}/__date-picker-test`, { waitUntil: "domcontentloaded" });
  const trigger = page.getByLabel("Collection date", { exact: true });
  const focusedDate = () => page.evaluate(() => document.activeElement?.getAttribute("data-date"));
  const mount = async (config) => {
    await page.evaluate((next) => window.mountPicker(next), config);
    await page.locator(".date-picker-trigger").waitFor();
  };

  await trigger.click();
  await page.locator(".date-picker-panel").waitFor();
  assert.equal(await focusedDate(), "2026-02-14", "Opening focuses the selected date");
  assert.equal(await page.locator(".date-picker-heading h3").innerText(), "February 2026");
  assert.equal(await page.locator('[data-date="2026-02-29"]').count(), 0, "February uses actual month length");
  await page.keyboard.press("ArrowRight");
  assert.equal(await focusedDate(), "2026-02-16", "Arrow navigation skips a disabled Sunday");
  await page.keyboard.press("End");
  assert.equal(await focusedDate(), "2026-02-21", "End reaches the last available day of the week");
  await page.keyboard.press("Home");
  assert.equal(await focusedDate(), "2026-02-16");
  await page.keyboard.press("PageDown");
  assert.equal(await focusedDate(), "2026-03-16");
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#selected-value").innerText(), "2026-03-16");
  assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  assert.equal(await trigger.evaluate((node) => document.activeElement === node), true, "Selection restores trigger focus");

  await trigger.click();
  await page.keyboard.press("Escape");
  assert.equal(await trigger.evaluate((node) => document.activeElement === node), true, "Escape restores trigger focus");
  await trigger.click();
  assert.equal(await page.getByRole("button", { name: "Next month", exact: true }).isDisabled(), true, "Month navigation honors max");
  assert.equal(await page.locator('[data-date="2026-04-01"]').isDisabled(), true);
  await page.getByRole("button", { name: "Previous month", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Previous month", exact: true }).isDisabled(), true, "Month navigation honors min");
  await page.keyboard.press("Escape");

  await mount({ value: "2026-01-31", min: "2025-01-01", max: "2027-12-31", isDateDisabled: undefined });
  await trigger.click();
  await page.keyboard.press("PageDown");
  assert.equal(await focusedDate(), "2026-02-28", "Month navigation clamps the day rather than overflowing");
  await page.keyboard.press("Shift+PageDown");
  assert.equal(await focusedDate(), "2027-02-28", "Shift changes year");
  await page.keyboard.press("Escape");

  await mount({ value: "2028-02-29", min: "2028-01-01", max: "2028-12-31", isDateDisabled: undefined });
  await trigger.click();
  assert.equal(await focusedDate(), "2028-02-29", "Leap day remains a real calendar date");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const dark of [false, true]) {
      await page.evaluate((enabled) => document.documentElement.classList.toggle("dark", enabled), dark);
      const bounds = await page.locator(".date-picker-panel").boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, `Calendar stays within ${width}px viewport`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width === 320 || width === 1440) await page.screenshot({ path: `/tmp/slate-datepicker-${width}-${dark ? "dark" : "light"}.png` });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/slate-datepicker-mobile.png" });
  await page.keyboard.press("Escape");
  await mount({ modal: true });
  await trigger.click();
  assert.equal(await page.locator(".date-picker-panel").evaluate((panel) => panel.matches(":popover-open")), true, "Calendar enters top layer inside scrollable modals");
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog", { name: "Plan service", exact: true }).isVisible(), true);
  assert.equal(await page.evaluate(() => window.modalCloseCount ?? 0), 0, "Escape closes only the calendar");
  await trigger.click();
  await page.setViewportSize({ width: 320, height: 360 });
  const shortBounds = await page.locator(".date-picker-panel").boundingBox();
  assert.ok(shortBounds.y >= 0 && shortBounds.y + shortBounds.height <= 360, "Calendar fits short landscape viewports");
  await page.keyboard.press("Escape");
  await mount({ disabled: true });
  assert.equal(await trigger.isDisabled(), true);
  assert.equal(await page.locator(".date-picker-panel").count(), 0);
  await mount({ value: "", required: true });
  assert.equal(await page.locator("form").evaluate((form) => form.reportValidity()), false, "Required dates participate in native form validation");
  assert.equal(await trigger.getAttribute("aria-invalid"), "true");
  assert.equal(await page.getByRole("alert").innerText(), "Choose a date.");
  assert.equal(await trigger.evaluate((node) => document.activeElement === node), true);
  await mount({ error: "Choose a date after your current service ends." });
  assert.equal(await trigger.getAttribute("aria-invalid"), "true");
  const descriptionId = await trigger.getAttribute("aria-describedby");
  assert.equal(await page.locator(`[id="${descriptionId}"]`).getAttribute("role"), "alert");
  assert.deepEqual(errors, [], "Calendar produces no runtime errors");
  console.log("Date picker browser checks passed: keyboard, focus, min/max, blocked days, leap years, responsive light/dark layouts, errors and disabled state.");
} finally {
  await browser?.close();
  await server.close();
}
