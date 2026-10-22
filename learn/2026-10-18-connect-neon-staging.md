# Connect Slate to Neon staging

18 October 2026 · Connect Neon PostgreSQL, configure secrets and deploy Slate to free staging.

## In short

Slate now runs on Render Free with Neon PostgreSQL, retaining SQLite for local use. Production release work remains.

## What changed

- `server/postgres.ts`: adds asynchronous PostgreSQL queries, verified TLS, five pooled connections, versioned migrations and transaction locks.
- `server/store.ts`: defines the shared storage interface and serializes SQLite operations around transactions.
- `server/server.ts`: awaits storage, creates accounts and sessions atomically, and returns retryable `503` responses for database overload.
- `server/index.ts`: waits for database readiness, stops on initialization failure and closes storage during shutdown.
- `package.json` and `package-lock.json`: add PostgreSQL and Neon dependencies; development and start commands load `.env`.
- `neon.ts` and `.gitignore`: declare PostgreSQL, expire new nondefault branches after seven days and exclude local credentials.
- `src/components/layout/PortalLayout.tsx` and `src/pages/app/Settings.tsx`: correct sign-out text to match email sign-in.
- `tests/server/postgres.test.ts`: tests isolated schemas, concurrent requests, ownership, restarts and database failure behavior.
- `.env.example`, `README.md`, `server/README.md` and `docs/production-readiness.md`: explain configuration, free-tier limits and release gaps. Credentials remain in the ignored `.env`.

## How it works

1. Startup selects PostgreSQL when `DATABASE_URL` is present. Otherwise it opens SQLite at `DATABASE_PATH`.
2. PostgreSQL verifies the server certificate and applies schema version 1 under a database lock. A failed connection or unsupported schema prevents the listener from starting.
3. Registration saves the account and its hashed session token in one transaction. Both changes commit together or both roll back.
4. A collection request locks its customer scope and submission key, checks for a saved response, then commits the request and replay result together.
5. Shutdown closes the listener and database pool. Selected database timeout and capacity errors return `503` with `Retry-After` so callers can retry appropriately.

## Why it's built this way

PostgreSQL keeps records outside the web server's temporary disk. Five pooled connections bound each process's database usage. Keeping SQLite supports local work, but does not copy records into Neon. Certificate checks stay enabled even when a connection URL supplies conflicting TLS options.

## The concept worth knowing: transaction locks

A shared ticket desk needs one clerk to finish a particular ticket before another clerk handles the same ticket. Locking only one clerk's notebook would fail when a second desk opens.

Precisely, `idempotent()` uses a PostgreSQL transaction advisory lock derived from the submission scope and key. The lock coordinates processes and releases on commit or rollback. Retries with matching payloads receive the saved result; changed payloads are rejected.

## Watch out for

Build and 16 local tests passed. Six hosted tests passed; one TLS rejection case skipped there passed locally. Live API, booking and support persistence checks passed. A credential exposed during setup was rotated before the final deployment. Free services can sleep or exhaust quotas. Email recovery, payments, staff fulfillment, restore drills and qualified review remain release gaps. See `docs/production-readiness.md` for the deployment record.

## Check yourself

1. Why should failed PostgreSQL startup avoid falling back to SQLite?
<details><summary>Answer</summary>It could silently accept requests into temporary local storage, splitting or losing customer records.</details>

2. What if two application processes receive the same submission key?
<details><summary>Answer</summary>The database transaction lock coordinates them, so the later request reads the committed replay result.</details>

3. Why save an account and its session together?
<details><summary>Answer</summary>A session failure rolls back account creation, avoiding a partially successful registration that cannot safely be retried.</details>

## Explain it back

Without looking at the code, explain in 2-3 sentences what this change does and why it works. If you get stuck, that's the part to reread.

*Made with Edirae Learn · edirae.com*
