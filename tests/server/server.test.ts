import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { createServer } from "../../server/server.ts";

const origin = "http://localhost:5173";
const password = "A long test passphrase 438!";
const validBooking = () => ({
  serviceId: "svc-home-weekly", address: "18 Test Street", area: "Ewet Housing Estate",
  date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), window: "morning",
});

async function fixture(trustedProxyIPs: string[] = []) {
  const directory = await mkdtemp(join(tmpdir(), "slate-api-"));
  const databasePath = join(directory, "slate.sqlite");
  let server = createServer({ databasePath, origin, trustedProxyIPs, logger: () => {} });
  await start();
  function start() { server.listen(0, "127.0.0.1"); return once(server, "listening"); }
  async function stop() { server.close(); server.closeAllConnections(); await once(server, "close"); }
  const api = async (path: string, options: { method?: string; body?: unknown; rawBody?: string; cookie?: string; key?: string; headers?: Record<string, string> } = {}) => {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: options.method || (options.body || options.rawBody ? "POST" : "GET"),
      headers: { Origin: origin, "Content-Type": "application/json", ...(options.cookie ? { Cookie: options.cookie } : {}), ...(options.key ? { "Idempotency-Key": options.key } : {}), ...options.headers },
      ...(options.rawBody ? { body: options.rawBody } : options.body ? { body: JSON.stringify(options.body) } : {}),
    });
    const body = await response.json() as any;
    return { response, body, cookie: response.headers.get("set-cookie")?.split(";")[0] || "" };
  };
  const register = async (email = `${randomUUID()}@example.test`) => {
    const result = await api("/api/auth/register", { body: { name: "Test Customer", email, phone: "+2348000000000", password, termsVersion: "2026-10-18" } });
    assert.equal(result.response.status, 201, JSON.stringify(result.body));
    return result;
  };
  return { api, register, databasePath, restart: async () => { await stop(); server = createServer({ databasePath, origin, trustedProxyIPs, logger: () => {} }); await start(); }, dispose: async () => { await stop(); await rm(directory, { recursive: true, force: true }); } };
}

test("registration stores a salted hash, persists the session, and logout revokes it", async () => {
  const f = await fixture();
  try {
    assert.deepEqual((await f.api("/api/session")).body, { user: null });
    const registered = await f.register("person@example.test");
    assert.equal(registered.body.user.role, "household");
    assert.equal(registered.body.user.password, undefined);
    assert.match(registered.response.headers.get("set-cookie") || "", /HttpOnly; SameSite=Lax/);
    await f.restart();
    assert.equal((await f.api("/api/session", { cookie: registered.cookie })).body.user.email, "person@example.test");
    const db = new DatabaseSync(f.databasePath);
    const record = db.prepare("SELECT password_hash FROM users WHERE email = ?").get("person@example.test") as { password_hash: string };
    assert.notEqual(record.password_hash, password);
    assert.match(record.password_hash, /^scrypt\$/);
    db.close();
    assert.equal((await f.api("/api/auth/login", { body: { email: "person@example.test", password: "Wrong passphrase 3444" } })).response.status, 401);
    const login = await f.api("/api/auth/login", { body: { email: "PERSON@example.test", password } });
    assert.equal(login.response.status, 200);
    await f.api("/api/auth/logout", { body: {}, cookie: login.cookie });
    assert.deepEqual((await f.api("/api/session", { cookie: login.cookie })).body, { user: null });
    assert.equal((await f.api("/api/bookings", { cookie: "slate_session=fabricated" })).response.status, 401);
  } finally { await f.dispose(); }
});

test("validation, origin checks, roles, and content type fail closed", async () => {
  const f = await fixture();
  try {
    const elevated = await f.api("/api/auth/register", { body: { name: "Test", email: "admin@example.test", phone: "+2348000000000", password, role: "admin" } });
    assert.equal(elevated.response.status, 422);
    assert.equal((await f.api("/api/auth/register", { body: { name: "A", email: "bad", password: "short" } })).response.status, 422);
    assert.equal((await f.api("/api/auth/login", { body: { email: "a@example.test", password }, headers: { Origin: "https://attacker.test" } })).response.status, 403);
    assert.equal((await f.api("/api/auth/login", { body: { email: "a@example.test", password }, headers: { "Content-Type": "text/plain" } })).response.status, 415);
    assert.equal((await f.api("/api/admin/users")).response.status, 404);
    const { cookie } = await f.register();
    for (const invalid of [{ date: "2026-02-30" }, { date: "2001-01-01" }, { window: "whenever" }, { serviceId: "svc-commercial" }, { address: "" }, { customerId: "other" }]) {
      const result = await f.api("/api/bookings", { body: { ...validBooking(), ...invalid }, cookie, key: randomUUID() });
      assert.equal(result.response.status, 422, JSON.stringify(invalid));
      assert.equal(result.body.error.code, "VALIDATION_ERROR");
    }
    assert.equal((await f.api("/api/bookings", { body: validBooking(), cookie })).response.status, 400);
  } finally { await f.dispose(); }
});

