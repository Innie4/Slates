#!/usr/bin/env node
/**
 * Screenshot + QA for Slate routes.
 *
 *   node scripts/shot.mjs --base http://localhost:5310 --out shots/r1 [--widths 390,1440] [--dark] [--full] /path /other ...
 *   node scripts/shot.mjs --base http://localhost:5310 --out shots/all --all     # every route in src/routes.tsx
 *
 * For each path × width: saves a PNG, and reports console errors, page errors,
 * horizontal overflow (no sideways scroll allowed), text under 12px, and
 * images/links that are broken. Exit code 1 if any check fails.
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const flag = (k) => args.includes(`--${k}`);
const base = opt("base", "http://localhost:5310");
const out = opt("out", "shots/latest");
const widths = opt("widths", "390,1440").split(",").map(Number);
const dark = flag("dark");
const full = flag("full");
let paths = args.filter((a, i) => a.startsWith("/") && !args[i - 1]?.startsWith("--"));
if (flag("all")) {
  const src = readFileSync(new URL("../src/routes.tsx", import.meta.url), "utf8");
  const block = src.slice(src.indexOf("ALL_PATHS"));
  paths = [...block.matchAll(/"(\/[^"]*)"/g)].map((m) => m[1])
    .map((p) => p.replace(":id", "x").replace(":city", "uyo").replace(":slug", "x"));
  paths = paths.map((p) => p
    .replace("/app/services/x", "/app/services/svc-home-weekly")
    .replace("/app/subscriptions/x", "/app/subscriptions/sub-1")
    .replace("/app/pickups/x", "/app/pickups/PU-26-08813")
    .replace("/app/complaints/x", "/app/complaints/CMP-1201")
    .replace("/app/community/x", "/app/community/cp-ewet-drain")
    .replace("/operator/jobs/x", "/operator/jobs/PU-26-08813")
    .replace("/admin/customers/x", "/admin/customers/cus-0001")
    .replace("/admin/operators/x", "/admin/operators/op-ufok")
    .replace("/admin/operator-applications/x", "/admin/operator-applications/op-esuk")
    .replace("/admin/contracts/x", "/admin/contracts/CT-UYO-011")
    .replace("/admin/pickups/x", "/admin/pickups/PU-26-08813")
    .replace("/admin/payments/x", "/admin/payments/pay-m1")
    .replace("/admin/cities/x", "/admin/cities/uyo")
    .replace("/admin/partnerships/x", "/admin/partnerships/pt-1")
    .replace("/blog/x", "/blog/why-estates-switch-to-managed-waste"));
}
if (!paths.length) paths = ["/"];

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome", args: ["--no-sandbox"] });
let failures = 0;
const report = [];

for (const w of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: w < 600 ? 844 : 900 },
    deviceScaleFactor: w < 600 ? 3 : 1.5,
    colorScheme: dark ? "dark" : "light",
    isMobile: w < 600,
    hasTouch: w < 600,
  });
  await ctx.addInitScript((d) => {
    try { localStorage.setItem("slate-theme", d ? "dark" : "light"); } catch {}
  }, dark);
  for (const p of paths) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && !/favicon|fonts\.g/.test(m.text()) && errors.push(m.text().slice(0, 200)));
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`));
    try {
      await page.goto(base + p, { waitUntil: "networkidle", timeout: 30000 });
    } catch (e) {
      errors.push(`goto: ${e.message.slice(0, 120)}`);
    }
    await page.waitForTimeout(Number(opt("wait", "450")));
    const qa = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const overflow = docW - window.innerWidth;
      const offenders = [];
      if (overflow > 1) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 1 && r.width > 0 && getComputedStyle(el).position !== "fixed") {
            const cls = typeof el.className === "string" ? el.className.slice(0, 60) : "";
            offenders.push(`${el.tagName.toLowerCase()}.${cls} (${Math.round(r.right)}px)`);
            if (offenders.length > 4) break;
          }
        }
      }
      let tiny = 0;
      const tinySamples = [];
      for (const el of document.querySelectorAll("body *")) {
        if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        if (el.closest("svg")) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        const r = el.getBoundingClientRect();
        if (fs < 11 && r.width > 0) { tiny++; if (tinySamples.length < 3) tinySamples.push(`${el.textContent.trim().slice(0, 30)} (${fs}px)`); }
      }
      const brokenImgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !i.src.startsWith("blob:")).map((i) => i.src.slice(0, 80));
      const h1 = document.querySelector("h1")?.textContent?.trim().slice(0, 60) ?? "";
      return { overflow, offenders, tiny, tinySamples, brokenImgs, h1, building: document.body.innerText.includes("Being built") };
    });
    const name = `${p === "/" ? "home" : p.slice(1).replace(/[/:?=&]/g, "_")}@${w}${dark ? "-dark" : ""}.png`;
    await page.screenshot({ path: join(out, name), fullPage: full });
    const problems = [];
    if (errors.length) problems.push(`console: ${errors.join(" | ")}`);
    if (qa.overflow > 1) problems.push(`overflow +${qa.overflow}px: ${qa.offenders.join(", ")}`);
    if (qa.tiny) problems.push(`text <11px ×${qa.tiny}: ${qa.tinySamples.join(", ")}`);
    if (qa.brokenImgs.length) problems.push(`broken images: ${qa.brokenImgs.join(", ")}`);
    if (qa.building) problems.push("stub page");
    if (problems.length) failures++;
    report.push(`${problems.length ? "FAIL" : "ok  "} ${p} @${w}  h1="${qa.h1}"${problems.length ? "\n      " + problems.join("\n      ") : ""}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(report.join("\n"));
console.log(`\n${failures} failing of ${report.length}. Screenshots in ${out}/`);
process.exit(failures ? 1 : 0);
