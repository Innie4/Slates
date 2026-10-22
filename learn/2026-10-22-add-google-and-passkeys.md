# Google sign-in and device passkeys

> 2026-10-22 · Add Google signup, provider login and passkeys to Slate.

## In short
Slate now supports Google accounts and passkeys alongside existing passwords. Apple has a complete server integration but stays unavailable on the free setup. The screens reflect the services actually configured.

## What changed
- `server/auth.ts` handles provider callbacks, signup completion, account linking and passkey ceremonies. `server/auth-schema.ts`, `store.ts` and `postgres.ts` add durable identities, challenges and credentials through schema version 2.
- `server/server.ts`, `index.ts` and `contracts.ts` connect the routes, environment and shared response types. `.env.example` and `server/README.md` document setup and recovery.
- `src/lib/auth.ts` validates destinations and translates callback and device errors. `AuthMethods.tsx` adds provider and passkey controls; `AccountSecurity.tsx` manages connected methods and recent sign-in confirmation.
- `Login.tsx`, `SignUp.tsx`, `ContinueSignUp.tsx`, `AuthLayout.tsx`, `AccountPage.tsx` and `src/index.css` supply the revised account flow. `scripts/routes.py` generates its connected route. Sign-out copy now accounts for multiple methods.
- The server authentication fixtures and browser auth suites check protocol validation, ownership, concurrency and navigation races. Design research and rendered reviews are in `design/auth/`.

## How it works
1. Google returns an authorization code. The server exchanges it and checks its signed identity token, expected issuer, audience and nonce, plus a one-use browser-bound state and PKCE verifier.
2. An existing linked identity opens its account. A new identity must supply contact details and accept the current terms. An email match alone never connects an existing account.
3. A signed-in user adds a passkey in account security. The device creates a key pair. Slate stores the public key, credential ID and counter.
4. At login, the device signs a fresh challenge. The server checks its origin, relying-party hostname, user verification, ownership and signature before creating a session.
5. Linking or removing methods requires recent authentication. Transactions consume challenges once and serialize concurrent credential updates.

## Why it's built this way
Protocol libraries perform token and WebAuthn validation. Database-backed state works across application workers and restarts. The browser never stores provider secrets or receives biometric information. Unmount guards prevent an old sign-in action from redirecting a newer page. Fixed error categories help diagnose provider failures without logging tokens or personal data.

## The concept worth knowing: challenge and response
A guard asks a different question every time, so yesterday's answer cannot open today's door. More precisely, a short-lived random challenge binds a signature to one ceremony. Slate consumes that challenge atomically, so two workers cannot both accept the same proof.

## Watch out for
Provider fixtures and virtual authenticators do not prove physical Face ID or fingerprint hardware. Apple requires additional developer eligibility. Google staging remains restricted to configured test users. After schema version 2, use the documented compatible rollback commit, not the old deployment directly. Qualified human review is still required before a public production authentication release.

## Check yourself
1. Why not connect an existing account when Google returns the same email?
<details><summary>Answer</summary>An email match is not permission to add a new login method. Existing users must authenticate and explicitly link the provider.</details>

2. What happens if two workers receive the same signed challenge?
<details><summary>Answer</summary>The database transaction permits one consumption. The other request is rejected.</details>

3. Why does Slate store a public key rather than a fingerprint?
<details><summary>Answer</summary>The device checks its owner locally and signs the challenge. Slate verifies that signature without receiving the biometric data or private key.</details>

## Explain it back
Without looking at the code, explain in 2-3 sentences what this change does and why it works. If you get stuck, that's the part to reread.

*Made with Edirae Learn · edirae.com*