test("bookings persist, concurrent duplicates create once, and customers cannot access each other's records", async () => {
  const f = await fixture();
  try {
    const first = await f.register();
    const second = await f.register();
    const key = randomUUID();
    const requests = await Promise.all(Array.from({ length: 10 }, () => f.api("/api/bookings", { cookie: first.cookie, key, body: validBooking() })));
    assert.equal(new Set(requests.map(r => r.body.booking.id)).size, 1);
    assert.ok(requests.every(r => r.response.status === 201));
    const booking = requests[0]!.body.booking;
    assert.equal(booking.status, "requested");
    assert.equal((await f.api("/api/bookings", { cookie: first.cookie, key, body: { ...validBooking(), address: "Different address" } })).response.status, 409);
    assert.deepEqual((await f.api("/api/bookings", { cookie: second.cookie })).body.bookings, []);
    assert.equal((await f.api(`/api/bookings/${booking.id}`, { cookie: second.cookie })).response.status, 404);
    assert.equal((await f.api(`/api/bookings/${booking.id}`, { method: "PATCH", cookie: second.cookie, body: { status: "cancelled" } })).response.status, 404);
    assert.equal((await f.api("/api/tickets", { cookie: second.cookie, key: randomUUID(), body: { subject: "Collection issue", message: "Please check this collection request.", bookingId: booking.id } })).response.status, 404);
    await f.restart();
    assert.equal((await f.api("/api/bookings", { cookie: first.cookie })).body.bookings.length, 1);
    const cancelled = await f.api(`/api/bookings/${booking.id}`, { method: "PATCH", cookie: first.cookie, body: { status: "cancelled" } });
    assert.equal(cancelled.body.booking.status, "cancelled");
  } finally { await f.dispose(); }
});

test("support tickets enforce ownership and survive restart", async () => {
  const f = await fixture();
  try {
    const first = await f.register();
    const second = await f.register();
    const key = randomUUID();
    const body = { subject: "Missed collection", message: "My collection has not arrived. Please help." };
    const result = await f.api("/api/tickets", { cookie: first.cookie, key, body });
    assert.equal(result.response.status, 201);
    assert.equal(result.body.ticket.status, "open");
    assert.equal((await f.api("/api/tickets", { cookie: first.cookie, key, body })).body.ticket.id, result.body.ticket.id);
    assert.deepEqual((await f.api("/api/tickets", { cookie: second.cookie })).body.tickets, []);
    assert.equal((await f.api(`/api/tickets/${result.body.ticket.id}`, { cookie: second.cookie })).response.status, 404);
    await f.restart();
    assert.equal((await f.api("/api/tickets", { cookie: first.cookie })).body.tickets[0].message, body.message);
  } finally { await f.dispose(); }
});

test("public enquiries validate, persist, replay safely, and rate limit new submissions", async () => {
  const f = await fixture();
  try {
    const body = { name: "Test Resident", email: "resident@example.test", category: "New service", message: "Please confirm collection coverage for my street." };
    const key = randomUUID();
    assert.equal((await f.api("/api/enquiries", { key, body: { ...body, email: "invalid" } })).response.status, 422);
    const first = await f.api("/api/enquiries", { key, body });
    assert.equal(first.response.status, 201);
    assert.ok(first.body.reference);
    assert.equal((await f.api("/api/enquiries", { key, body })).body.reference, first.body.reference);
    assert.equal((await f.api("/api/enquiries", { key, body: { ...body, message: "A different service question." } })).response.status, 409);
    for (let i = 0; i < 4; i++) assert.equal((await f.api("/api/enquiries", { key: randomUUID(), body })).response.status, 201);
    const limited = await f.api("/api/enquiries", { key: randomUUID(), body });
    assert.equal(limited.response.status, 429);
    assert.ok(limited.response.headers.get("retry-after"));
    await f.restart();
    assert.equal((await f.api("/api/enquiries", { key, body })).body.reference, first.body.reference);
    const db = new DatabaseSync(f.databasePath);
    assert.equal((db.prepare("SELECT COUNT(*) AS count FROM enquiries").get() as { count: number }).count, 5);
    db.close();
  } finally { await f.dispose(); }
});

