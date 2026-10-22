# Slate API

The server runs on Node.js 24 and uses its HTTP and cryptography modules. A nonempty `DATABASE_URL` selects PostgreSQL through `pg`; otherwise the server uses Node's SQLite module. Types and allowed service, area, date-window and enquiry choices are shared with the browser in `contracts.ts`.

## Running

Use Node.js 24, run `npm ci`, copy `.env.example` to the ignored `.env` file, then run `npm run dev` for the API and Vite together. `npm run dev`, `npm run dev:api` and `npm start` load `.env`. The default API listener is `127.0.0.1:3001`; the default allowed browser origin is `http://localhost:5173`. Development requires an HTTP localhost or 127.0.0.1 `APP_ORIGIN`. Browser requests use the same origin through Vite's API proxy. Keep database credentials server-side; never put them in a `VITE_` variable.

For a deployment, run `npm run build` then `npm start`, which sets production mode. Set `APP_ORIGIN` to the public HTTPS origin, or omit it on Render to use `RENDER_EXTERNAL_URL`. Place the process behind a TLS reverse proxy. `HOST`, `PORT`, `DATABASE_PATH` and `STATIC_DIRECTORY` default to `127.0.0.1`, `3001`, `data/slate.sqlite` and `dist`. Render requires `HOST=0.0.0.0` and supplies `PORT`. Production refuses an HTTP origin. Do not expose the unencrypted application listener publicly.

## Database setup

Set `DATABASE_URL` to the managed PostgreSQL connection URL in `.env` locally and the hosting service's secret environment for deployment. The PostgreSQL store verifies TLS certificates, enables channel binding and limits each process to five pooled connections. Startup applies migrations through version 2 inside a locked transaction and refuses a newer schema. Version 2 adds external identities, one-use authentication flows, passkeys and a nullable session authentication timestamp. Existing users, passwords, bookings and sessions are retained; older sessions need reauthentication before security changes. The listener starts only after database initialization succeeds; connection or migration failures stop startup with a redacted error. A configured but unavailable PostgreSQL database never falls back to SQLite.

When `DATABASE_URL` is empty or absent, `DATABASE_PATH` selects the SQLite file. SQLite needs one application host and a persistent local volume. Changing stores does not copy existing users or records: rehearse a separate data migration before switching an existing deployment. Back up and verify a restore before schema or store changes.

For a free staging environment, use a Render Free web service with Neon Free PostgreSQL. Render's local disk loses changes on restart, redeploy and idle sleep, and its free web service cannot attach a persistent disk. Never use SQLite there. Render Free sleeps after 15 idle minutes, takes approximately a minute to wake, and shares 750 free instance hours per workspace each month. Free Render Postgres expires after 30 days. Neon Free currently provides 100 CU-hours and 1 GB of PostgreSQL storage per project, 5 GB of egress per project, and scales to zero after five idle minutes. Quotas and cold starts make this a testing setup; production availability and recovery still need review. See the [release record](../docs/production-readiness.md) for resource status and remaining service connections.

## Contract

Application API responses are JSON; OAuth callbacks use fixed redirects. The routes below describe the household contract. Mutations require an exact matching `Origin` header and `Content-Type: application/json`. Unknown fields are rejected. The maximum body size is 16 KB. Query parameters are unsupported except the exact Google OAuth callback. Apple's exact callback accepts a bounded form post and checks one-use browser-bound state; other mutations retain the origin and JSON requirements. Authenticated requests use the `slate_session` cookie automatically; the browser must never copy it into local storage.

| Method and route | Request | Response |
| --- | --- | --- |
| `GET /api/health` | None | `{status:"ok"}` after a database query |
| `GET /api/session` | Session cookie if present | `{user:SessionUser|null}` |
| `POST /api/auth/register` | `{name,email,phone,password,termsVersion}` | `201 {user:SessionUser}` and session cookie |
| `POST /api/auth/login` | `{email,password}` | `{user:SessionUser}` and rotated session cookie |
| `POST /api/auth/logout` | `{}` | `{user:null}` and revoked session cookie |
| `GET /api/bookings` | Session | `{bookings:Booking[]}` newest 100 |
| `POST /api/bookings` | `BookingInput`, session, idempotency key | `201 {booking:Booking}` |
| `GET /api/bookings/:id` | Session | `{booking:Booking}` for the current owner |
| `PATCH /api/bookings/:id` | `{status:"cancelled"}`, session | `{booking:Booking}` for the current owner |
| `GET /api/tickets` | Session | `{tickets:SupportTicket[]}` newest 100 |
| `POST /api/tickets` | `TicketInput`, session, idempotency key | `201 {ticket:SupportTicket}` |
| `GET /api/tickets/:id` | Session | `{ticket:SupportTicket}` for the current owner |
| `POST /api/enquiries` | `EnquiryInput`, idempotency key | `201 {reference:string}` |

