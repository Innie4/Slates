# Production setup and release record

18 October 2026. This repository is a local implementation being connected to free staging services. A Neon project and a Render project have been created. No Render web service is running, no public deployment has been verified, and no paid plan or live payment is enabled.

## Recommended target

Retain TypeScript and React, with Node.js 24 LTS for the API. There is no universally best language for scale. For this product, shared input/output contracts, a familiar ecosystem and explicit database transactions address concrete risks while preserving the existing application. Changing language would not supply missing operational workflows.

Start with a Render Free web service and Neon Free PostgreSQL for staging. Serve the frontend and API under one HTTPS origin, keep `DATABASE_URL` in the ignored local `.env` and the service's secret environment, and keep preview accounts disabled. `npm run dev`, `npm run dev:api` and `npm start` load `.env`. Use Node.js 24. On Render, set `HOST=0.0.0.0`, let Render supply `PORT`, and use its assigned `RENDER_EXTERNAL_URL` unless setting an explicit HTTPS `APP_ORIGIN`. Build with `npm ci && npm run build` and start with `npm start`.

A nonempty `DATABASE_URL` now selects the `pg` PostgreSQL store. Startup verifies TLS and applies the initial versioned migration in a locked transaction before accepting traffic. Ownership rules, session hashes, rate-limit counters and idempotency records live in the selected database. Connection or migration failure stops startup; it does not silently create a SQLite fallback. With no `DATABASE_URL`, local SQLite remains available through `DATABASE_PATH`. Switching stores does not import existing records. A deployment with existing data needs an explicit migration rehearsal, backup and rollback plan. Introduce a durable work queue when implementing notifications or other background effects.

For production, budget for an always-on web service, managed PostgreSQL with recovery matched to the business, external monitoring and tested backups. Select hosting and database regions after measuring latency from Nigeria. Paid Render web and PostgreSQL in the same region remain one option. The free staging connection does not establish production readiness or authorize a paid upgrade.

## Free staging resources and limits

The created Neon project is `rapid-unit-60506637`, using its `production` branch in Ohio. That provider branch name does not mean Slate has been released to production. The Render project is `slate`; a live web service and public application URL are still pending. Credentials belong in secret environments and are intentionally excluded from this record.

