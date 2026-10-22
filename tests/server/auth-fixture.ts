import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, generateKeyPairSync, randomBytes, randomUUID, sign } from "node:crypto";
import { Pool } from "pg";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { isoCBOR } from "@simplewebauthn/server/helpers";
import { createServer, type ServerOptions } from "../../server/server.ts";
import { openStore, type Store } from "../../server/store.ts";
import { openPostgres } from "../../server/postgres.ts";

export const password = "A long fixture password 341!";
export const defaultOrigin = "http://localhost:5173";
export const digest = (value: string | Uint8Array) => createHash("sha256").update(value).digest();
export const b64 = (value: string | Uint8Array) => Buffer.from(value).toString("base64url");
export function responseCookie(response: Response, name: string) { return response.headers.getSetCookie().find(value => value.startsWith(`${name}=`))?.split(";")[0] ?? ""; }
export async function authFixture(options: Partial<ServerOptions> = {}, postgres = false) {
  const directory = await mkdtemp(join(tmpdir(), "slate-auth-"));
  let admin: Pool | undefined; let schema: string | undefined; let databaseUrl: string | undefined;
  if (postgres) {
    assert.ok(process.env.SLATE_TEST_DATABASE_URL);
    const url = new URL(process.env.SLATE_TEST_DATABASE_URL);
    for (const key of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert", "channel_binding"]) url.searchParams.delete(key);
    // Retain the schema-control connection throughout a slow hosted integration test.
    admin = new Pool({ connectionString: url.href, ssl: { rejectUnauthorized: true }, max: 1, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 0, statement_timeout: 10_000, lock_timeout: 5_000 });
    schema = `slate_test_${randomUUID().replaceAll("-", "")}`;
    await admin.query(`CREATE SCHEMA ${schema}`);
    url.searchParams.set("options", `-c search_path=${schema}`); databaseUrl = url.href;
  }
  const databasePath = join(directory, "data.sqlite");
  const store: Store = databaseUrl ? openPostgres(databaseUrl, () => {}) : openStore(databasePath);
  await store.ready;
  const servers: ReturnType<typeof createServer>[] = [];
  const origin = options.origin ?? defaultOrigin;
  async function addServer() {
    const server = createServer({ databasePath, databaseUrl, origin, logger: () => {}, ...options });
    await server.ready; server.listen(0, "127.0.0.1"); await once(server, "listening"); servers.push(server);
  }
  await addServer();
  async function stop() { for (const server of servers.splice(0)) { server.close(); server.closeAllConnections(); await once(server, "close"); await server.databaseClosed; } }
  async function api(path: string, values: { method?: string; body?: unknown; cookie?: string; headers?: Record<string, string>; server?: number; rawBody?: string } = {}) {
    const address = servers[values.server ?? 0]!.address(); assert.ok(address && typeof address === "object");
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, { redirect: "manual", method: values.method ?? (values.body !== undefined || values.rawBody !== undefined ? "POST" : "GET"), headers: { Origin: origin, "Content-Type": "application/json", ...(values.cookie ? { Cookie: values.cookie } : {}), ...values.headers }, ...(values.rawBody !== undefined ? { body: values.rawBody } : values.body !== undefined ? { body: JSON.stringify(values.body) } : {}) });
    const body = response.headers.get("content-type")?.startsWith("application/json") ? await response.json() as any : null;
    return { response, body, cookie: responseCookie(response, "slate_session") };
  }
  async function register(email = `${randomUUID()}@example.test`) {
    const result = await api("/api/auth/register", { body: { name: "Auth Customer", email, phone: "+2348000000000", password, termsVersion: "2026-10-18" } });
    assert.equal(result.response.status, 201, JSON.stringify(result.body)); return result;
  }
  return { api, register, store, addServer, origin, databasePath, databaseUrl, restart: async () => { await stop(); await addServer(); }, dispose: async () => { await stop(); await store.close(); if (admin && schema) { try { await admin.query(`DROP SCHEMA ${schema} CASCADE`); } catch (error) { process.stderr.write(`${JSON.stringify({ event: "test_schema_cleanup_failed", schema })}\n`); throw error; } finally { await admin.end(); } } await rm(directory, { recursive: true, force: true }); } };
}

