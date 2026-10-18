import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { Pool } from "pg";
import { createServer } from "../../server/server.ts";
import { openPostgres } from "../../server/postgres.ts";

const databaseUrl = process.env.SLATE_TEST_DATABASE_URL;
const origin = "http://localhost:5173";
const password = randomBytes(24).toString("hex");
const booking = () => ({ serviceId: "svc-home-weekly", address: "18 Test Street", area: "Ewet Housing Estate", date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), window: "morning" });

async function fixture() {
  assert.ok(databaseUrl);
  const schema = `slate_test_${randomUUID().replaceAll("-", "")}`;
  const adminUrl = new URL(databaseUrl);
  for (const key of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert", "channel_binding"]) adminUrl.searchParams.delete(key);
  const admin = new Pool({ connectionString: adminUrl.href, ssl: { rejectUnauthorized: true }, max: 1, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 0, statement_timeout: 10_000, lock_timeout: 5_000 });
  try { await admin.query(`CREATE SCHEMA ${schema}`); }
  catch (error) { await admin.end(); throw error; }
  const scopedUrl = new URL(adminUrl);
  scopedUrl.searchParams.set("options", `-c search_path=${schema}`);
  const servers: ReturnType<typeof createServer>[] = [];
  const records: Record<string, string | number>[] = [];
  const store = openPostgres(scopedUrl.href, () => {});
  async function addServer() {
    const server = createServer({ databaseUrl: scopedUrl.href, origin, logger: record => { records.push(record); } });
    await server.ready;
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    servers.push(server);
    return server;
  }
  async function stopServers() {
    for (const server of servers.splice(0)) {
      server.close(); server.closeAllConnections();
      await once(server, "close");
      await server.databaseClosed;
    }
  }
  try { await store.ready; await addServer(); }
  catch (error) {
    await store.close();
    try { await admin.query(`DROP SCHEMA ${schema} CASCADE`); }
    catch { process.stderr.write(`${JSON.stringify({ event: "test_schema_cleanup_failed", schema })}\n`); }
    finally { await admin.end(); }
    throw error;
  }
  const api = async (path: string, options: { method?: string; body?: unknown; cookie?: string; key?: string; server?: number } = {}) => {
    const address = servers[options.server || 0]!.address();
    assert.ok(address && typeof address === "object");
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: options.method || (options.body ? "POST" : "GET"),
      headers: { Origin: origin, "Content-Type": "application/json", ...(options.cookie ? { Cookie: options.cookie } : {}), ...(options.key ? { "Idempotency-Key": options.key } : {}) },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
    return { response, body: await response.json() as any, cookie: response.headers.get("set-cookie")?.split(";")[0] || "" };
  };
  const register = async (email = `${randomUUID()}@example.test`) => {
    const result = await api("/api/auth/register", { body: { name: "Postgres Customer", email, phone: "+2348000000000", password, termsVersion: "2026-10-18" } });
    assert.equal(result.response.status, 201, JSON.stringify(result.body));
    return result;
  };
  return { api, register, store, scopedUrl, admin, schema, records, addServer, stopServers, restart: async () => { await stopServers(); await addServer(); }, dispose: async () => { await stopServers(); await store.close(); try { await admin.query(`DROP SCHEMA ${schema} CASCADE`); } finally { await admin.end(); } } };
}

test("PostgreSQL accounts, hashed sessions, expiry and revocation survive restart", { skip: !databaseUrl }, async () => {
  const f = await fixture();
  try {
    const account = await f.register();
    const user = await f.store.get("SELECT password_hash,role FROM users WHERE id=?", account.body.user.id);
    assert.match(String(user!.password_hash), /^scrypt\$/);
    assert.notEqual(user!.password_hash, password);
    assert.equal(user!.role, "household");
    const token = account.cookie.split("=")[1]!;
    const session = await f.store.get("SELECT token_hash FROM sessions");
    assert.equal(session!.token_hash, createHash("sha256").update(token).digest("hex"));
    await f.restart();
    assert.equal((await f.api("/api/session", { cookie: account.cookie })).body.user.id, account.body.user.id);
    const duplicate = await f.api("/api/auth/register", { body: { name: "Duplicate Customer", email: account.body.user.email, phone: "+2348000000000", password, termsVersion: "2026-10-18" } });
    assert.equal(duplicate.response.status, 409);
    await f.store.run("UPDATE sessions SET expires_at=0");
    assert.deepEqual((await f.api("/api/session", { cookie: account.cookie })).body, { user: null });
    const login = await f.api("/api/auth/login", { body: { email: account.body.user.email, password } });
    assert.equal(login.response.status, 200);
    await f.api("/api/auth/logout", { body: {}, cookie: login.cookie });
    assert.equal((await f.api("/api/bookings", { cookie: login.cookie })).response.status, 401);
  } finally { await f.dispose(); }
});

test("PostgreSQL concurrent workers create one booking per key and enforce ownership", { skip: !databaseUrl }, async () => {
  const f = await fixture();
  try {
    await f.addServer();
    const first = await f.register();
    const second = await f.register();
    const key = randomUUID();
    const input = booking();
    const results = await Promise.all(Array.from({ length: 10 }, (_, index) => f.api("/api/bookings", { server: index % 2, cookie: first.cookie, key, body: input })));
    assert.ok(results.every(result => result.response.status === 201), JSON.stringify(results.map(result => result.body)));
    assert.equal(new Set(results.map(result => result.body.booking.id)).size, 1);
    const id = results[0]!.body.booking.id;
    assert.equal(Number((await f.store.get("SELECT count(*) AS count FROM bookings"))!.count), 1);
    assert.equal(Number((await f.store.get("SELECT count FROM rate_limits WHERE bucket=?", `bookings:${first.body.user.id}`))!.count), 1);
    assert.equal((await f.api("/api/bookings", { cookie: first.cookie, key, body: { ...input, address: "A different address" } })).response.status, 409);
    assert.equal((await f.api(`/api/bookings/${id}`, { cookie: second.cookie })).response.status, 404);
    assert.equal((await f.api(`/api/bookings/${id}`, { method: "PATCH", cookie: second.cookie, body: { status: "cancelled" } })).response.status, 404);
    assert.equal((await f.api("/api/tickets", { cookie: second.cookie, key: randomUUID(), body: { subject: "Collection help", message: "Please check this collection for me.", bookingId: id } })).response.status, 404);
    const ticket = await f.api("/api/tickets", { cookie: first.cookie, key: randomUUID(), body: { subject: "Collection help", message: "Please check this collection for me.", bookingId: id } });
    assert.equal(ticket.response.status, 201);
    await f.restart();
    assert.equal((await f.api("/api/bookings", { cookie: first.cookie, key, body: input })).body.booking.id, id);
    assert.equal((await f.api("/api/tickets", { cookie: first.cookie })).body.tickets[0].id, ticket.body.ticket.id);
  } finally { await f.dispose(); }
});

test("PostgreSQL registration rolls back the account when session insertion fails", { skip: !databaseUrl }, async () => {
  const f = await fixture();
  try {
    await f.store.run("ALTER TABLE sessions ADD CONSTRAINT reject_test_session CHECK (false)");
    const email = `${randomUUID()}@example.test`;
    const body = { name: "Rollback Customer", email, phone: "+2348000000000", password, termsVersion: "2026-10-18" };
    const rejected = await f.api("/api/auth/register", { body });
    assert.equal(rejected.response.status, 500);
    assert.equal(rejected.response.headers.get("set-cookie"), null);
    assert.equal(Number((await f.store.get("SELECT count(*) AS count FROM users WHERE email=?", email))!.count), 0);
    assert.equal(Number((await f.store.get("SELECT count(*) AS count FROM sessions"))!.count), 0);
    await f.store.run("ALTER TABLE sessions DROP CONSTRAINT reject_test_session");
    const registered = await f.api("/api/auth/register", { body });
    assert.equal(registered.response.status, 201);
    assert.ok(registered.cookie);
    assert.equal((await f.api("/api/session", { cookie: registered.cookie })).body.user.email, email);
  } finally { await f.dispose(); }
});

test("PostgreSQL concurrent workers apply durable submission and login limits", { skip: !databaseUrl }, async t => {
  const f = await fixture();
  try {
    await f.addServer();
    const account = await f.register();
    const input = booking();
    const attempts: number[] = [];
    const results = await Promise.all(Array.from({ length: 25 }, async (_, index) => {
      const key = randomUUID();
      for (let attempt = 0; ; attempt++) {
        const result = await f.api("/api/bookings", { server: index % 2, cookie: account.cookie, key, body: input });
        attempts.push(result.response.status);
        if (result.response.status !== 503 || attempt === 3) return result;
        assert.equal(result.body.error.code, "SERVICE_BUSY");
        assert.equal(result.response.headers.get("retry-after"), "1");
        await new Promise(resolve => setTimeout(resolve, 1_000));
      }
    }));
    const statuses = Object.fromEntries([...new Set(results.map(result => result.response.status))].map(status => [status, results.filter(result => result.response.status === status).length]));
    t.diagnostic(JSON.stringify({ stage: "bookings", statuses, attempts, errors: f.records.filter(record => record.event === "server_error").map(record => record.errorCode) }));
    assert.deepEqual(statuses, { 201: 20, 429: 5 });
    const persisted = await f.admin.query(`SELECT count(*)::int AS count FROM ${f.schema}.bookings`);
    assert.equal(persisted.rows[0].count, 20);
    const wrongPassword = randomBytes(24).toString("hex");
    const logins = await Promise.all(Array.from({ length: 12 }, (_, index) => f.api("/api/auth/login", { server: index % 2, body: { email: account.body.user.email, password: wrongPassword } })));
    t.diagnostic(JSON.stringify({ stage: "logins", statuses: logins.map(result => result.response.status) }));
    assert.equal(logins.filter(result => result.response.status === 401).length, 10);
    assert.equal(logins.filter(result => result.response.status === 429).length, 2);
    await f.restart();
    assert.equal((await f.api("/api/bookings", { cookie: account.cookie, key: randomUUID(), body: input })).response.status, 429);
    assert.equal((await f.api("/api/auth/login", { body: { email: account.body.user.email, password } })).response.status, 429);
  } finally { await f.dispose(); }
});

test("PostgreSQL failed operations roll back and migration failures fail closed", { skip: !databaseUrl }, async () => {
  const f = await fixture();
  try {
    await assert.rejects(f.store.transaction(async db => {
      await db.run("INSERT INTO enquiries(id,reference,payload,created_at) VALUES(?,?,?,?)", randomUUID(), "ROLLBACK-TEST", "{}", new Date().toISOString());
      throw new Error("Deliberate test rollback");
    }), /Deliberate test rollback/);
    assert.equal(Number((await f.store.get("SELECT count(*) AS count FROM enquiries"))!.count), 0);
    await f.store.run("INSERT INTO schema_migrations(version,applied_at) VALUES(2,?)", new Date().toISOString());
    const unsupported = openPostgres(f.scopedUrl.href, () => {});
    await assert.rejects(unsupported.ready, /Database initialization failed/);
    await unsupported.close();
    assert.equal(Number((await f.store.get("SELECT count(*) AS count FROM enquiries"))!.count), 0);
  } finally { await f.dispose(); }
});

test("unavailable PostgreSQL prevents startup and redacts connection details", async () => {
  const credential = randomBytes(24).toString("hex");
  const child = spawn(process.execPath, ["server/index.ts"], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: "development", DATABASE_URL: `postgres://slate:${credential}@127.0.0.1:1/slate`, APP_ORIGIN: origin }, stdio: ["ignore", "pipe", "pipe"], timeout: 10_000 });
  let output = "";
  child.stdout.on("data", chunk => { output += String(chunk); });
  child.stderr.on("data", chunk => { output += String(chunk); });
  const [code] = await once(child, "exit");
  assert.equal(code, 1);
  assert.match(output, /database_startup_failed/);
  assert.doesNotMatch(output, /server_started/);
  assert.ok(!output.includes(credential));
});

test("PostgreSQL TLS verification cannot be disabled by URL parameters", { skip: !process.env.SLATE_TEST_UNTRUSTED_DATABASE_URL, timeout: 15_000 }, async () => {
  const url = new URL(process.env.SLATE_TEST_UNTRUSTED_DATABASE_URL!);
  url.searchParams.set("ssl", "0");
  url.searchParams.set("sslmode", "no-verify");
  url.searchParams.set("uselibpqcompat", "true");
  const environment: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "development", DATABASE_URL: url.href, APP_ORIGIN: origin };
  delete environment.NODE_EXTRA_CA_CERTS;
  delete environment.NODE_TLS_REJECT_UNAUTHORIZED;
  const child = spawn(process.execPath, ["server/index.ts"], { cwd: process.cwd(), env: environment, stdio: ["ignore", "pipe", "pipe"], timeout: 10_000 });
  let output = "";
  child.stdout.on("data", chunk => { output += String(chunk); });
  child.stderr.on("data", chunk => { output += String(chunk); });
  const [code] = await once(child, "exit");
  assert.equal(code, 1);
  assert.match(output, /database_startup_failed/);
  assert.doesNotMatch(output, /server_started/);
});
