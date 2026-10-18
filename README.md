# Slate

Waste collection requests for homes and sites in Uyo. React, TypeScript and Vite on the frontend; a Node.js 24 HTTP API with PostgreSQL through `DATABASE_URL`, or local SQLite when that variable is absent.

The public site, service guide, account screens and shared calendars use Slate's slate-grey and orange design. Fonts are served locally under the included open-source licences.

## Run locally

Requires Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The dev command starts Vite and the API on port 3001, proxies `/api`, and stops both processes together. `npm run dev`, `npm run dev:api` and `npm start` load the ignored `.env` file. Copy [.env.example](.env.example) for local defaults, or use the configured Neon pooled `DATABASE_URL` to connect PostgreSQL. To use another local address, set `APP_ORIGIN`, for example `APP_ORIGIN=http://127.0.0.1:5173 npm run dev`.

Create a household account at `/signup`. Real accounts use an expiring HttpOnly session cookie. They can request and cancel collections, revisit saved records, send support messages and view account activity. A collection request is awaiting review until staff confirms availability and price. This release does not charge money.

Development sign-in includes clearly marked sample portals for household, estate, business, institution, operator and admin experiences. Sample actions do not operate the API. These previews are disabled in production builds unless `VITE_ENABLE_DEMO=true` is explicitly set at build time. Real accounts cannot change roles by visiting a URL or modifying local storage.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run test:calendar
npm run test:production   # actual dist assets through an isolated local HTTPS gateway
# With npm run dev running in another terminal:
npm run test:browser
npm run test:sessions
npm run test:public
```

Browser tests use existing Chrome at `/usr/bin/google-chrome`; set `CHROME` to another Chrome/Chromium executable if needed. For an alternate app address, set `BASE_URL`. The journey creates `example.test` accounts in the running development database; use a dedicated PostgreSQL test database or branch, or unset `DATABASE_URL` and choose a temporary `DATABASE_PATH` for SQLite. The registration limiter intentionally restricts repeated runs against one database. Session-ordering and public failure tests use mocked HTTP responses to make race conditions and retries deterministic; the main journey uses the real API.

For PostgreSQL integration tests, set `SLATE_TEST_DATABASE_URL` to a direct connection for an isolated test database with schema creation permissions, then run:

```sh
node --env-file-if-exists=.env --test tests/server/postgres.test.ts
```

The tests create and remove randomly named schemas. Database-dependent cases skip when `SLATE_TEST_DATABASE_URL` is absent. See [the API documentation](server/README.md) for the optional TLS rejection test and database operating limits. A skipped case is not a passing database test.

`npm test` checks HTTP/database behavior, all 159 declared route patterns, static internal destinations and the product copy rules. The calendar fixture checks keyboard interaction, limits, leap years, validation, focus, modals and responsive themes. These checks do not establish production readiness on their own.

To capture every sample route on a local development server:

```sh
node scripts/shot.mjs --base http://localhost:5173 --all --preview --out shots/routes
```

## Release configuration

```sh
npm run build
# Set APP_ORIGIN to your public HTTPS origin before starting.
# Set DATABASE_URL to the Neon pooled PostgreSQL connection URL.
# If using SQLite instead, DATABASE_PATH needs a persistent local volume.
npm start
```

`npm start` loads `.env` if present, enforces production mode and serves `dist/` plus the API from one origin. Set the variables described in [.env.example](.env.example). Put the listener behind a TLS gateway and prevent direct public access. If a proxy is trusted to identify clients, configure its exact addresses in `TRUSTED_PROXY_IPS` and have it overwrite `X-Real-IP`. Arbitrary forwarded headers are never trusted.

Use the Neon pooled `DATABASE_URL` for free staging on Render; a free Render web service cannot persist SQLite files. PostgreSQL startup applies the versioned schema and verifies TLS before accepting traffic. A Neon Free project and a Render project have been provisioned; the hosted web application and its release checks remain pending. See [the API documentation](server/README.md) for database configuration and [the production setup and release requirements](docs/production-readiness.md) for free-tier limits and remaining email, recovery, fulfillment and payment connections. No paid service or live payment is enabled.

## Project map

- `server/`: shared contracts, HTTP routes, persistence and [API documentation](server/README.md).
- `src/pages/live/`: server-backed household screens.
- `src/pages/public/`: service, coverage, pricing, proposal and contact pages.
- `src/pages/<portal>/`: explicitly labelled sample experiences.
- `src/components/ui/`: the shared component kit and accessible calendar.
- `src/components/layout/`: public, authentication and protected portal shells.
- `scripts/routes.py`: route manifest; regenerate with `python3 scripts/routes.py`.
- `tests/`: API integration, browser journey, session ordering and calendar checks.
- `public/fonts/`: unchanged Fontsource WOFF2 files and SIL Open Font licences.

[DIRECTION.md](DIRECTION.md) describes the original demo's brand and history. Some historical verification claims in that document refer to earlier work; use the current checks and [release record](docs/production-readiness.md) for this implementation.