test("malformed, oversized and cross-site requests do not create records", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.api("/api/enquiries", { rawBody: "{broken", key: randomUUID() })).response.status, 400);
    assert.equal((await f.api("/api/enquiries", { rawBody: "[]", key: randomUUID() })).response.status, 422);
    assert.equal((await f.api("/api/enquiries", { rawBody: "null", key: randomUUID() })).response.status, 422);
    assert.equal((await f.api("/api/enquiries", { rawBody: JSON.stringify({ message: "x".repeat(17_000) }), key: randomUUID() })).response.status, 413);
    assert.equal((await f.api("/api/auth/logout", { body: {}, headers: { Origin: "" } })).response.status, 403);
    assert.equal((await f.api("/api/auth/logout", { body: {}, headers: { "Sec-Fetch-Site": "cross-site" } })).response.status, 403);
    const response = await f.api("/api/session?role=admin");
    assert.equal(response.response.status, 400);
    assert.ok(response.body.requestId);
    assert.equal(response.response.headers.get("x-content-type-options"), "nosniff");
    const db = new DatabaseSync(f.databasePath);
    assert.equal((db.prepare("SELECT COUNT(*) AS count FROM enquiries").get() as { count: number }).count, 0);
    db.close();
  } finally { await f.dispose(); }
});

test("expired sessions cannot read customer records and login limits survive restart", async () => {
  const f = await fixture();
  try {
    const account = await f.register("expiry@example.test");
    const db = new DatabaseSync(f.databasePath);
    db.prepare("UPDATE sessions SET expires_at=0").run();
    db.close();
    assert.deepEqual((await f.api("/api/session", { cookie: account.cookie })).body, { user: null });
    assert.equal((await f.api("/api/bookings", { cookie: account.cookie })).response.status, 401);
    for (let i = 0; i < 10; i++) assert.equal((await f.api("/api/auth/login", { body: { email: "expiry@example.test", password: "An incorrect passphrase 34" } })).response.status, 401);
    await f.restart();
    const limited = await f.api("/api/auth/login", { body: { email: "expiry@example.test", password } });
    assert.equal(limited.response.status, 429);
    assert.ok(limited.response.headers.get("retry-after"));
  } finally { await f.dispose(); }
});

test("static deployment serves deep links and assets while refusing file disclosure", async () => {
  const directory = await mkdtemp(join(tmpdir(), "slate-static-"));
  await mkdir(join(directory, "dist", "assets"), { recursive: true });
  await writeFile(join(directory, "dist", "index.html"), '<html><script>document.title="Slate"</script><div id="root"></div></html>');
  await writeFile(join(directory, "dist", "assets", "app.js"), "console.log('Slate')");
  await writeFile(join(directory, "dist", ".env"), "PRIVATE_CONTENT");
  const server = createServer({ databasePath: join(directory, "data.sqlite"), staticDirectory: join(directory, "dist"), origin: "https://slate.example", logger: () => {} });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const deep = await fetch(`${base}/household/bookings`);
    assert.equal(deep.status, 200);
    assert.match(await deep.text(), /id="root"/);
    assert.match(deep.headers.get("content-security-policy") || "", /script-src 'self' 'sha256-/);
    assert.ok(deep.headers.get("strict-transport-security"));
    const asset = await fetch(`${base}/assets/app.js`);
    assert.equal(asset.headers.get("cache-control"), "public, max-age=31536000, immutable");
    assert.match(asset.headers.get("content-type") || "", /javascript/);
    assert.equal((await fetch(`${base}/.env`)).status, 404);
    assert.equal((await fetch(`${base}/missing.js`)).status, 404);
    assert.equal((await fetch(`${base}/api/missing`)).status, 404);
    const login = await fetch(`${base}/api/auth/register`, { method: "POST", headers: { Origin: "https://slate.example", "Content-Type": "application/json" }, body: JSON.stringify({ name: "Secure User", email: "secure@example.test", phone: "+2348000000000", password, termsVersion: "2026-10-18" }) });
    assert.equal(login.status, 201);
    assert.match(login.headers.get("set-cookie") || "", /; Secure/);
  } finally {
    server.close(); server.closeAllConnections(); await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
});

test("trusted gateway IPs separate client limits while spoofed headers are ignored", async () => {
  const trusted = await fixture(["127.0.0.1"]);
  const untrusted = await fixture();
  try {
    const request = (email: string) => ({ name: "Proxy Test", email, phone: "+2348000000000", password, termsVersion: "2026-10-18" });
    for (let index = 0; index < 6; index++) {
      const headers = { "X-Real-IP": `198.51.100.${index + 1}` };
      const separate = await trusted.api("/api/auth/register", { body: request(`trusted-${index}@example.test`), headers });
      assert.equal(separate.response.status, 201);
      const pooled = await untrusted.api("/api/auth/register", { body: request(`untrusted-${index}@example.test`), headers });
      assert.equal(pooled.response.status, index < 5 ? 201 : 429);
    }
    const invalid = await trusted.api("/api/auth/login", { body: { email: "person@example.test", password }, headers: { "X-Real-IP": "198.51.100.1, 203.0.113.2" } });
    assert.equal(invalid.response.status, 400);
    assert.equal(invalid.body.error.code, "PROXY_CLIENT_IP");
    const missing = await trusted.api("/api/auth/login", { body: { email: "person@example.test", password } });
    assert.equal(missing.response.status, 400);
  } finally { await trusted.dispose(); await untrusted.dispose(); }
});
