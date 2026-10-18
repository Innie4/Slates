# Slate implementation and verification

Date: 2026-10-18

## Current state

The repository contains 159 React routes and sample data. It has no server, persistent accounts or live payment integration. The current sign-in form simulates authentication, and visiting a portal changes the browser's role.

## Delivery increments

1. Establish a reproducible install and build. Verify the locked dependency versions against the package registry and fix invalid manifests if necessary.
2. Add a TypeScript HTTP API with persistent SQLite storage, password hashing, expiring server sessions, same-origin write checks, bounded inputs and account-scoped queries. Verify registration, login, logout, ownership, invalid input, duplicate requests and restart persistence through HTTP integration tests.
3. Connect the household dashboard, service requests, pickup records, support and account details to the API. Guard portal access and isolate the sample portals. Verify a real browser journey from registration through saved request and support ticket to logout.
4. Refine the shared date picker and public interface within Slate's existing brand. Replace browser date controls and review keyboard, phone, desktop, dark mode and reduced motion. Remove em dashes and vague generated copy from product source.
5. Check every declared route and internal navigation destination, run the production build and independent code review, and record release requirements with actual evidence.

## Acceptance criteria

- The app builds from a clean dependency install.
- Server-backed accounts cannot gain another role by changing a URL or local storage.
- A service request and support ticket survive a browser refresh and server restart; another account cannot see them.
- Repeat submissions with one request key cannot create duplicate records.
- No money is charged or reported as paid by a live account without a payment provider.
- Date selection shares one accessible visual system and works with a keyboard.
- All existing routes have an intentional destination; core navigation is exercised in a browser.
- Product source contains no em dashes, and public copy is reviewed for specific, plain language.
- Release documentation distinguishes verified behavior, sample experiences and missing operational or provider evidence.

## Architecture

Retain TypeScript, React and Vite. A language rewrite would discard a substantial working interface without solving the missing persistence and authorization. Node 24 provides the HTTP, cryptography and SQLite APIs needed for an initial single-host service. SQLite is appropriate for this bounded deployment, with a persistent local volume and backups. Multiple application replicas require a shared database and shared rate limiting before rollout.

Payment processing, privileged operator/admin provisioning, email/SMS delivery and production infrastructure require external configuration and qualified review. Existing sample portals remain explicitly labelled previews and are disabled by default in production builds.