The [Render Free limits](https://render.com/docs/free) currently include a sleep after 15 minutes without inbound traffic, approximately a minute to wake, and 750 free instance hours shared across the workspace each month. Its filesystem is ephemeral, and a free web service cannot attach persistent storage. Never deploy the SQLite fallback there: its records would be lost on sleep, restart or redeploy. Render Free Postgres expires after 30 days, followed by a 14-day paid-upgrade grace period before deletion, so it is unsuitable for this ongoing staging database. Free web services also block outbound SMTP ports 25, 465 and 587; a future email connection should use an HTTPS API.

The [Neon Free plan](https://neon.com/docs/introduction/plans) currently includes 100 CU-hours per project each month, 1 GB of PostgreSQL storage per project with a 20 GB account total, and 5 GB of public network transfer per project. It scales to zero after five idle minutes. Its six-hour history window, capped change history and one manual snapshot require a separate tested recovery plan before customer use. Check account usage and the provider's current limits before launch; free resources can sleep or stop when quotas are exhausted.

An optional [Resend Free connection](https://resend.com/docs/knowledge-base/account-quotas-and-limits) can support email testing with 3,000 sent and received emails per month, 100 per UTC calendar day, and up to three verified domains. [Provider test addresses](https://resend.com/docs/dashboard/emails/send-test-emails) simulate delivery, bounce and complaint outcomes and count toward quota. No email flow is implemented or verified merely by creating that account or storing a key. Real verification and recovery require a verified sender, single-use tokens, expiry, abuse controls and delivery tests.

## Connections and work still required

| Area | Recommended connection or implementation | Release evidence required |
| --- | --- | --- |
| Staff fulfillment | Authenticated staff provisioning, role-controlled request review, route capacity, assignments, status transitions and support replies | Qualified review of staff access; customer-to-operator-to-completion journey; tenant isolation and audit trail |
| Accounts | Transactional email service, verified sender domain, email verification, single-use recovery tokens, password change and session revocation | Real delivery/recovery tests; abuse limits; qualified authentication review |
| Payments | Paystack hosted checkout for supported Nigerian business operations, configured by the owner | Provider sandbox tests; verified raw-payload webhook signatures; server-side status verification; idempotent ledger effects and reconciliation; qualified financial review |
| Operator settlements | Provider-supported disbursements with explicit pending, successful, failed and uncertain states | Provider lookup after timeout, duplicate/out-of-order/replay tests, recovery and reconciliation |
| Database | Implemented PostgreSQL store and Neon staging project; complete service connection and access restrictions | Real PostgreSQL tests, migration rehearsal for existing data, rollback plan, concurrent requests, cross-account tests and a restored backup |
| Notifications | Durable delivery jobs with retry limits and reviewed email/SMS provider settings | Delivery failure handling, suppression, deduplication and operational alerts |
| Files | Private object storage for permits, contracts and collection evidence, with bounded upload types/sizes | Malware handling, retention, ownership checks and expiring access links |
| Operations | Error monitoring and availability/latency alerts; health endpoint; structured redacted logs; TLS/domain configuration | Alerts exercised, restart and restore drills, capacity test, incident owner and recovery runbook |
| Product facts | Owner confirmation of service areas, prices, business contact details, legal terms and service policies | Approved content and service commitments; genuine operations photographs if desired |
| Privacy and compliance | Reviewed data retention, access, deletion and incident procedures; qualified advice for applicable Nigerian data/payment obligations | Approved policies and provider contracts; verified handling of card and personal data |

No live account collects card details, stores a payment instrument, confirms a charge or moves funds. Preview finance screens are sample experiences and are off by default in production. Before introducing money movement, specify balanced ledger postings, exact monetary units, durable idempotency, provider verification and reconciliation. Do not infer a PCI or regulatory readiness claim from using hosted checkout.

## Implemented boundaries

Household registration stores salted scrypt password hashes and the accepted terms version. Sessions use random tokens stored as hashes, 12-hour expiry, HttpOnly/SameSite cookies and Secure cookies on the HTTPS deployment. Every account record is read and changed through owner-scoped queries. Cross-origin writes, unexpected fields, malformed requests and oversized bodies are rejected. Request creation and its replay result commit together. Lists are bounded to the latest 100; bookmarks retrieve their own records independently. No public signup can provision an admin or operator account.

The frontend guards protected routes, rechecks the server session, discards stale session responses and clears old account data when the active user changes. Calendars share date bounds, month navigation, keyboard interaction, focus restoration, native form validity and dark/light tokens. Product source is checked for em dashes and a narrow list of stock phrases; this does not replace editorial judgement.

The server's API contract and limitations are documented in [server/README.md](../server/README.md). PostgreSQL uses a bounded pool and transaction advisory locks for duplicate submissions; SQLite serializes its single connection. Public enquiries and support messages are stored, with a reference. They do not yet create staff notifications or a staff processing queue. No email, payment or recovery credential is consumed by the current application.

## Evidence from this change

- Clean locked dependency installation and TypeScript checks were run with Node 24.
- Nine HTTP integration tests pass against isolated SQLite databases: hashing, session revocation/expiry, restart persistence, validation, origin checks, owner isolation, ten concurrent duplicate submissions, support/enquiry persistence, abuse limits, static route serving and trusted proxy client limits.
- All 159 declared routes rendered in the mobile smoke test without runtime errors or horizontal overflow. Protected sample portals used explicitly selected preview accounts for that test.
- The actual production build also passed the complete account journey through an isolated local HTTPS gateway with Secure cookies and CSP. The temporary certificate and database were removed afterward.
- The real browser journey passes registration, role tampering, collection requests, support, cancellation, refresh persistence, responsive widths from 320 to 1440, logout and sign-in.
- Calendar checks cover keyboard navigation, date limits, disabled days, leap years, validation, focus restoration, scrollable modals and light/dark layouts.
- Independent review reproduced stale session/cache and old-record defects. Fixes have deterministic browser regressions.
- Public route checks cover 31 destinations, responsive navigation, address checking, form error retention and retry keys. Failure/order tests intentionally mock selected responses; the real journey and API suite exercise actual persistence.
- The production dependency advisory query reported zero known vulnerabilities. That result covers the locked production packages at the time of the query, not the entire application or its hosting.
- Local fonts remove the external stylesheet that was blocking initial rendering. OFL licences and unchanged font files are included.

The evidence above describes the previous local UI and SQLite verification. PostgreSQL tests have been added for persistence, ownership, concurrent submissions across server instances, rate limits, rollback and startup failure. Tests that need `SLATE_TEST_DATABASE_URL` skip when it is absent; a skipped test does not establish a passing database connection. Record fresh PostgreSQL and browser results against the connected staging environment before claiming that integration is verified.

Current screenshots and reports are saved locally under `shots/` and `.taste-skill/`. The visual inspector still flags the illustration-led homepage for lacking photography and a service page for being intentionally still. No fabricated service photography, live metrics or testimonials were added. Device-lab testing, independent accessibility certification, load tests, email delivery, payment sandbox tests and infrastructure restore drills remain release gaps.

Authentication and money-related production flows require qualified human review before release. This work has not been merged or deployed.

## Authoritative references checked

- [Node.js release schedule](https://nodejs.org/en/about/previous-releases): LTS runtime policy.
- [Render Node deployment](https://render.com/docs/deploy-node-express-app): application hosting approach.
- [Render Free limits](https://render.com/docs/free): idle sleep, ephemeral storage, free database expiry and SMTP restrictions.
- [Neon plans](https://neon.com/docs/introduction/plans): current free compute, storage, transfer and recovery allowances.
- [Resend quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits) and [test emails](https://resend.com/docs/dashboard/emails/send-test-emails): free allowances and simulated email outcomes for a future integration.
- [Render PostgreSQL](https://render.com/docs/postgresql) and [recovery/backups](https://render.com/docs/postgresql-backups): managed database target and recovery configuration.
- [Paystack webhooks](https://paystack.com/docs/payments/webhooks/) and [payment verification](https://paystack.com/docs/payments/verify-payments/): provider notification signature and server confirmation requirements for a future payment integration.