Registration creates household accounts only. It records the accepted `TERMS_VERSION` and timestamp. Passwords must have 12 to 128 characters, are stored using scrypt with a random salt (`N=32768,r=8,p=3`), and are compared in constant time. Sessions last 12 hours and use random 256-bit tokens, stored as SHA-256 digests. Cookies are HttpOnly, SameSite=Lax and Secure on HTTPS. Login and registration are rate limited by the socket address; failed logins are also limited by a hash of the email. Forwarded headers are ignored by default. Behind a reverse proxy, configure `TRUSTED_PROXY_IPS` with its exact socket IP addresses. That gateway must overwrite `X-Real-IP` with the client address and prevent direct access to the application listener. Only allowlisted socket peers can supply this header; missing or malformed addresses are rejected. This separates per-client limits without trusting headers from arbitrary visitors. Apply gateway connection limits as well.

Service dates run from tomorrow through 90 days ahead, inclusive, using the date in Africa/Lagos. A booking is a service request with status `requested`, awaiting confirmation by staff. It does not reserve operator capacity, create a subscription, or charge money. Support tickets have status `open`. An optional `bookingId` must belong to the current customer. References acknowledge database storage; they do not claim that an email, SMS or operator notification was sent.

For bookings, tickets and enquiries, send an `Idempotency-Key` of 8 to 128 letters, digits, underscores or hyphens. Generate it once per new submission and retain it when retrying an uncertain request. Reusing it with the same normalized fields returns the original `201` result. Reusing it for a different payload returns `409`. Keys are scoped to the authenticated customer and endpoint; public enquiry keys are scoped to the socket address. Results are retained for at least 24 hours. The database write and stored result commit in one transaction. PostgreSQL takes a transaction advisory lock for that scope and key; SQLite uses an immediate transaction. Concurrent requests with the same key therefore share the original result.

Errors have `{error:{code,message,fields?},requestId}`. Validation uses `422`; unauthenticated access `401`; rejected origins `403`; unavailable or another customer's records `404`; account/key conflicts `409`; oversized bodies `413`; unsupported content `415`; limits `429`; unexpected failures `500`. A `429` includes `Retry-After`. Logs include request IDs, route categories, status and timing. Request bodies, email addresses, tokens and passwords are excluded.

## Verification and operating limits

Run `npm test` for the SQLite integration suite, route checks and copy checks. The SQLite tests bind temporary loopback ports and write isolated temporary databases. They exercise password hashing, login failure, cookie revocation, restart persistence, forbidden fields and origins, cross-customer reads and updates, ten simultaneous duplicate submissions, support ownership and enquiry rate limits.

For PostgreSQL integration tests, supply `SLATE_TEST_DATABASE_URL` for an isolated staging database with permission to create and drop schemas, then run `node --env-file-if-exists=.env --test tests/server/postgres.test.ts`. Tests create randomly named schemas and remove them afterward; use test data only. PostgreSQL tests skip when that variable is absent. The optional `SLATE_TEST_UNTRUSTED_DATABASE_URL` must target a controlled PostgreSQL endpoint with an untrusted certificate for the TLS rejection test. A skipped test is not evidence that its property passed. The suite covers persistent accounts and sessions, cross-account isolation, concurrent requests across two server instances, rate limits, rollback and startup failure. Verify a browser journey against the selected PostgreSQL database separately.

PostgreSQL stores rate limits and idempotency results centrally for application processes sharing the database. This foundation does not implement multi-region writes, account verification, password recovery, staff fulfillment, transactional notifications or payment processing. Adding an email or payment API key alone does not enable these flows. They need separate implementation, provider tests and qualified review before a public production release. Do not report the application as production ready while these requirements remain unresolved.

Use encrypted infrastructure storage and restricted database access for customer records. Define retention, deletion and access policies before collecting real customer data. For SQLite, use its online backup API or a verified database-aware backup tool; copying the main file while WAL writes are active is not a safe backup strategy. For PostgreSQL, configure provider backups or scheduled database-aware exports according to the recovery requirement. Restore a backup in staging and verify records before relying on it. Free-tier history alone does not establish a recovery plan. Add external availability monitoring, alerting, TLS renewal, restore drills and a reviewed operational runbook for a live deployment.

The role boundary and authentication code require qualified human review before release. The tests establish specific implemented behavior; they do not establish overall application security.


## Google, Apple and passkeys

