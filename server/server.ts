import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { createReadStream, readFileSync, realpathSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { isIP } from "node:net";
import { openStore, type Row, type Store, type StoreConnection } from "./store.ts";
import { DatabaseBusyError, openPostgres } from "./postgres.ts";
import { BOOKING_AREAS, BOOKING_SERVICES, BOOKING_WINDOWS, ENQUIRY_CATEGORIES, TERMS_VERSION } from "./contracts.ts";
import type { Booking, BookingInput, EnquiryInput, SessionUser, SupportTicket, TicketInput } from "./contracts.ts";
import { AuthError, createAuthHandler, type OAuthSettings } from "./auth.ts";

function scryptAsync(value: string, salt: string) {
  return new Promise<Buffer>((resolveHash, reject) => {
    scrypt(value, salt, 64, scryptOptions, (error, hash) => error ? reject(error) : resolveHash(hash));
  });
}
const SESSION_SECONDS = 60 * 60 * 12;
const COOKIE = "slate_session";
const MAX_BODY_BYTES = 16_384;
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const dummySalt = randomBytes(16).toString("hex");
const dummyHash = randomBytes(64).toString("hex");

class ApiError extends AuthError {}

export interface ServerOptions {
  databasePath?: string;
  databaseUrl?: string;
  origin: string;
  staticDirectory?: string;
  secureCookies?: boolean;
  trustedProxyIPs?: string[];
  logger?: (record: Record<string, string | number>) => void;
  oauth?: OAuthSettings;
  /** Transport injection for isolated, signed-provider integration tests. URLs stay fixed. */
  authFetch?: typeof fetch;
}

function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(422, "VALIDATION_ERROR", "Enter the required form fields.");
  return value as Record<string, unknown>;
}
function exact(body: Record<string, unknown>, keys: string[]) {
  const unknown = Object.keys(body).filter(key => !keys.includes(key));
  if (unknown.length) throw new ApiError(422, "VALIDATION_ERROR", "Remove the unsupported form fields.", Object.fromEntries(unknown.map(key => [key, "This field is not accepted."])));
}
function field(body: Record<string, unknown>, key: string, min: number, max: number, optional = false): string {
  const value = body[key];
  if (optional && (value === undefined || value === "")) return "";
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Check the highlighted field.", { [key]: `Enter ${min} to ${max} characters.` });
  }
  return value.trim();
}
function email(body: Record<string, unknown>) {
  const value = field(body, "email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new ApiError(422, "VALIDATION_ERROR", "Enter a valid email address.", { email: "Use an address such as name@example.com." });
  return value;
}
function phone(body: Record<string, unknown>, optional = false) {
  const value = field(body, "phone", 7, 32, optional);
  if (value && !/^\+?[\d ()-]{7,32}$/.test(value)) throw new ApiError(422, "VALIDATION_ERROR", "Enter a valid phone number.", { phone: "Use a phone number with its country code." });
  return value;
}
function password(body: Record<string, unknown>) {
  const value = body.password;
  if (typeof value !== "string" || value.length < 12 || value.length > 128 || value.trim().length < 12) throw new ApiError(422, "VALIDATION_ERROR", "Use a password with 12 to 128 characters.", { password: "Use at least 12 characters." });
  return value;
}
function oneOf<T extends string>(value: string, choices: readonly T[], key: string): T {
  if (!choices.includes(value as T)) throw new ApiError(422, "VALIDATION_ERROR", "Choose an available option.", { [key]: "Choose an option from the list." });
  return value as T;
}
function date(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const todayTime = new Date(`${today}T00:00:00Z`).getTime();
  const days = (parsed.getTime() - todayTime) / 86400000;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value || days < 1 || days > 90) {
    throw new ApiError(422, "VALIDATION_ERROR", "Choose a date from tomorrow through the next 90 days.", { date: "Choose a valid date within the next 90 days." });
  }
  return value;
}
function bookingInput(body: Record<string, unknown>): BookingInput {
  exact(body, ["serviceId", "address", "area", "date", "window", "notes"]);
  return { serviceId: oneOf(field(body, "serviceId", 1, 80), BOOKING_SERVICES.map(service => service.id), "serviceId"), address: field(body, "address", 8, 300), area: oneOf(field(body, "area", 2, 100), BOOKING_AREAS, "area"), date: date(field(body, "date", 10, 10)), window: oneOf(field(body, "window", 1, 20), BOOKING_WINDOWS, "window"), notes: field(body, "notes", 0, 2000, true) };
}
function userFrom(row: Row): SessionUser {
  return { id: String(row.id), name: String(row.name), email: String(row.email), phone: String(row.phone), role: "household" };
}
function bookingFrom(row: Row): Booking {
  const payload = JSON.parse(String(row.payload)) as BookingInput;
  return { ...payload, id: String(row.id), reference: String(row.reference), serviceName: BOOKING_SERVICES.find(service => service.id === payload.serviceId)!.name, status: row.status as Booking["status"], createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}
function ticketFrom(row: Row): SupportTicket {
  return { ...JSON.parse(String(row.payload)) as TicketInput, id: String(row.id), reference: String(row.reference), status: "open", createdAt: String(row.created_at) };
}
async function hashPassword(value: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(value, salt);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}
async function verifyPassword(value: string, stored?: string) {
  const valid = typeof stored === "string" && /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(stored);
  const [, salt, expected] = (valid ? stored : `scrypt$${dummySalt}$${dummyHash}`).split("$");
  const actual = await scryptAsync(value, salt!);
  return timingSafeEqual(actual, Buffer.from(expected!, "hex")) && valid;
}
function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  if (request.headers["content-type"]?.split(";")[0]?.trim().toLowerCase() !== "application/json") throw new ApiError(415, "CONTENT_TYPE", "Send this request as application/json.");
  if (request.headers["content-encoding"] && request.headers["content-encoding"] !== "identity") throw new ApiError(415, "CONTENT_ENCODING", "Compressed request bodies are not accepted.");
  if (Number(request.headers["content-length"]) > MAX_BODY_BYTES) throw new ApiError(413, "BODY_TOO_LARGE", "Keep the form below 16 KB.");
  return new Promise((resolveBody, reject) => {
    let size = 0;
    let oversized = false;
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) { if (!oversized) reject(new ApiError(413, "BODY_TOO_LARGE", "Keep the form below 16 KB.")); oversized = true; chunks.length = 0; return; }
      if (!oversized) chunks.push(chunk);
    });
    request.on("end", () => {
      if (oversized) return;
      try { resolveBody(object(JSON.parse(Buffer.concat(chunks).toString("utf8")))); }
      catch (error) { reject(error instanceof ApiError ? error : new ApiError(400, "INVALID_JSON", "Send a valid JSON form.")); }
    });
    request.on("error", reject);
    request.on("aborted", () => reject(new ApiError(400, "INCOMPLETE_REQUEST", "The form did not finish uploading. Try again.")));
  });
}

