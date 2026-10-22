import assert from "node:assert/strict";
import { randomBytes, generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { authFixture, authenticator, providerFixture, password, responseCookie, b64 } from "./auth-fixture.ts";

for (const postgres of [false, true]) {
  const label = postgres ? "PostgreSQL" : "SQLite";
  const options = { skip: postgres && !process.env.SLATE_TEST_DATABASE_URL };
  test(`${label} auth methods fail closed, preserve password login, and require recent authentication`, options, async () => {
    const f = await authFixture({}, postgres);
    try {
      assert.deepEqual((await f.api("/api/auth/config")).body, { methods: { google: false, apple: false, passkeys: true } });
      assert.equal((await f.api("/api/auth/oauth/google/start", { body: { intent: "signup" } })).response.status, 503);
      assert.equal((await f.api("/api/auth/passkeys/register/options", { body: { name: "Phone" } })).response.status, 401);
      const account = await f.register();
      assert.deepEqual((await f.api("/api/auth/security", { cookie: account.cookie })).body, { hasPassword: true, recentAuth: true, identities: [], passkeys: [] });
      await f.store.run("UPDATE sessions SET authenticated_at=NULL");
      assert.equal((await f.api("/api/auth/passkeys/register/options", { cookie: account.cookie, body: { name: "Phone" } })).body.error.code, "REAUTH_REQUIRED");
      assert.equal((await f.api("/api/auth/reauthenticate", { cookie: account.cookie, body: { password: "A different password 1234" } })).response.status, 401);
      const reauth = await f.api("/api/auth/reauthenticate", { cookie: account.cookie, body: { password } });
      assert.equal(reauth.response.status, 200); assert.notEqual(reauth.cookie, account.cookie);
      assert.equal((await f.api("/api/session", { cookie: account.cookie })).body.user, null);
      assert.equal((await f.api("/api/auth/security", { cookie: reauth.cookie })).body.recentAuth, true);
      await f.store.run("UPDATE users SET password_hash='external-only' WHERE id=?", account.body.user.id);
      assert.equal((await f.api("/api/auth/login", { body: { email: account.body.user.email, password } })).response.status, 401);
      assert.equal((await f.api("/api/auth/reauthenticate", { cookie: reauth.cookie, body: { password } })).response.status, 401);
      assert.equal((await f.api("/api/auth/config?issuer=https://attacker.test")).response.status, 400);
      assert.equal((await f.api("/api/auth/passkeys/login/options", { body: {}, headers: { Origin: "https://attacker.test" } })).response.status, 403);
      assert.equal((await f.api("/api/auth/signup")).response.status, 410);
    } finally { await f.dispose(); }
  });

  test(`${label} real passkey signatures, replay protection, restart persistence, and owner checks`, options, async () => {
    const f = await authFixture({}, postgres);
    try {
      const account = await f.register(); const key = authenticator(account.body.user.id);
      const enroll = await f.api("/api/auth/passkeys/register/options", { body: { name: "Test phone" }, cookie: account.cookie });
      assert.equal(enroll.response.status, 200);
      assert.equal(enroll.body.options.authenticatorSelection.userVerification, "required");
      assert.equal(enroll.body.options.authenticatorSelection.residentKey, "required");
      const enrollmentCookie = responseCookie(enroll.response, "slate_passkey");
      const registered = await f.api("/api/auth/passkeys/register/verify", { body: { response: key.registration(enroll.body.options.challenge) }, cookie: `${account.cookie}; ${enrollmentCookie}` });
      assert.equal(registered.response.status, 201, JSON.stringify(registered.body));
      assert.equal((await f.api("/api/auth/passkeys/register/verify", { body: { response: key.registration(enroll.body.options.challenge) }, cookie: `${account.cookie}; ${enrollmentCookie}` })).response.status, 410);
      await f.restart();
      const security = await f.api("/api/auth/security", { cookie: account.cookie });
      assert.equal(security.body.passkeys[0].name, "Test phone");
      const login = await f.api("/api/auth/passkeys/login/options", { body: {} });
      assert.equal(login.body.options.userVerification, "required");
      const loginCookie = responseCookie(login.response, "slate_passkey");
      const assertion = key.assertion(login.body.options.challenge, 1);
      if (postgres) await f.addServer();
      const concurrent = await Promise.all([0, postgres ? 1 : 0].map(server => f.api("/api/auth/passkeys/login/verify", { body: { response: assertion }, cookie: loginCookie, server })));
      assert.deepEqual(concurrent.map(value => value.response.status).sort(), [200, 410]);
      const signedIn = concurrent.find(value => value.response.status === 200)!;
      assert.equal(signedIn.body.user.id, account.body.user.id);
      assert.equal((await f.api("/api/session", { cookie: signedIn.cookie })).body.user.id, account.body.user.id);
      const second = await f.register();
      const revoke = `/api/auth/passkeys/${key.id}`;
      assert.equal((await f.api(revoke, { method: "DELETE", cookie: second.cookie })).response.status, 404);
      await f.store.run("UPDATE sessions SET authenticated_at=0");
      const reauth = await f.api("/api/auth/passkeys/reauthenticate/options", { cookie: signedIn.cookie, body: {} });
      const verified = await f.api("/api/auth/passkeys/reauthenticate/verify", { cookie: `${signedIn.cookie}; ${responseCookie(reauth.response, "slate_passkey")}`, body: { response: key.assertion(reauth.body.options.challenge, 2) } });
      assert.equal(verified.response.status, 200, JSON.stringify(verified.body));
      assert.equal((await f.api(revoke, { method: "DELETE", cookie: verified.cookie })).response.status, 200);
      const removed = await f.api("/api/auth/passkeys/login/options", { body: {} });
      assert.equal((await f.api("/api/auth/passkeys/login/verify", { cookie: responseCookie(removed.response, "slate_passkey"), body: { response: key.assertion(removed.body.options.challenge, 3) } })).response.status, 401);
    } finally { await f.dispose(); }
  });

  test(`${label} passkeys reject changed origin, missing verification, wrong owner, stale counters, and wrong-purpose challenges`, options, async () => {
    const f = await authFixture({}, postgres);
    try {
      const account = await f.register(); const key = authenticator(account.body.user.id);
      for (const change of [{ origin: "https://attacker.test" }, { flags: 0x41 }, { rpID: "attacker.test" }]) {
        const invalid = await f.api("/api/auth/passkeys/register/options", { cookie: account.cookie, body: { name: "Invalid attempt" } });
        assert.equal((await f.api("/api/auth/passkeys/register/verify", { cookie: `${account.cookie}; ${responseCookie(invalid.response, "slate_passkey")}`, body: { response: key.registration(invalid.body.options.challenge, change) } })).response.status, 401);
      }
      const enroll = await f.api("/api/auth/passkeys/register/options", { body: { name: "Security key" }, cookie: account.cookie });
      const enrolled = await f.api("/api/auth/passkeys/register/verify", { cookie: `${account.cookie}; ${responseCookie(enroll.response, "slate_passkey")}`, body: { response: key.registration(enroll.body.options.challenge) } });
      assert.equal(enrolled.response.status, 201);
      for (const change of [{ origin: "https://attacker.test" }, { flags: 0x01 }, { userHandle: b64("different-user") }, { signature: b64(randomBytes(70)) }]) {
        const options = await f.api("/api/auth/passkeys/login/options", { body: {} });
        const result = await f.api("/api/auth/passkeys/login/verify", { cookie: responseCookie(options.response, "slate_passkey"), body: { response: key.assertion(options.body.options.challenge, 1, change) } });
        assert.equal(result.response.status, 401, JSON.stringify(change));
      }
      await f.store.run("UPDATE passkeys SET counter=8 WHERE id=?", key.id);
      const stale = await f.api("/api/auth/passkeys/login/options", { body: {} });
      assert.equal((await f.api("/api/auth/passkeys/login/verify", { cookie: responseCookie(stale.response, "slate_passkey"), body: { response: key.assertion(stale.body.options.challenge, 8) } })).response.status, 401);
      const registration = await f.api("/api/auth/passkeys/register/options", { cookie: account.cookie, body: { name: "Another" } });
      assert.equal((await f.api("/api/auth/passkeys/login/verify", { cookie: responseCookie(registration.response, "slate_passkey"), body: { response: key.assertion(registration.body.options.challenge, 9) } })).response.status, 410);
      const expired = await f.api("/api/auth/passkeys/login/options", { body: {} });
      await f.store.run("UPDATE auth_flows SET expires_at=0");
      assert.equal((await f.api("/api/auth/passkeys/login/verify", { cookie: responseCookie(expired.response, "slate_passkey"), body: { response: key.assertion(expired.body.options.challenge, 9) } })).response.status, 410);
      await f.store.run("UPDATE passkeys SET counter=0 WHERE id=?", key.id);
      for (let attempt = 0; attempt < 2; attempt++) {
        const synced = await f.api("/api/auth/passkeys/login/options", { body: {} });
        assert.equal((await f.api("/api/auth/passkeys/login/verify", { cookie: responseCookie(synced.response, "slate_passkey"), body: { response: key.assertion(synced.body.options.challenge, 0) } })).response.status, 200);
      }
      await f.store.run("UPDATE users SET password_hash='external-only' WHERE id=?", account.body.user.id);
      assert.equal((await f.api(`/api/auth/passkeys/${key.id}`, { method: "DELETE", cookie: account.cookie })).body.error.code, "LAST_SIGN_IN_METHOD");
    } finally { await f.dispose(); }
  });

  test(`${label} signed Google signup requires phone and consent, persists identities, and never links by email`, options, async () => {
    const provider = await providerFixture();
    const f = await authFixture({ oauth: { google: { clientId: "fixture-client", clientSecret: "fixture-secret" } }, authFetch: provider.transport }, postgres);
    try {
      const start = await f.api("/api/auth/oauth/google/start", { body: { intent: "signup", next: "https://attacker.test/" } });
      assert.equal(start.response.status, 200);
      const params = provider.codeFor(start.body.url);
      const callbackPath = `/api/auth/oauth/google/callback?${params}`;
      const binding = responseCookie(start.response, "slate_oauth");
      assert.equal((await f.api(callbackPath)).response.headers.get("location"), "/login?authError=expired");
      if (postgres) await f.addServer();
      const callbacks = await Promise.all([0, postgres ? 1 : 0].map(server => f.api(callbackPath, { cookie: binding, server })));
      assert.deepEqual(callbacks.map(value => value.response.headers.get("location")).sort(), ["/auth/continue", "/login?authError=expired"]);
      const callback = callbacks.find(value => value.response.headers.get("location") === "/auth/continue")!;
      assert.equal(callback.response.headers.get("location"), "/auth/continue");
      assert.equal((await f.api(callbackPath, { cookie: binding })).response.headers.get("location"), "/login?authError=expired");
      const pending = responseCookie(callback.response, "slate_signup");
      assert.deepEqual((await f.api("/api/auth/signup", { cookie: pending })).body, { provider: "google", name: "Provider Customer", email: "provider@example.test" });
      assert.equal((await f.api("/api/auth/signup", { cookie: pending, body: { name: "New Customer", phone: "+2348000000000" } })).body.error.code, "TERMS_REQUIRED");
      assert.equal((await f.api("/api/auth/signup", { cookie: pending, body: { name: "New Customer", termsVersion: "2026-10-18" } })).response.status, 422);
      const completions = await Promise.all([0, postgres ? 1 : 0].map(server => f.api("/api/auth/signup", { cookie: pending, body: { name: "New Customer", phone: "+2348000000000", termsVersion: "2026-10-18" }, server })));
      assert.deepEqual(completions.map(value => value.response.status).sort(), [201, 410]);
      const complete = completions.find(value => value.response.status === 201)!;
      assert.equal(complete.response.status, 201, JSON.stringify(complete.body)); assert.equal(complete.body.next, "/app/dashboard");
      assert.equal((await f.api("/api/auth/signup", { cookie: pending, body: { name: "New Customer", phone: "+2348000000000", termsVersion: "2026-10-18" } })).response.status, 410);
      assert.equal((await f.api("/api/auth/security", { cookie: complete.cookie })).body.hasPassword, false);
      await f.restart();
      const login = await f.api("/api/auth/oauth/google/start", { body: { intent: "login", next: "/app/services" } });
      const loginCallback = await f.api(`/api/auth/oauth/google/callback?${provider.codeFor(login.body.url)}`, { cookie: responseCookie(login.response, "slate_oauth") });
      assert.equal(loginCallback.response.headers.get("location"), "/app/services");
      assert.equal((await f.api("/api/session", { cookie: loginCallback.cookie })).body.user.id, complete.body.user.id);
      const sameEmail = await f.api("/api/auth/oauth/google/start", { body: { intent: "login" } });
      const collision = await f.api(`/api/auth/oauth/google/callback?${provider.codeFor(sameEmail.body.url, { sub: "different-subject" })}`, { cookie: responseCookie(sameEmail.response, "slate_oauth") });
      assert.equal(collision.response.headers.get("location"), "/login?authError=account_exists");
      assert.equal(Number((await f.store.get("SELECT count(*) AS count FROM external_identities"))!.count), 1);
      assert.ok(provider.requests.every(url => ["https://oauth2.googleapis.com/token", "https://www.googleapis.com/oauth2/v3/certs"].includes(url)));
    } finally { await f.dispose(); }
  });

  test(`${label} Google callback rejects forged claims and linking requires the authenticated account`, options, async () => {
    const provider = await providerFixture();
    const f = await authFixture({ oauth: { google: { clientId: "fixture-client", clientSecret: "fixture-secret" } }, authFetch: provider.transport }, postgres);
    try {
      for (const claims of [{ email_verified: false }, { nonce: "wrong-nonce" }, { email: "invalid" }, { aud: "attacker-client" }, { iss: "https://attacker.test" }, { invalidSignature: true }, { exp: 1 }]) {
        const start = await f.api("/api/auth/oauth/google/start", { body: { intent: "signup" } });
        const result = await f.api(`/api/auth/oauth/google/callback?${provider.codeFor(start.body.url, claims)}`, { cookie: responseCookie(start.response, "slate_oauth") });
        assert.equal(result.response.headers.get("location"), "/login?authError=failed", JSON.stringify(claims));
        assert.equal(responseCookie(result.response, "slate_signup"), "");
      }
      const timeout = await f.api("/api/auth/oauth/google/start", { body: { intent: "login" } });
      provider.failNext();
      assert.equal((await f.api(`/api/auth/oauth/google/callback?${provider.codeFor(timeout.body.url)}`, { cookie: responseCookie(timeout.response, "slate_oauth") })).response.headers.get("location"), "/login?authError=failed");
      assert.equal((await f.api("/api/auth/oauth/google/start", { body: { intent: "link" } })).response.status, 401);
      const account = await f.register("local@example.test");
      const local = await f.api("/api/auth/oauth/google/start", { body: { intent: "signup" } });
      assert.equal((await f.api(`/api/auth/oauth/google/callback?${provider.codeFor(local.body.url, { sub: "unlinked-subject", email: "local@example.test" })}`, { cookie: responseCookie(local.response, "slate_oauth") })).response.headers.get("location"), "/login?authError=account_exists");
      const start = await f.api("/api/auth/oauth/google/start", { cookie: account.cookie, body: { intent: "link" } });
      const callback = await f.api(`/api/auth/oauth/google/callback?${provider.codeFor(start.body.url)}`, { cookie: `${account.cookie}; ${responseCookie(start.response, "slate_oauth")}` });
      assert.equal(callback.response.headers.get("location"), "/app/settings?connected=google");
      assert.deepEqual((await f.api("/api/auth/security", { cookie: callback.cookie })).body.identities, ["google"]);
      const second = await f.register();
      const conflicting = await f.api("/api/auth/oauth/google/start", { cookie: second.cookie, body: { intent: "link" } });
      const refused = await f.api(`/api/auth/oauth/google/callback?${provider.codeFor(conflicting.body.url)}`, { cookie: `${second.cookie}; ${responseCookie(conflicting.response, "slate_oauth")}` });
      assert.equal(refused.response.headers.get("location"), "/login?authError=account_exists");
      await f.store.run("UPDATE sessions SET authenticated_at=0");
      assert.equal((await f.api("/api/auth/oauth/google/start", { cookie: second.cookie, body: { intent: "link" } })).body.error.code, "REAUTH_REQUIRED");
    } finally { await f.dispose(); }
  });

  test(`${label} v1 upgrade retains customers and sessions while requiring fresh authentication for new methods`, options, async () => {
    const f = await authFixture({}, postgres);
    try {
      const account = await f.register();
      await f.store.run("DROP TABLE passkeys");
      await f.store.run("DROP TABLE external_identities");
      await f.store.run("DROP TABLE auth_flows");
      await f.store.run("ALTER TABLE sessions DROP COLUMN authenticated_at");
      if (postgres) await f.store.run("DELETE FROM schema_migrations WHERE version=2");
      else await f.store.run("PRAGMA user_version=1");
      await f.restart();
      assert.equal((await f.api("/api/session", { cookie: account.cookie })).body.user.id, account.body.user.id);
      const security = await f.api("/api/auth/security", { cookie: account.cookie });
      assert.equal(security.body.hasPassword, true); assert.equal(security.body.recentAuth, false);
      assert.equal((await f.api("/api/auth/login", { body: { email: account.body.user.email, password } })).response.status, 200);
    } finally { await f.dispose(); }
  });

  test(`${label} concurrent assertions lock the counter across separate challenges`, options, async () => {
    const f = await authFixture({}, postgres);
    try {
      const account = await f.register(); const key = authenticator(account.body.user.id);
      const enrollment = await f.api("/api/auth/passkeys/register/options", { cookie: account.cookie, body: { name: "Counter key" } });
      assert.equal((await f.api("/api/auth/passkeys/register/verify", { cookie: `${account.cookie}; ${responseCookie(enrollment.response, "slate_passkey")}`, body: { response: key.registration(enrollment.body.options.challenge) } })).response.status, 201);
      const attempts = await Promise.all([0, 1].map(() => f.api("/api/auth/passkeys/login/options", { body: {} })));
      if (postgres) await f.addServer();
      const results = await Promise.all(attempts.map((attempt, index) => f.api("/api/auth/passkeys/login/verify", { server: postgres ? index : 0, cookie: responseCookie(attempt.response, "slate_passkey"), body: { response: key.assertion(attempt.body.options.challenge, 1) } })));
      assert.deepEqual(results.map(result => result.response.status).sort(), [200, 401]);
      assert.equal(Number((await f.store.get("SELECT counter FROM passkeys WHERE id=?", key.id))!.counter), 1);
    } finally { await f.dispose(); }
  });

  test(`${label} Apple form-post is narrowly scoped and uses bound one-use state with signed tokens`, options, async () => {
    const provider = await providerFixture();
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const f = await authFixture({ origin: "https://slate.example.test", oauth: { apple: { clientId: "fixture-client", teamId: "fixture-team", keyId: "fixture-apple-key", privateKey: privateKey.export({ format: "pem", type: "pkcs8" }).toString() } }, authFetch: provider.transport }, postgres);
    try {
      assert.equal((await f.api("/api/auth/config")).body.methods.apple, true);
      const start = await f.api("/api/auth/oauth/apple/start", { body: { intent: "signup" } });
      assert.equal(start.response.status, 200, JSON.stringify(start.body));
      assert.match(start.response.headers.get("set-cookie")!, /SameSite=None; Secure/);
      const form = provider.codeFor(start.body.url, { name: undefined }, "apple");
      const callback = await f.api("/api/auth/oauth/apple/callback", { rawBody: form.toString(), cookie: responseCookie(start.response, "slate_oauth"), headers: { Origin: "https://appleid.apple.com", "Content-Type": "application/x-www-form-urlencoded", "Sec-Fetch-Site": "cross-site" } });
      assert.equal(callback.response.headers.get("location"), "/auth/continue");
      const pending = await f.api("/api/auth/signup", { cookie: responseCookie(callback.response, "slate_signup") });
      assert.equal(pending.body.provider, "apple"); assert.equal(pending.body.name, "");
      const replay = await f.api("/api/auth/oauth/apple/callback", { rawBody: form.toString(), cookie: responseCookie(start.response, "slate_oauth"), headers: { Origin: "https://appleid.apple.com", "Content-Type": "application/x-www-form-urlencoded" } });
      assert.equal(replay.response.headers.get("location"), "/login?authError=expired");
      assert.equal((await f.api("/api/auth/login", { body: { email: "x@example.test", password }, headers: { Origin: "https://appleid.apple.com" } })).response.status, 403);
      assert.equal((await f.api("/api/auth/oauth/apple/callback?code=bad", { method: "POST" })).response.status, 400);
      const account = await f.register();
      const link = await f.api("/api/auth/oauth/apple/start", { cookie: account.cookie, body: { intent: "link" } });
      const linked = await f.api("/api/auth/oauth/apple/callback", { cookie: responseCookie(link.response, "slate_oauth"), rawBody: provider.codeFor(link.body.url, {}, "apple").toString(), headers: { Origin: "https://appleid.apple.com", "Content-Type": "application/x-www-form-urlencoded", "Sec-Fetch-Site": "cross-site" } });
      assert.equal(linked.response.headers.get("location"), "/app/settings?connected=apple");
      assert.equal((await f.api("/api/session", { cookie: account.cookie })).body.user, null, "Apple link revokes the bound original session even when Lax cookie is absent");
      assert.equal((await f.api("/api/session", { cookie: linked.cookie })).body.user.id, account.body.user.id);
      assert.ok(provider.requests.every(url => ["https://appleid.apple.com/auth/token", "https://appleid.apple.com/auth/keys"].includes(url)));
    } finally { await f.dispose(); }
  });
}

test("OAuth callback diagnostics use fixed categories and never log provider response details", async () => {
  const records: Record<string, string | number>[] = [];
  let mode: "invalid_client" | "timeout" | "unknown" = "invalid_client";
  const privateMarker = "fixture-private-provider-detail";
  const transport: typeof fetch = async () => {
    if (mode === "timeout") throw new DOMException(privateMarker, "TimeoutError");
    if (mode === "unknown") throw Object.assign(new Error(privateMarker), { code: privateMarker, cause: { email: privateMarker, token: privateMarker } });
    return Response.json({ error: "invalid_client", error_description: privateMarker, private_token: privateMarker }, { status: 401 });
  };
  const f = await authFixture({ oauth: { google: { clientId: "fixture-client", clientSecret: privateMarker } }, authFetch: transport, logger: record => { records.push(record); } });
  try {
    for (const [failureMode, expectedReason] of [["invalid_client", "provider_invalid_client"], ["timeout", "network_timeout"], ["unknown", "unclassified"]] as const) {
      mode = failureMode;
      const start = await f.api("/api/auth/oauth/google/start", { body: { intent: "login" } });
      const authorization = new URL(start.body.url);
      const query = new URLSearchParams({ state: authorization.searchParams.get("state")!, code: privateMarker });
      const result = await f.api(`/api/auth/oauth/google/callback?${query}`, { cookie: responseCookie(start.response, "slate_oauth") });
      assert.equal(result.response.headers.get("location"), "/login?authError=failed");
      const event = records.filter(record => record.event === "oauth_callback_rejected").at(-1);
      assert.deepEqual(event, { event: "oauth_callback_rejected", provider: "google", code: "failed", stage: "grant", reason: expectedReason });
      assert.equal(JSON.stringify(records).includes(privateMarker), false);
      assert.equal(JSON.stringify(records).includes(authorization.searchParams.get("nonce")!), false);
      assert.equal(JSON.stringify(records).includes(authorization.searchParams.get("state")!), false);
    }
  } finally { await f.dispose(); }
});
