import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import * as oidc from "openid-client";
import { importPKCS8, SignJWT } from "jose";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import type { Store, StoreConnection, Row } from "./store.ts";
import { TERMS_VERSION, type AuthProvider, type SessionUser } from "./contracts.ts";

const FLOW_SECONDS = 300;
const SIGNUP_SECONDS = 600;
const RECENT_SECONDS = 600;
const FLOW_COOKIE = "slate_oauth";
const SIGNUP_COOKIE = "slate_signup";
const PASSKEY_COOKIE = "slate_passkey";
const PASSWORD_PATTERN = /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const now = () => Math.floor(Date.now() / 1000);
const secret = () => randomBytes(32).toString("hex");

export class AuthError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  retryAfter?: number;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>, retryAfter?: number) {
    super(message); this.status = status; this.code = code; this.fields = fields; this.retryAfter = retryAfter;
  }
}
export interface OAuthSettings {
  google?: { clientId: string; clientSecret: string };
  apple?: { clientId: string; teamId: string; keyId: string; privateKey: string };
}
export interface AuthHooks {
  readBody(request: IncomingMessage): Promise<Record<string, unknown>>;
  currentUser(db: StoreConnection, request: IncomingMessage): Promise<SessionUser | null>;
  createSession(db: StoreConnection, userId: string, request: IncomingMessage): Promise<string>;
  sessionCookie(token: string, secure: boolean): string;
  verifyPassword(value: string, stored?: string): Promise<boolean>;
  rateLimit(db: StoreConnection, bucket: string, limit: number, seconds: number): Promise<void>;
  audit(record: { event: string; provider: AuthProvider; code: string }): void;
}
interface Flow { id: string; purpose: string; user_id: string | null; payload: string; browser_hash: string }
interface OAuthFlow {
  provider: AuthProvider; state: string; nonce: string; verifier?: string;
  intent: "login" | "signup" | "link"; next: string; sessionHash?: string;
}
interface VerifiedIdentity { provider: AuthProvider; subject: string; email: string; name: string; next: string }

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AuthError(422, "VALIDATION_ERROR", "Enter the required form fields.");
  return value as Record<string, unknown>;
}
function exact(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new AuthError(422, "VALIDATION_ERROR", "Remove the unsupported form fields.");
}
function text(body: Record<string, unknown>, key: string, min: number, max: number) {
  const value = body[key];
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new AuthError(422, "VALIDATION_ERROR", "Check the highlighted field.", { [key]: `Enter ${min} to ${max} characters.` });
  return value.trim();
}
function cookie(request: IncomingMessage, name: string) {
  const value = request.headers.cookie?.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}
function appendCookie(response: ServerResponse, value: string) {
  const previous = response.getHeader("Set-Cookie");
  response.setHeader("Set-Cookie", [...(Array.isArray(previous) ? previous.map(String) : previous ? [String(previous)] : []), value]);
}
function flowCookie(response: ServerResponse, name: string, value: string, secure: boolean, seconds = FLOW_SECONDS, crossSite = false) {
  appendCookie(response, `${name}=${value}; Path=/api/auth; Max-Age=${seconds}; HttpOnly; SameSite=${crossSite ? "None" : "Lax"}${secure ? "; Secure" : ""}`);
}
function userFrom(row: Row): SessionUser { return { id: String(row.id), name: String(row.name), email: String(row.email), phone: String(row.phone), role: "household" }; }
function nextPath(value: unknown) {
  return typeof value === "string" && value.length <= 500 && /^\/app(?:\/|$)/.test(value) && !/[\\\u0000-\u0020\u007f#]/.test(value) ? value : "/app/dashboard";
}
function json(response: ServerResponse, status: number, body: unknown) { response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); response.end(JSON.stringify(body)); }
function redirect(response: ServerResponse, location: string) { response.writeHead(303, { Location: location, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }); response.end(); }
function authFailure() { return new AuthError(401, "PASSKEY_FAILED", "The passkey could not be verified. Try again or use another sign-in method."); }
function flowFailure() { return new AuthError(410, "AUTH_EXPIRED", "This sign-in attempt expired or was already used. Please start again."); }
function collision() { return new AuthError(409, "ACCOUNT_EXISTS", "An account with this email already exists. Sign in to that account before connecting this provider."); }