async function rateLimit(db: StoreConnection, bucket: string, limit: number, seconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db.get(`INSERT INTO rate_limits(bucket,count,resets_at) VALUES(?,1,?)
    ON CONFLICT(bucket) DO UPDATE SET
      count=CASE WHEN rate_limits.resets_at<=? THEN 1 ELSE rate_limits.count+1 END,
      resets_at=CASE WHEN rate_limits.resets_at<=? THEN excluded.resets_at ELSE rate_limits.resets_at END
    RETURNING count,resets_at`, bucket, now + seconds, now, now);
  if (Number(row!.count) > limit) throw new ApiError(429, "RATE_LIMITED", "Too many attempts. Please try again later.", undefined, Math.max(1, Number(row!.resets_at) - now));
}
function cookieToken(request: IncomingMessage) {
  const value = request.headers.cookie?.split(";").map(piece => piece.trim()).find(piece => piece.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}
async function currentUser(db: StoreConnection, request: IncomingMessage): Promise<SessionUser | null> {
  const token = cookieToken(request);
  if (!token) return null;
  const row = await db.get("SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>? AND users.role='household'", digest(token), Math.floor(Date.now() / 1000)) as Row | undefined;
  return row ? userFrom(row) : null;
}
async function requireUser(db: StoreConnection, request: IncomingMessage) {
  const user = await currentUser(db, request);
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
  return user;
}
function sessionCookie(value: string, secure: boolean, seconds = SESSION_SECONDS) {
  return `${COOKIE}=${value}; Path=/; Max-Age=${seconds}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}
async function createSession(db: StoreConnection, userId: string, request: IncomingMessage) {
  const token = randomBytes(32).toString("hex");
  const old = cookieToken(request);
  if (old) await db.run("DELETE FROM sessions WHERE token_hash=?", digest(old));
  const now = Math.floor(Date.now() / 1000);
  await db.run("INSERT INTO sessions(token_hash,user_id,expires_at,authenticated_at) VALUES(?,?,?,?)", digest(token), userId, now + SESSION_SECONDS, now);
  return token;
}
async function idempotent(db: Store, request: IncomingMessage, scope: string, input: unknown, operation: (transaction: StoreConnection) => Promise<unknown>) {
  const key = request.headers["idempotency-key"];
  if (typeof key !== "string" || !/^[a-zA-Z0-9_-]{8,128}$/.test(key)) throw new ApiError(400, "IDEMPOTENCY_KEY", "Include a unique Idempotency-Key with this submission.");
  const payloadHash = digest(JSON.stringify(input));
  return db.transaction(async transaction => {
    await transaction.lock(JSON.stringify([scope, key]));
    const previous = await transaction.get("SELECT payload_hash,response FROM idempotency WHERE scope=? AND key=?", scope, key);
    if (previous) {
      if (previous.payload_hash !== payloadHash) throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "This submission key was already used for a different form. Start a new submission.");
      return JSON.parse(String(previous.response));
    }
    const body = await operation(transaction);
    await transaction.run("INSERT INTO idempotency(scope,key,payload_hash,status,response,expires_at) VALUES(?,?,?,201,?,?)", scope, key, payloadHash, JSON.stringify(body), Math.floor(Date.now() / 1000) + 86400);
    return body;
  });
}

function send(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

export function createServer(options: ServerOptions) {
  const normalizeIP = (value: string) => value.replace(/^::ffff:/, "");
  const trustedProxies = new Set((options.trustedProxyIPs ?? []).map(normalizeIP));
  if ([...trustedProxies].some(address => !isIP(address))) throw new Error("Trusted proxies must be exact IP addresses.");
  const configuredOrigin = new URL(options.origin).origin;
  const secure = options.secureCookies ?? configuredOrigin.startsWith("https:");
  if (process.env.NODE_ENV === "production" && (!secure || !configuredOrigin.startsWith("https:"))) throw new Error("Production requires an HTTPS APP_ORIGIN and secure cookies.");
  const logger = options.logger || ((record) => process.stdout.write(`${JSON.stringify(record)}\n`));
  const staticRoot = options.staticDirectory ? realpathSync(options.staticDirectory) : undefined;
  const inlineHashes = staticRoot ? [...readFileSync(resolve(staticRoot, "index.html"), "utf8").matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].filter(match => match[1]?.trim()).map(match => `'sha256-${createHash("sha256").update(match[1]!).digest("base64")}'`).join(" ") : "";
  const csp = `default-src 'self'; script-src 'self' ${inlineHashes}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`;
  const db = options.databaseUrl ? openPostgres(options.databaseUrl, () => logger({ event: "database_connection_error" })) : openStore(options.databasePath || "data/slate.sqlite");
  const auth = createAuthHandler(db, configuredOrigin, secure, options.oauth ?? {}, { readBody, currentUser, createSession, sessionCookie, verifyPassword, rateLimit, audit: logger }, options.authFetch);
  let requests = 0;

  const server = createHttpServer({ maxHeaderSize: 16_384 }, async (request, response) => {
    const requestId = randomUUID();
    const started = Date.now();
    response.setHeader("X-Request-Id", requestId);
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.setHeader("Content-Security-Policy", csp);
    if (secure) response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    let route = "unknown";
    try {
      const url = new URL(request.url || "/", configuredOrigin);
      route = /^\/api\/(?:health|session|auth\/(?:register|login|logout|config|signup|security|reauthenticate|oauth\/(?:google|apple)\/(?:start|callback)|passkeys\/(?:register|login|reauthenticate)\/(?:options|verify))|enquiries|bookings|tickets)$/.test(url.pathname)
        ? url.pathname
        : /^\/api\/(?:bookings|tickets)\/[a-f0-9-]{36}$/.test(url.pathname)
          ? url.pathname.replace(/[a-f0-9-]{36}$/, ":id")
          : /^\/api\/auth\/passkeys\/[A-Za-z0-9_-]{1,2048}$/.test(url.pathname) ? "/api/auth/passkeys/:id"
          : url.pathname.startsWith("/api/") ? "/api/unknown" : "static";
      const method = request.method || "GET";
      const pathname = url.pathname;
      if (pathname.startsWith("/api/")) {
        await db.ready;
        response.setHeader("Cache-Control", "no-store");
        const googleCallback = pathname === "/api/auth/oauth/google/callback" && method === "GET";
        const appleCallback = pathname === "/api/auth/oauth/apple/callback" && method === "POST";
        if (url.search && !googleCallback) throw new ApiError(400, "QUERY_NOT_SUPPORTED", "Remove the unsupported query parameters.");
        if (++requests % 100 === 0) {
          const now = Math.floor(Date.now() / 1000);
          await db.run("DELETE FROM sessions WHERE expires_at<=?", now);
          await db.run("DELETE FROM rate_limits WHERE resets_at<=?", now);
          await db.run("DELETE FROM idempotency WHERE expires_at<=?", now);
          await db.run("DELETE FROM auth_flows WHERE expires_at<=?", now);
        }
        if (method === "GET" && pathname === "/api/health") { await db.get("SELECT 1"); send(response, 200, { status: "ok" }); return; }
        if (method === "GET" && pathname === "/api/session") { send(response, 200, { user: await currentUser(db, request) }); return; }
        const peer = normalizeIP(request.socket.remoteAddress || "unknown");
        let client = peer;
        if (trustedProxies.has(peer)) {
          const forwarded = request.headers["x-real-ip"];
          if (typeof forwarded !== "string" || !isIP(forwarded)) throw new ApiError(400, "PROXY_CLIENT_IP", "The gateway could not identify this connection. Please try again later.");
          client = normalizeIP(forwarded);
        }
        const ip = digest(client);
        const mutation = !["GET", "HEAD"].includes(method);
        if (mutation && !appleCallback) {
          if (request.headers.origin !== configuredOrigin || request.headers["sec-fetch-site"] === "cross-site") throw new ApiError(403, "ORIGIN_REJECTED", "Open Slate in its own browser tab and try again.");
          await rateLimit(db, `mutation:${ip}`, 120, 60);
        }
        if (await auth(request, response, url, ip)) return;
        if (method === "POST" && pathname === "/api/auth/register") {
          await rateLimit(db, `register:${ip}`, 5, 3600);
          const body = await readBody(request);
          exact(body, ["name", "email", "phone", "password", "termsVersion"]);
          const name = field(body, "name", 2, 120);
          const address = email(body);
          const number = phone(body);
          const secret = password(body);
          if (body.termsVersion !== TERMS_VERSION) throw new ApiError(422, "TERMS_REQUIRED", "Read and accept the current terms to create an account.", { termsVersion: "Accept the current terms." });
          const hash = await hashPassword(secret);
          const id = randomUUID();
          const now = new Date().toISOString();
          let token: string;
          try {
            token = await db.transaction(async transaction => {
              await transaction.run("INSERT INTO users(id,name,email,phone,password_hash,terms_version,terms_accepted_at,created_at) VALUES(?,?,?,?,?,?,?,?)", id, name, address, number, hash, TERMS_VERSION, now, now);
              return createSession(transaction, id, request);
            });
          }
          catch (error) { if (String(error).includes("UNIQUE constraint failed: users.email") || (error && typeof error === "object" && "code" in error && error.code === "23505" && "constraint" in error && error.constraint === "users_email_key")) throw new ApiError(409, "ACCOUNT_EXISTS", "An account with this email already exists. Sign in or contact support."); throw error; }
          response.setHeader("Set-Cookie", sessionCookie(token, secure));
          send(response, 201, { user: { id, name, email: address, phone: number, role: "household" } }); return;
        }
        if (method === "POST" && pathname === "/api/auth/login") {
          await rateLimit(db, `login-ip:${ip}`, 20, 900);
          const body = await readBody(request);
          exact(body, ["email", "password"]);
          const address = email(body);
          const secret = password(body);
          await rateLimit(db, `login-email:${digest(address)}`, 10, 900);
          const row = await db.get("SELECT * FROM users WHERE email=? AND role='household'", address) as Row | undefined;
          if (!await verifyPassword(secret, row ? String(row.password_hash) : undefined)) throw new ApiError(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
          const token = await db.transaction(transaction => createSession(transaction, String(row!.id), request));
          response.setHeader("Set-Cookie", sessionCookie(token, secure));
          send(response, 200, { user: userFrom(row!) }); return;
        }
        if (method === "POST" && pathname === "/api/auth/logout") {
          const body = await readBody(request); exact(body, []);
          const token = cookieToken(request);
          if (token) await db.run("DELETE FROM sessions WHERE token_hash=?", digest(token));
          response.setHeader("Set-Cookie", sessionCookie("", secure, 0));
          send(response, 200, { user: null }); return;
        }
        if (method === "POST" && pathname === "/api/enquiries") {
          const body = await readBody(request); exact(body, ["name", "email", "phone", "category", "message"]);
          const input: EnquiryInput = { name: field(body, "name", 2, 120), email: email(body), phone: phone(body, true), category: oneOf(field(body, "category", 2, 80), ENQUIRY_CATEGORIES, "category"), message: field(body, "message", 10, 4000) };
          const result = await idempotent(db, request, `enquiries:${ip}`, input, async transaction => {
            await rateLimit(transaction, `enquiries:${ip}`, 5, 3600);
            const id = randomUUID(); const reference = `ENQ-${id.slice(0, 8).toUpperCase()}`;
            await transaction.run("INSERT INTO enquiries(id,reference,payload,created_at) VALUES(?,?,?,?)", id, reference, JSON.stringify(input), new Date().toISOString());
            return { reference };
          });
          send(response, 201, result); return;
        }
        if (pathname === "/api/bookings" || pathname.startsWith("/api/bookings/")) {
          const user = await requireUser(db, request);
          if (method === "GET" && pathname === "/api/bookings") {
            send(response, 200, { bookings: (await db.all("SELECT * FROM bookings WHERE user_id=? ORDER BY created_at DESC LIMIT 100", user.id) as Row[]).map(bookingFrom) }); return;
          }
          if (method === "POST" && pathname === "/api/bookings") {
            const input = bookingInput(await readBody(request));
            const result = await idempotent(db, request, `bookings:${user.id}`, input, async transaction => {
              await rateLimit(transaction, `bookings:${user.id}`, 20, 3600);
              const id = randomUUID(); const now = new Date().toISOString();
              await transaction.run("INSERT INTO bookings(id,user_id,reference,payload,status,created_at,updated_at) VALUES(?,?,?,?,'requested',?,?)", id, user.id, `REQ-${id.slice(0, 8).toUpperCase()}`, JSON.stringify(input), now, now);
              return { booking: bookingFrom(await transaction.get("SELECT * FROM bookings WHERE id=?", id) as Row) };
            });
            send(response, 201, result); return;
          }
          const id = pathname.slice("/api/bookings/".length);
          const row = await db.get("SELECT * FROM bookings WHERE id=? AND user_id=?", id, user.id) as Row | undefined;
          if (!row) throw new ApiError(404, "NOT_FOUND", "The service request could not be found.");
          if (method === "GET") { send(response, 200, { booking: bookingFrom(row) }); return; }
          if (method === "PATCH") {
            const body = await readBody(request); exact(body, ["status"]);
            if (body.status !== "cancelled") throw new ApiError(422, "VALIDATION_ERROR", "Only cancellation is supported.", { status: "Choose cancelled." });
            await db.run("UPDATE bookings SET status='cancelled',updated_at=? WHERE id=? AND user_id=? AND status='requested'", new Date().toISOString(), id, user.id);
            send(response, 200, { booking: bookingFrom(await db.get("SELECT * FROM bookings WHERE id=? AND user_id=?", id, user.id) as Row) }); return;
          }
        }
        if (pathname === "/api/tickets" || pathname.startsWith("/api/tickets/")) {
          const user = await requireUser(db, request);
          if (method === "GET" && pathname === "/api/tickets") {
            send(response, 200, { tickets: (await db.all("SELECT * FROM tickets WHERE user_id=? ORDER BY created_at DESC LIMIT 100", user.id) as Row[]).map(ticketFrom) }); return;
          }
          if (method === "POST" && pathname === "/api/tickets") {
            const body = await readBody(request); exact(body, ["subject", "message", "bookingId"]);
            const input: TicketInput = { subject: field(body, "subject", 5, 160), message: field(body, "message", 10, 4000), ...(body.bookingId ? { bookingId: field(body, "bookingId", 36, 36) } : {}) };
            if (input.bookingId && !await db.get("SELECT id FROM bookings WHERE id=? AND user_id=?", input.bookingId, user.id)) throw new ApiError(404, "NOT_FOUND", "The service request could not be found.");
            const result = await idempotent(db, request, `tickets:${user.id}`, input, async transaction => {
              await rateLimit(transaction, `tickets:${user.id}`, 20, 3600);
              const id = randomUUID(); const now = new Date().toISOString();
              await transaction.run("INSERT INTO tickets(id,user_id,reference,booking_id,payload,created_at) VALUES(?,?,?,?,?,?)", id, user.id, `SUP-${id.slice(0, 8).toUpperCase()}`, input.bookingId || null, JSON.stringify(input), now);
              return { ticket: ticketFrom(await transaction.get("SELECT * FROM tickets WHERE id=?", id) as Row) };
            });
            send(response, 201, result); return;
          }
          if (method === "GET") {
            const row = await db.get("SELECT * FROM tickets WHERE id=? AND user_id=?", pathname.slice("/api/tickets/".length), user.id) as Row | undefined;
            if (!row) throw new ApiError(404, "NOT_FOUND", "The support request could not be found.");
            send(response, 200, { ticket: ticketFrom(row) }); return;
          }
        }
        throw new ApiError(404, "NOT_FOUND", "This API route does not exist.");
      }
      if (!staticRoot || !["GET", "HEAD"].includes(method)) throw new ApiError(404, "NOT_FOUND", "This page could not be found.");
      let decoded: string;
      try { decoded = decodeURIComponent(pathname); } catch { throw new ApiError(400, "INVALID_PATH", "This address is invalid."); }
      if (decoded.includes("\0") || decoded.split(/[\\/]/).some(part => part.startsWith("."))) throw new ApiError(404, "NOT_FOUND", "This page could not be found.");
      let target = resolve(staticRoot, `.${decoded}`);
      if (!target.startsWith(`${staticRoot}${sep}`) && target !== staticRoot) throw new ApiError(404, "NOT_FOUND", "This page could not be found.");
      try { if (!statSync(target).isFile()) throw new Error("not-file"); target = realpathSync(target); }
      catch { if (extname(decoded)) throw new ApiError(404, "NOT_FOUND", "This file could not be found."); target = resolve(staticRoot, "index.html"); }
      if (!target.startsWith(`${staticRoot}${sep}`)) throw new ApiError(404, "NOT_FOUND", "This file could not be found.");
      const types: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".json": "application/json" };
      response.writeHead(200, { "Content-Type": types[extname(target)] || "application/octet-stream", "Cache-Control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache", "Content-Length": statSync(target).size });
      if (method === "HEAD") response.end(); else createReadStream(target).on("error", () => response.destroy()).pipe(response);
    } catch (caught) {
      const error = caught instanceof DatabaseBusyError ? new ApiError(503, "SERVICE_BUSY", caught.message, undefined, 1) : caught;
      const known = error instanceof AuthError;
      const status = known ? error.status : 500;
      if (known && error.retryAfter) response.setHeader("Retry-After", String(error.retryAfter));
      if (!response.headersSent) send(response, status, { error: { code: known ? error.code : "INTERNAL_ERROR", message: known ? error.message : "Something went wrong. Please try again.", ...(known && error.fields ? { fields: error.fields } : {}) }, requestId });
      else response.destroy();
      const errorCode = known ? error.code : error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Z0-9_]{2,40}$/.test(error.code) ? error.code : "UNCLASSIFIED";
      logger({ event: status >= 500 ? "server_error" : "request_rejected", requestId, route, status, errorCode });
    } finally {
      logger({ event: "request", requestId, method: request.method || "GET", route, status: response.statusCode, durationMs: Date.now() - started });
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxRequestsPerSocket = 1000;
  const databaseClosed = new Promise<void>((resolveClosed, rejectClosed) => {
    server.on("close", () => { db.close().then(resolveClosed, rejectClosed); });
  });
  return Object.assign(server, { ready: db.ready, databaseClosed });
}