Google is enabled only when both `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET` are set. Configure the exact authorized redirect URI as `<APP_ORIGIN>/api/auth/oauth/google/callback` in the Google web client. No browser API key or frontend secret is needed. Restrict OAuth testing to approved test users while the consent screen is in testing mode.

Apple stays disabled on the free setup. A later operator can configure `AUTH_APPLE_CLIENT_ID`, `AUTH_APPLE_TEAM_ID`, `AUTH_APPLE_KEY_ID` and `AUTH_APPLE_PRIVATE_KEY` after obtaining the required Apple developer account, Services ID and key. Its exact HTTPS return URI is `<APP_ORIGIN>/api/auth/oauth/apple/callback`. The app signs a short-lived ES256 client secret, uses Apple's form-post response mode and does not pretend Apple supports Google's PKCE exchange. Do not commit provider credentials.

Both providers use fixed metadata/endpoints, signed ID-token verification, expected issuer/audience/nonce, one-use state and a browser-bound HttpOnly cookie. Google also uses PKCE S256. Provider tokens are discarded after verification. A new external identity requires a separate phone/name/terms completion screen. An existing email never authorizes automatic account linking. Connecting a provider to an existing account requires an authenticated session verified within the last 10 minutes. External-only accounts have no usable password hash.

| Endpoint | Request | Result |
| --- | --- | --- |
| `GET /api/auth/config` | None | `{methods:{google,apple,passkeys}}` |
| `POST /api/auth/oauth/:provider/start` | `{intent:"login"|"signup"|"link",next?}` | `{url}` for a fixed provider origin |
| `GET /api/auth/signup` | Pending signup cookie | `{provider,name,email}` |
| `POST /api/auth/signup` | `{name,phone,termsVersion}` | `201 {user,next}` and session cookie |
| `GET /api/auth/security` | Session cookie | `{hasPassword,recentAuth,identities,passkeys}` |
| `POST /api/auth/reauthenticate` | `{password}` | `{user}` and rotated session cookie |
| `POST /api/auth/passkeys/register/options` | `{name}` and recent session | `{options}` |
| `POST /api/auth/passkeys/register/verify` | `{response}` and recent session | `201 {ok:true}` |
| `POST /api/auth/passkeys/login/options` | `{}` | `{options}` for discoverable credentials |
| `POST /api/auth/passkeys/login/verify` | `{response}` | `{user}` and session cookie |
| `POST /api/auth/passkeys/reauthenticate/options` | `{}` and session | `{options}` restricted to the account |
| `POST /api/auth/passkeys/reauthenticate/verify` | `{response}` and session | `{user}` and rotated session cookie |
| `DELETE /api/auth/passkeys/:id` | Recent session | `{ok:true}`, unless this removes the last usable method |

Passkeys use SimpleWebAuthn with exact configured origin and RP hostname, required user verification and discoverable credential registration. The device chooses Face ID, fingerprint, PIN or another supported unlock method; Slate receives a public key and signed proof, never biometric information. Registration and reauthentication flows bind to the initiating session. Database transactions consume challenges once and lock credential counters across application workers. Zero-counter synced passkeys are supported under WebAuthn's counter rules. Challenges expire after five minutes; pending signup expires after 10 minutes. Signup, OAuth starts/callbacks, passkey operations and reauthentication have durable database limits.

Run `node --test tests/server/auth.test.ts` for SQLite and optional `SLATE_TEST_DATABASE_URL` PostgreSQL variants. These tests use real software-authenticator P-256 signatures and locally signed provider tokens over a fixture transport. They verify the protocol and database boundaries; they do not prove live Google/Apple provider setup or real-device biometric behavior. Run the browser/provider staging journeys separately.

After migration v2, rollback must use a v2-compatible application build. The earlier v1 server intentionally refuses the newer schema. Do not drop the new tables or downgrade the schema marker to make an old binary start. Restore a verified pre-migration backup only through a reviewed recovery procedure if required. Qualified human review remains required before a public production authentication release.

The preserved staging recovery branch is `codex/slate-auth-rollback-v2`, commit `8b39dbc`. It retains the previous application behavior with schema-2 compatibility and safely rejects external-only password hashes. Password accounts can sign in during rollback. Social-only accounts cannot start new sessions until the auth-capable application is restored; existing sessions remain valid until expiry. Keep the version-2 tables and migration marker intact. This recovery build was checked against isolated SQLite and Neon version-2 data.

Browser checks: `node tests/browser/account-security.mjs`, `node tests/browser/auth-session-races.mjs` (local dev app), and `node tests/browser/auth-flow.mjs` (isolated built app at localhost:4173). The last test uses a disposable browser profile and a virtual resident authenticator, with real server verification. Do not point it at customer staging or production data.