// A local software authenticator creates real P-256 WebAuthn signatures. It never touches device biometrics.
export function authenticator(userId: string, origin = defaultOrigin) {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const jwk = publicKey.export({ format: "jwk" });
  const id = randomBytes(32); const rpID = new URL(origin).hostname;
  const clientData = (type: string, challenge: string, extra: Record<string, unknown> = {}) => Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false, ...extra }));
  return {
    id: b64(id),
    registration(challenge: string, extra: Record<string, unknown> = {}) {
      const { flags, rpID: alternateRP, ...clientExtra } = extra;
      const cose = isoCBOR.encode(new Map<number, any>([[1, 2], [3, -7], [-1, 1], [-2, Buffer.from(jwk.x!, "base64url")], [-3, Buffer.from(jwk.y!, "base64url")]]));
      const length = Buffer.alloc(2); length.writeUInt16BE(id.length);
      const authData = Buffer.concat([digest(typeof alternateRP === "string" ? alternateRP : rpID), Buffer.from([typeof flags === "number" ? flags : 0x45]), Buffer.alloc(4), Buffer.alloc(16), length, id, cose]);
      const attestation = isoCBOR.encode(new Map<string, any>([["fmt", "none"], ["attStmt", new Map()], ["authData", authData]]));
      return { id: b64(id), rawId: b64(id), type: "public-key", response: { clientDataJSON: b64(clientData("webauthn.create", challenge, clientExtra)), attestationObject: b64(attestation), transports: ["internal"] }, clientExtensionResults: {}, authenticatorAttachment: "platform" };
    },
    assertion(challenge: string, counter = 1, extra: { flags?: number; origin?: string; userHandle?: string; signature?: string } = {}) {
      const count = Buffer.alloc(4); count.writeUInt32BE(counter);
      const authData = Buffer.concat([digest(rpID), Buffer.from([extra.flags ?? 0x05]), count]);
      const data = clientData("webauthn.get", challenge, extra.origin ? { origin: extra.origin } : {});
      return { id: b64(id), rawId: b64(id), type: "public-key", response: { clientDataJSON: b64(data), authenticatorData: b64(authData), signature: extra.signature ?? b64(sign("sha256", Buffer.concat([authData, digest(data)]), privateKey)), userHandle: extra.userHandle ?? b64(userId) }, clientExtensionResults: {}, authenticatorAttachment: "platform" };
    },
  };
}

export async function providerFixture() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const otherKey = await generateKeyPair("RS256");
  const publicJwk = { ...await exportJWK(publicKey), kid: "fixture-key", use: "sig", alg: "RS256" };
  const codes = new Map<string, { nonce: string; challenge: string; claims: Record<string, unknown>; provider: "google" | "apple" }>();
  const requests: string[] = [];
  let failNext = false;
  const transport: typeof fetch = async (input, init) => {
    const url = String(input); requests.push(new URL(url).origin + new URL(url).pathname);
    if (failNext) { failNext = false; throw new DOMException("Fixture provider timeout", "TimeoutError"); }
    if (["https://www.googleapis.com/oauth2/v3/certs", "https://appleid.apple.com/auth/keys"].includes(url)) return Response.json({ keys: [publicJwk] });
    assert.ok(["https://oauth2.googleapis.com/token", "https://appleid.apple.com/auth/token"].includes(url), "fixed provider endpoints only");
    const body = new URLSearchParams(String(init?.body)); const code = body.get("code")!; const identity = codes.get(code);
    assert.ok(identity, "known one-use authorization code"); codes.delete(code);
    if (identity.provider === "google") assert.equal(b64(digest(body.get("code_verifier")!)), identity.challenge, "Google uses PKCE S256");
    else assert.equal(body.has("code_verifier"), false, "Apple does not advertise PKCE");
    const { invalidSignature, ...claims } = identity.claims;
    const token = await new SignJWT({ sub: "provider-user", email: "provider@example.test", email_verified: true, name: "Provider Customer", nonce: identity.nonce, ...claims }).setProtectedHeader({ alg: "RS256", kid: "fixture-key" }).setIssuer(String(claims.iss ?? (identity.provider === "google" ? "https://accounts.google.com" : "https://appleid.apple.com"))).setAudience(String(claims.aud ?? "fixture-client")).setIssuedAt().setExpirationTime(typeof claims.exp === "number" ? claims.exp : "5m").sign(invalidSignature ? otherKey.privateKey : privateKey);
    return Response.json({ token_type: "Bearer", access_token: "fixture-access-token", id_token: token, expires_in: 300 });
  };
  function codeFor(authorizationUrl: string, claims: Record<string, unknown> = {}, provider: "google" | "apple" = "google") {
    const url = new URL(authorizationUrl); const code = randomUUID(); codes.set(code, { nonce: url.searchParams.get("nonce")!, challenge: url.searchParams.get("code_challenge")!, claims, provider });
    return new URLSearchParams({ state: url.searchParams.get("state")!, code });
  }
  return { transport, codeFor, requests, failNext: () => { failNext = true; } };
}
