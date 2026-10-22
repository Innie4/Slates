# Authentication verification

2026-10-22. Scope: Google signup and login, optional Apple protocol support, device passkeys, account security and responsive authentication screens.

## Fresh checks

- `npm run build`: passed with Vite 8.3.5. Final TypeScript check also passed after the test-fixture lifecycle fix.
- Combined `npm test` with an isolated Neon test schema: 32 tests, 31 passed, 0 failed, 1 skipped. The skipped check needs a controlled PostgreSQL endpoint with an untrusted TLS certificate; that endpoint is not configured.
- `node tests/browser/auth-flow.mjs`: real isolated server and disposable Chrome virtual authenticator passed enrollment, persisted credential, logout/login, requested-route navigation, removal, rejected revoked credential and password fallback.
- `node tests/browser/auth-session-races.mjs`: passed signed-in linking-error visibility and cancellation of delayed passkey and Google actions after navigation.
- `node tests/browser/account-security.mjs`: passed explicit recent-authentication, cancellation, removal confirmation and stale-client reauthentication cases using controlled API responses.
- Route manifest: 160 unique routes and 424 connected static destinations. Product copy: 229 source files with no em dashes or listed stock phrases.
- `npm audit --json`: zero reported advisories. This result does not establish overall application security.
- Exact local environment-secret comparison: no configured database URLs or Google secret in the 44 staged files.

The first combined run failed while reconnecting to remove an isolated test schema. The fixture now retains its schema-control connection, matching the established PostgreSQL fixture. The focused case and complete combined suite passed afterward. The exact leftover schema was removed and a follow-up query found zero disposable test schemas.

## Rendered review

Three initial directions, two mockup critique rounds and an actual-product review are retained in this directory. Before images are explicitly labelled source reconstructions. The final independent critic scored nine design categories at 4/5 and three at 3/5, with fidelity 4/5. This meets the skill's stopping criterion and is not a 5/5 rating.

Actual Chrome captures checked light/dark desktop and a 390 by 844 phone viewport. Phone email/password inputs compute to 16px; no horizontal overflow was present. Compact 375 by 667 mockup and scroll-bottom evidence are retained locally under `shots/`. The missing Apple system fonts in the Linux mockup renderer are documented; the web app uses its existing licensed Bricolage and Geist fonts.

## Service and release limits

Google is configured with a server-only web client and an exact staging HTTPS callback. Its consent screen remains in Testing with the account owner added as a test user. Name, email and OpenID scopes are requested; provider tokens are discarded. The originally generated client secret was replaced and disabled before deployment after a diagnostic exposed it in the private tool transcript. Replacement values were saved without displaying them.

Apple stays unavailable under the user's free-only requirement. Protocol fixtures do not prove a live Apple account. Virtual WebAuthn verification does not prove physical Face ID or fingerprint hardware.

The reviewed and tested recovery commit is `8b39dbc` on `codex/slate-auth-rollback-v2`. Keep schema version 2 during rollback. Password users retain access; social-only users cannot start new sessions on that older interface until the auth-capable build returns. Do not use Render's unpatched previous deployment as the recovery build.

The requested target is staging. Qualified human review of the authentication boundary remains necessary before a public production release. Live deployment and provider-callback evidence must be reported separately after rollout.

## Follow-up callback diagnosis

The first live Google linking attempt returned the generic failure state. A private comparison found that Render still held the retired client secret. The exact Google secret row was corrected and its saved value verified against the working replacement, without printing either value. A Google token-endpoint control check returned `invalid_grant` for a disposable invalid code with the replacement and `invalid_client` for a deliberately wrong secret.

A reviewed follow-up adds only fixed callback stages and allowlisted failure categories. Token, nonce, state, PKCE and identity validation are unchanged. Focused callback/redaction checks passed (3 passed, 0 failed; 2 PostgreSQL variants intentionally omitted from that focused local run). The earlier combined SQLite/Neon suite remains the evidence for database and concurrency behavior. The follow-up build and TypeScript checks passed.
