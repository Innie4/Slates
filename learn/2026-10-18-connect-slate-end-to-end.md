# Connect Slate from screen to saved request

> 2026-10-18 · Improve Slate's interface, navigation and backend for a reviewable release.

## In short

Slate now has real household accounts, saved collection requests, support messages and public enquiries. The public pages and calendars share a clearer design, while sample portals are explicitly labelled and disabled by default in production. The application still needs staff fulfillment and external service connections before public release.

## What changed

- `server/contracts.ts`, `server/store.ts`, `server/server.ts` and `server/index.ts` define the shared inputs, durable storage, HTTP API and listener.
- `src/lib/api.ts`, `src/lib/session.tsx` and `src/components/layout/PortalLayout.tsx` connect authenticated requests and prevent stale responses or old account records crossing sessions.
- `src/pages/live/AccountPage.tsx` and `src/pages/live/account.css` provide saved requests, support, account details and responsive account screens.
- `src/components/ui/DatePicker.tsx` and `date-picker.css` replace browser date inputs and the fixed October calendar, including their existing callers.
- `src/pages/public/`, authentication pages, layout files and `public/fonts/` contain the new public flows, copy, navigation and locally served typefaces.
- Verification scripts, tests, run commands and release documentation accompany the implementation. Other portal/data edits remove em dashes from copy. [The complete changed-file list](../docs/changed-files.md) identifies every saved file and its role.

## How it works

1. Registration validates the submitted fields and accepted terms version, hashes the password with scrypt and creates a server session.
2. The browser receives an HttpOnly cookie. Portal routes check the server's account rather than trusting a role in local storage.
3. A collection form sends a request key with its fields. The API checks the date, area and account, then saves the record and replay response together.
4. The account screens load only the current customer's records. Older bookmarked requests load independently of the latest-100 list.
5. Support follows the same saved-request pattern. The calendar keeps date selection within bounds and works with keyboard navigation.

## Why it's built this way

TypeScript preserves the existing app and shares contracts between browser and server. Node's standard modules avoid an extra backend dependency stack. SQLite supplies persistence for one host; PostgreSQL is the documented launch target and is not connected yet. Separate sample and real sessions keep simulated payment screens away from live account operations.

## The concept worth knowing: idempotency

**Simply put:** pressing a lift button repeatedly still calls one lift.

**Precisely:** `idempotent()` binds a request key to an account, endpoint and normalized payload. Its database transaction saves both the effect and response. A retry with the same key returns the earlier result; a changed payload conflicts. `useRequestKey()` keeps keys after uncertain failures and resets them after a successful support submission so a later, identical message is still a new action.

## Watch out for

The current API requests staff review; it does not reserve vehicle capacity or charge money. Email verification, recovery, staff processing, PostgreSQL, payment integration and operational recovery still need implementation and qualified review. Local browser and database tests passed; real-device certification and production infrastructure have not been verified.

## Check yourself

1. Why can't changing `slate-role` grant admin access?
   <details><summary>Answer</summary>The real session comes from the server cookie, and API queries enforce the authenticated customer's ownership. Preview roles cannot provision server privileges.</details>

2. What if a slow session response arrives after another sign-in?
   <details><summary>Answer</summary>The session revision invalidates older responses. Account screens also remount when the account ID changes, discarding old records.</details>

3. Why reset a support key only after success?
   <details><summary>Answer</summary>An uncertain retry must locate the original result. A later deliberate submission needs a fresh key, even when its words are identical.</details>

## Explain it back

Without looking at the code, explain in 2-3 sentences what this change does and why it works. If you get stuck, that's the part to reread.

*Made with Edirae Learn · edirae.com*