async function readAppleForm(request: IncomingMessage) {
  if (request.headers["content-type"]?.split(";")[0]?.trim() !== "application/x-www-form-urlencoded" || (request.headers["content-encoding"] && request.headers["content-encoding"] !== "identity")) throw new AuthError(415, "CONTENT_TYPE", "The sign-in response is invalid.");
  let size = 0; const chunks: Buffer[] = [];
  for await (const part of request) { const chunk = Buffer.from(part); size += chunk.length; if (size > 16_384) throw new AuthError(413, "BODY_TOO_LARGE", "The sign-in response is too large."); chunks.push(chunk); }
  const form = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
  if ([...form.keys()].some(key => !["state", "code", "id_token", "user", "error", "error_description"].includes(key)) || [...new Set(form.keys())].some(key => form.getAll(key).length !== 1)) throw flowFailure();
  return form;
}

export function createAuthHandler(db: Store, origin: string, secure: boolean, settings: OAuthSettings, hooks: AuthHooks, providerFetch?: typeof fetch) {
  const rpID = new URL(origin).hostname;
  const passkeysEnabled = origin.startsWith("https://") || ["localhost", "127.0.0.1", "[::1]"].includes(rpID);
  const configured = (provider: AuthProvider) => provider === "google" ? Boolean(settings.google?.clientId && settings.google.clientSecret) : Boolean(secure && settings.apple?.clientId && settings.apple.teamId && settings.apple.keyId && settings.apple.privateKey);
  const configurations = new Map<AuthProvider, { config: oidc.Configuration; expiresAt: number }>();
  async function requireUser(request: IncomingMessage, recent = false) {
    const user = await hooks.currentUser(db, request);
    if (!user) throw new AuthError(401, "UNAUTHENTICATED", "Sign in to continue.");
    if (recent && !await isRecent(request)) throw new AuthError(403, "REAUTH_REQUIRED", "Confirm your sign-in before changing account security.");
    return user;
  }
  async function isRecent(request: IncomingMessage) {
    const token = cookie(request, "slate_session");
    if (!token) return false;
    const session = await db.get("SELECT authenticated_at FROM sessions WHERE token_hash=? AND expires_at>?", hash(token), now());
    return session?.authenticated_at !== null && Number(session?.authenticated_at ?? 0) >= now() - RECENT_SECONDS;
  }
  async function saveFlow(response: ServerResponse, name: string, purpose: string, payload: unknown, userId: string | null = null, seconds = FLOW_SECONDS, crossSite = false) {
    const token = secret();
    await db.run("INSERT INTO auth_flows(id,purpose,browser_hash,user_id,payload,expires_at) VALUES(?,?,?,?,?,?)", hash(token), purpose, hash(token), userId, JSON.stringify(payload), now() + seconds);
    flowCookie(response, name, token, secure, seconds, crossSite);
    return token;
  }
  async function takeFlow(id: string | undefined, purpose: string, binding: string | undefined) {
    if (!id || !binding) throw flowFailure();
    return db.transaction(async tx => {
      await tx.lock(`auth-flow:${id}`);
      const row = await tx.get("SELECT * FROM auth_flows WHERE id=? AND purpose=? AND browser_hash=? AND expires_at>?", id, purpose, hash(binding), now());
      if (!row) throw flowFailure();
      await tx.run("DELETE FROM auth_flows WHERE id=?", id);
      return row as unknown as Flow;
    });
  }
  async function readSignup(request: IncomingMessage) {
    const token = cookie(request, SIGNUP_COOKIE);
    if (!token) throw flowFailure();
    const row = await db.get("SELECT * FROM auth_flows WHERE id=? AND purpose='signup' AND browser_hash=? AND expires_at>?", hash(token), hash(token), now());
    if (!row) throw flowFailure();
    const identity = JSON.parse(String(row.payload)) as VerifiedIdentity;
    return { row, identity, token };
  }
  async function configuration(provider: AuthProvider) {
    const existing = configurations.get(provider);
    if (existing && existing.expiresAt > now()) return existing.config;
    let clientId: string, clientSecret: string;
    if (provider === "google") { clientId = settings.google!.clientId; clientSecret = settings.google!.clientSecret; }
    else {
      const apple = settings.apple!; clientId = apple.clientId;
      clientSecret = await new SignJWT({}).setProtectedHeader({ alg: "ES256", kid: apple.keyId }).setIssuer(apple.teamId).setAudience("https://appleid.apple.com").setSubject(clientId).setIssuedAt().setExpirationTime("5m").sign(await importPKCS8(apple.privateKey.replaceAll("\\n", "\n"), "ES256"));
    }
    const config = new oidc.Configuration(provider === "google" ? {
      issuer: "https://accounts.google.com", authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth", token_endpoint: "https://oauth2.googleapis.com/token", jwks_uri: "https://www.googleapis.com/oauth2/v3/certs", id_token_signing_alg_values_supported: ["RS256"], response_types_supported: ["code"], token_endpoint_auth_methods_supported: ["client_secret_post"], code_challenge_methods_supported: ["S256"],
    } : {
      issuer: "https://appleid.apple.com", authorization_endpoint: "https://appleid.apple.com/auth/authorize", token_endpoint: "https://appleid.apple.com/auth/token", jwks_uri: "https://appleid.apple.com/auth/keys", id_token_signing_alg_values_supported: ["RS256"], response_types_supported: ["code"], token_endpoint_auth_methods_supported: ["client_secret_post"],
    }, clientId, { client_secret: clientSecret, id_token_signed_response_alg: "RS256" });
    config.timeout = 5;
    config[oidc.customFetch] = (url, options) => (providerFetch ?? fetch)(url, { ...options, redirect: "error" });
    oidc.enableNonRepudiationChecks(config);
    configurations.set(provider, { config, expiresAt: now() + (provider === "apple" ? 240 : 3600) });
    return config;
  }
  async function callback(provider: AuthProvider, request: IncomingMessage, response: ServerResponse, url: URL) {
    // Only this provider callback may carry provider query parameters or form data.
    response.setHeader("Referrer-Policy", "no-referrer");
    try {
      if (!configured(provider)) { redirect(response, "/login?authError=unavailable"); return; }
      const form = provider === "apple" ? await readAppleForm(request) : url.searchParams;
      if (provider === "google" && ([...form.keys()].some(key => !["state", "code", "scope", "authuser", "prompt", "error", "error_description", "hd", "iss"].includes(key)) || [...new Set(form.keys())].some(key => form.getAll(key).length !== 1))) throw flowFailure();
      const state = form.get("state");
      if (!state || !/^[a-f0-9]{64}$/.test(state)) throw flowFailure();
      const flow = await takeFlow(hash(state), `oauth:${provider}`, cookie(request, FLOW_COOKIE));
      const payload = JSON.parse(flow.payload) as OAuthFlow;
      flowCookie(response, FLOW_COOKIE, "", secure, 0, provider === "apple");
      if (form.has("error")) { hooks.audit({ event: "oauth_callback_rejected", provider, code: "cancelled" }); redirect(response, "/login?authError=cancelled"); return; }
      const callbackUrl = new URL(`/api/auth/oauth/${provider}/callback`, origin);
      let providerResponse: URL | Request;
      if (provider === "apple") providerResponse = new Request(callbackUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
      else { callbackUrl.search = form.toString(); providerResponse = callbackUrl; }
      const tokens = await oidc.authorizationCodeGrant(await configuration(provider), providerResponse, { expectedState: payload.state, expectedNonce: payload.nonce, idTokenExpected: true, ...(provider === "google" ? { pkceCodeVerifier: payload.verifier! } : {}) });
      const claims = tokens.claims();
      if (!claims || typeof claims.sub !== "string" || !claims.sub || claims.sub.length > 255 || typeof claims.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email) || claims.email.length > 254 || ![true, "true"].includes(claims.email_verified as boolean)) throw new Error("Invalid provider identity");
      const address = claims.email.toLowerCase();
      const name = typeof claims.name === "string" && claims.name.trim().length >= 2 && claims.name.trim().length <= 120 && !/[\u0000-\u001f\u007f]/.test(claims.name) ? claims.name.trim() : "";
      const result = await db.transaction(async tx => {
        await tx.lock(`identity:${provider}:${claims.sub}`);
        const identity = await tx.get("SELECT * FROM external_identities WHERE provider=? AND subject=?", provider, claims.sub);
        if (payload.intent === "link") {
          const session = await tx.get("SELECT user_id FROM sessions WHERE token_hash=? AND user_id=? AND expires_at>? AND authenticated_at>?", payload.sessionHash ?? "", flow.user_id, now(), now() - RECENT_SECONDS);
          if (!session) return { error: "expired" };
          await tx.lock(`account-security:${flow.user_id}`);
          if (identity && identity.user_id !== flow.user_id) return { error: "account_exists" };
          const existing = await tx.get("SELECT subject FROM external_identities WHERE provider=? AND user_id=?", provider, flow.user_id);
          if (existing && existing.subject !== claims.sub) return { error: "account_exists" };
          if (!identity) await tx.run("INSERT INTO external_identities(provider,subject,user_id,created_at) VALUES(?,?,?,?)", provider, claims.sub, flow.user_id, new Date().toISOString());
          return { userId: flow.user_id!, next: `/app/settings?connected=${provider}` };
        }
        if (identity) return { userId: String(identity.user_id), next: payload.next };
        if (await tx.get("SELECT id FROM users WHERE email=?", address)) return { error: "account_exists" };
        return { pending: { provider, subject: claims.sub, email: address, name, next: payload.next } as VerifiedIdentity };
      });
      if (result.error) { hooks.audit({ event: "oauth_callback_rejected", provider, code: result.error }); redirect(response, `/login?authError=${result.error}`); return; }
      if (result.userId) {
        const token = await db.transaction(async tx => {
          // Apple's cross-site POST does not carry the existing SameSite=Lax session.
          if (payload.intent === "link" && payload.sessionHash) await tx.run("DELETE FROM sessions WHERE token_hash=?", payload.sessionHash);
          return hooks.createSession(tx, result.userId, request);
        });
        appendCookie(response, hooks.sessionCookie(token, secure)); redirect(response, result.next!); return;
      }
      await saveFlow(response, SIGNUP_COOKIE, "signup", result.pending, null, SIGNUP_SECONDS);
      redirect(response, "/auth/continue");
    } catch (error) {
      // Tokens, provider errors, authorization codes and identity claims never enter logs or redirect URLs.
      flowCookie(response, FLOW_COOKIE, "", secure, 0, provider === "apple");
      hooks.audit({ event: "oauth_callback_rejected", provider, code: error instanceof AuthError && error.code === "AUTH_EXPIRED" ? "expired" : "failed" });
      redirect(response, error instanceof AuthError && error.code === "AUTH_EXPIRED" ? "/login?authError=expired" : "/login?authError=failed");
    }
  }

  return async function handle(request: IncomingMessage, response: ServerResponse, url: URL, ip: string) {
    const pathname = url.pathname; const method = request.method || "GET";
    if (method === "GET" && pathname === "/api/auth/config") { json(response, 200, { methods: { google: configured("google"), apple: configured("apple"), passkeys: passkeysEnabled } }); return true; }
    const callbackMatch = /^\/api\/auth\/oauth\/(google|apple)\/callback$/.exec(pathname);
    if (callbackMatch && ((callbackMatch[1] === "google" && method === "GET") || (callbackMatch[1] === "apple" && method === "POST"))) { await hooks.rateLimit(db, `oauth-callback:${ip}`, 30, 900); await callback(callbackMatch[1] as AuthProvider, request, response, url); return true; }
    const start = /^\/api\/auth\/oauth\/(google|apple)\/start$/.exec(pathname);
    if (start && method === "POST") {
      await hooks.rateLimit(db, `oauth-start:${ip}`, 20, 900);
      const provider = start[1] as AuthProvider;
      if (!configured(provider)) throw new AuthError(503, "AUTH_UNAVAILABLE", "This sign-in method is not connected yet. Please use another method.");
      const body = await hooks.readBody(request); exact(body, ["intent", "next"]);
      if (!["login", "signup", "link"].includes(String(body.intent))) throw new AuthError(422, "VALIDATION_ERROR", "Choose a sign-in action.");
      const user = body.intent === "link" ? await requireUser(request, true) : null;
      const token = secret(); const state = secret(); const nonce = secret();
      const verifier = provider === "google" ? oidc.randomPKCECodeVerifier() : undefined;
      const payload: OAuthFlow = { provider, state, nonce, ...(verifier ? { verifier } : {}), intent: body.intent as OAuthFlow["intent"], next: nextPath(body.next), ...(user ? { sessionHash: hash(cookie(request, "slate_session")!) } : {}) };
      await db.run("INSERT INTO auth_flows(id,purpose,browser_hash,user_id,payload,expires_at) VALUES(?,?,?,?,?,?)", hash(state), `oauth:${provider}`, hash(token), user?.id ?? null, JSON.stringify(payload), now() + FLOW_SECONDS);
      flowCookie(response, FLOW_COOKIE, token, secure, FLOW_SECONDS, provider === "apple");
      const params: Record<string, string> = { scope: provider === "google" ? "openid email profile" : "openid email name", redirect_uri: new URL(`/api/auth/oauth/${provider}/callback`, origin).href, response_type: "code", state, nonce, ...(provider === "apple" ? { response_mode: "form_post" } : { code_challenge_method: "S256", code_challenge: await oidc.calculatePKCECodeChallenge(verifier!) }) };
      json(response, 200, { url: oidc.buildAuthorizationUrl(await configuration(provider), params).href }); return true;
    }
    if (pathname === "/api/auth/signup") {
      if (method === "GET") { const { identity } = await readSignup(request); json(response, 200, { provider: identity.provider, name: identity.name, email: identity.email }); return true; }
      if (method === "POST") {
        await hooks.rateLimit(db, `register:${ip}`, 5, 3600);
        const body = await hooks.readBody(request); exact(body, ["name", "phone", "termsVersion"]);
        const name = text(body, "name", 2, 120); const phone = text(body, "phone", 7, 32);
        if (!/^\+?[\d ()-]{7,32}$/.test(phone)) throw new AuthError(422, "VALIDATION_ERROR", "Enter a valid phone number.", { phone: "Use a phone number with its country code." });
        if (body.termsVersion !== TERMS_VERSION) throw new AuthError(422, "TERMS_REQUIRED", "Read and accept the current terms to create an account.");
        const { identity, token: pendingToken } = await readSignup(request);
        const result = await db.transaction(async tx => {
          await tx.lock(`auth-flow:${hash(pendingToken)}`);
          if (!await tx.get("SELECT id FROM auth_flows WHERE id=? AND purpose='signup' AND expires_at>?", hash(pendingToken), now())) throw flowFailure();
          await tx.lock(`identity:${identity.provider}:${identity.subject}`);
          await tx.lock(`signup-email:${hash(identity.email)}`);
          if (await tx.get("SELECT id FROM users WHERE email=?", identity.email) || await tx.get("SELECT user_id FROM external_identities WHERE provider=? AND subject=?", identity.provider, identity.subject)) throw collision();
          const id = randomUUID(); const timestamp = new Date().toISOString();
          await tx.run("INSERT INTO users(id,name,email,phone,password_hash,terms_version,terms_accepted_at,created_at) VALUES(?,?,?,?,?,?,?,?)", id, name, identity.email, phone, "external-only", TERMS_VERSION, timestamp, timestamp);
          await tx.run("INSERT INTO external_identities(provider,subject,user_id,created_at) VALUES(?,?,?,?)", identity.provider, identity.subject, id, timestamp);
          await tx.run("DELETE FROM auth_flows WHERE id=?", hash(pendingToken));
          const token = await hooks.createSession(tx, id, request);
          return { token, user: { id, name, email: identity.email, phone, role: "household" as const } };
        }).catch(error => {
          const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
          if (code === "23505" || (error instanceof Error && error.message.includes("UNIQUE constraint failed"))) throw collision();
          throw error;
        });
        flowCookie(response, SIGNUP_COOKIE, "", secure, 0); appendCookie(response, hooks.sessionCookie(result.token, secure));
        json(response, 201, { user: result.user, next: identity.next }); return true;
      }
    }
    if (method === "GET" && pathname === "/api/auth/security") {
      const user = await requireUser(request); const row = await db.get("SELECT password_hash FROM users WHERE id=?", user.id);
      json(response, 200, { hasPassword: PASSWORD_PATTERN.test(String(row?.password_hash)), recentAuth: await isRecent(request), identities: (await db.all("SELECT provider FROM external_identities WHERE user_id=? ORDER BY provider", user.id)).map(row => row.provider), passkeys: (await db.all("SELECT id,name,created_at FROM passkeys WHERE user_id=? ORDER BY created_at", user.id)).map(row => ({ id: row.id, name: row.name, createdAt: row.created_at })) }); return true;
    }
    if (method === "POST" && pathname === "/api/auth/reauthenticate") {
      const user = await requireUser(request); await hooks.rateLimit(db, `reauth:${user.id}`, 10, 900);
      const body = await hooks.readBody(request); exact(body, ["password"]); const password = body.password;
      if (typeof password !== "string" || password.length < 12 || password.length > 128 || password.trim().length < 12) throw new AuthError(422, "VALIDATION_ERROR", "Use a password with 12 to 128 characters.");
      const row = await db.get("SELECT password_hash FROM users WHERE id=?", user.id);
      if (!await hooks.verifyPassword(password, String(row?.password_hash))) throw new AuthError(401, "INVALID_CREDENTIALS", "The password is incorrect.");
      const token = await db.transaction(tx => hooks.createSession(tx, user.id, request)); appendCookie(response, hooks.sessionCookie(token, secure)); json(response, 200, { user }); return true;
    }
    if (pathname.startsWith("/api/auth/passkeys/")) {
      if (!passkeysEnabled) throw new AuthError(503, "PASSKEY_UNAVAILABLE", "Passkeys require a secure connection. Use another sign-in method.");
      if (method === "POST") await hooks.rateLimit(db, `passkey:${ip}`, 30, 900);
      if (method === "POST" && pathname === "/api/auth/passkeys/register/options") {
        const user = await requireUser(request, true); const body = await hooks.readBody(request); exact(body, ["name"]); const name = text(body, "name", 1, 80);
        const credentials = await db.all("SELECT id FROM passkeys WHERE user_id=?", user.id);
        if (credentials.length >= 10) throw new AuthError(409, "PASSKEY_LIMIT", "You can save up to 10 passkeys. Remove an old passkey first.");
        const options = await generateRegistrationOptions({ rpName: "Slate", rpID, userName: user.email, userID: new TextEncoder().encode(user.id), userDisplayName: user.name, timeout: FLOW_SECONDS * 1000, attestationType: "none", excludeCredentials: credentials.map(row => ({ id: String(row.id) })), authenticatorSelection: { residentKey: "required", userVerification: "required" }, supportedAlgorithmIDs: [-7, -257] });
        await saveFlow(response, PASSKEY_COOKIE, "passkey:register", { challenge: options.challenge, name, sessionHash: hash(cookie(request, "slate_session")!) }, user.id); json(response, 200, { options }); return true;
      }
      if (method === "POST" && pathname === "/api/auth/passkeys/register/verify") {
        const user = await requireUser(request, true); const body = await hooks.readBody(request); exact(body, ["response"]); const registration = object(body.response) as unknown as RegistrationResponseJSON;
        const binding = cookie(request, PASSKEY_COOKIE); const flow = await takeFlow(binding ? hash(binding) : undefined, "passkey:register", binding); flowCookie(response, PASSKEY_COOKIE, "", secure, 0);
        const payload = JSON.parse(flow.payload) as { challenge: string; name: string; sessionHash: string };
        if (flow.user_id !== user.id || payload.sessionHash !== hash(cookie(request, "slate_session")!)) throw authFailure();
        let result;
        try { result = await verifyRegistrationResponse({ response: registration, expectedChallenge: payload.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true, supportedAlgorithmIDs: [-7, -257] }); } catch { throw authFailure(); }
        if (!result.verified || !result.registrationInfo) throw authFailure();
        const info = result.registrationInfo;
        await db.transaction(async tx => {
          await tx.lock(`account-security:${user.id}`);
          const count = await tx.get("SELECT count(*) AS count FROM passkeys WHERE user_id=?", user.id);
          if (Number(count?.count) >= 10) throw new AuthError(409, "PASSKEY_LIMIT", "You can save up to 10 passkeys. Remove an old passkey first.");
          if (await tx.get("SELECT id FROM passkeys WHERE id=?", info.credential.id)) throw new AuthError(409, "PASSKEY_EXISTS", "This passkey is already registered.");
          await tx.run("INSERT INTO passkeys(id,user_id,name,public_key,counter,transports,device_type,backed_up,created_at) VALUES(?,?,?,?,?,?,?,?,?)", info.credential.id, user.id, payload.name, Buffer.from(info.credential.publicKey).toString("base64url"), info.credential.counter, JSON.stringify(info.credential.transports ?? []), info.credentialDeviceType, info.credentialBackedUp ? 1 : 0, new Date().toISOString());
        });
        json(response, 201, { ok: true }); return true;
      }
      const operation = /^\/api\/auth\/passkeys\/(login|reauthenticate)\/(options|verify)$/.exec(pathname);
      if (operation && method === "POST") {
        const reauth = operation[1] === "reauthenticate"; const user = reauth ? await requireUser(request) : null;
        const body = await hooks.readBody(request);
        if (operation[2] === "options") {
          exact(body, []); const credentials = user ? await db.all("SELECT id FROM passkeys WHERE user_id=?", user.id) : [];
          if (reauth && !credentials.length) throw authFailure();
          const options = await generateAuthenticationOptions({ rpID, timeout: FLOW_SECONDS * 1000, userVerification: "required", ...(user ? { allowCredentials: credentials.map(row => ({ id: String(row.id) })) } : {}) });
          await saveFlow(response, PASSKEY_COOKIE, `passkey:${operation[1]}`, { challenge: options.challenge, ...(user ? { sessionHash: hash(cookie(request, "slate_session")!) } : {}) }, user?.id ?? null); json(response, 200, { options }); return true;
        }
        exact(body, ["response"]); const assertion = object(body.response) as unknown as AuthenticationResponseJSON;
        const binding = cookie(request, PASSKEY_COOKIE); const flow = await takeFlow(binding ? hash(binding) : undefined, `passkey:${operation[1]}`, binding); flowCookie(response, PASSKEY_COOKIE, "", secure, 0);
        const payload = JSON.parse(flow.payload) as { challenge: string; sessionHash?: string };
        if (reauth && (flow.user_id !== user!.id || payload.sessionHash !== hash(cookie(request, "slate_session")!))) throw authFailure();
        if (typeof assertion.id !== "string" || assertion.id.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(assertion.id)) throw authFailure();
        const result = await db.transaction(async tx => {
          await tx.lock(`passkey:${assertion.id}`);
          const credential = await tx.get("SELECT * FROM passkeys WHERE id=?", assertion.id);
          if (!credential || (reauth && credential.user_id !== user!.id)) throw authFailure();
          const owner = await tx.get("SELECT * FROM users WHERE id=? AND role='household'", credential.user_id);
          if (!owner || (!reauth && assertion.response?.userHandle !== Buffer.from(String(owner.id)).toString("base64url")) || (reauth && assertion.response?.userHandle && assertion.response.userHandle !== Buffer.from(String(owner.id)).toString("base64url"))) throw authFailure();
          let verification;
          try { verification = await verifyAuthenticationResponse({ response: assertion, expectedChallenge: payload.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true, credential: { id: String(credential.id), publicKey: Buffer.from(String(credential.public_key), "base64url"), counter: Number(credential.counter), transports: JSON.parse(String(credential.transports)) } }); } catch { throw authFailure(); }
          if (!verification.verified) throw authFailure();
          await tx.run("UPDATE passkeys SET counter=?,device_type=?,backed_up=? WHERE id=?", verification.authenticationInfo.newCounter, verification.authenticationInfo.credentialDeviceType, verification.authenticationInfo.credentialBackedUp ? 1 : 0, assertion.id);
          return { token: await hooks.createSession(tx, String(owner.id), request), user: userFrom(owner) };
        });
        appendCookie(response, hooks.sessionCookie(result.token, secure)); json(response, 200, { user: result.user }); return true;
      }
      if (method === "DELETE" && /^\/api\/auth\/passkeys\/[A-Za-z0-9_-]{1,2048}$/.test(pathname)) {
        const user = await requireUser(request, true); const id = pathname.slice("/api/auth/passkeys/".length);
        await db.transaction(async tx => {
          await tx.lock(`account-security:${user.id}`); await tx.lock(`passkey:${id}`);
          if (!await tx.get("SELECT id FROM passkeys WHERE id=? AND user_id=?", id, user.id)) throw new AuthError(404, "NOT_FOUND", "This passkey could not be found.");
          const row = await tx.get("SELECT password_hash FROM users WHERE id=?", user.id); const identities = await tx.all("SELECT provider FROM external_identities WHERE user_id=?", user.id); const keys = await tx.get("SELECT count(*) AS count FROM passkeys WHERE user_id=?", user.id);
          if (!PASSWORD_PATTERN.test(String(row?.password_hash)) && !identities.some(identity => configured(identity.provider as AuthProvider)) && Number(keys?.count) <= 1) throw new AuthError(409, "LAST_SIGN_IN_METHOD", "Add another sign-in method before removing this passkey.");
          await tx.run("DELETE FROM passkeys WHERE id=? AND user_id=?", id, user.id);
        });
        json(response, 200, { ok: true }); return true;
      }
    }
    return false;
  };
}
