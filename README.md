# Slate — web platform (frontend)

Slate is a managed waste-management service for Nigeria, starting in Uyo. It sources, verifies and contracts
waste operators, then gives households, estates, businesses and institutions one reliable service:
one company, one payment, one support channel, one service standard.

This repository is the **frontend only**: a mobile-first, responsive React app with every page of the product
spec routed, using realistic demo data (no backend).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then builds to dist/
npm run preview    # serves the production build
```

Requires Node 20+. The app is a single-page app — deploy `dist/` with a fallback to `index.html`
(`vercel.json` and `public/_redirects` for Netlify are included).

## Try the portals

Open `/login` and use **Demo access** to sign in as any role, or go straight to a portal URL:

| Experience | Start at |
|---|---|
| Public website | `/` |
| Design system (living style guide) | `/design-system` |
| Household customer | `/app/dashboard` (onboarding: `/app/onboarding`) |
| Estate / property manager | `/estate/dashboard` |
| Business | `/business/dashboard` |
| Institution | `/institution/dashboard` |
| Waste operator | `/operator/dashboard` (application: `/operator/onboarding`) |
| Slate admin / operations | `/admin/dashboard` |

Inside any portal: **⌘K / Ctrl K** opens global search; the account menu switches portals and appearance (light/dark).

The demo clock is **Monday 5 October 2026, 08:12 WAT**. The household's collection is on its way when you open
`/app/dashboard` — wait a few seconds to see the signature "clean slate" interaction when it's collected.

## Structure

```
DIRECTION.md               Design direction, tokens, signature interaction, implementation guide
src/index.css              Design tokens (light + dark), type styles, motion
src/components/ui/         Component kit (buttons, fields, overlays, tables, charts, states…)
src/components/brand/      Logo (placeholder), Strata, RouteMap, ServiceAreaMap, CleanSlate
src/components/layout/     Public, auth and portal shells, nav config, command palette, admin command bar
src/data/                  Typed demo data shared by every portal
src/pages/<area>/          Pages: public, auth, app (customer), estate, business, institution, operator, admin, system
src/routes.tsx             Generated router — edit scripts/routes.py and run `python3 scripts/routes.py`
scripts/shot.mjs           Screenshot + QA (console errors, overflow, tiny text) at phone and desktop widths
```

## Replacing the logo

Everything renders the brand through `src/components/brand/Logo.tsx` (wordmark + slab mark) and
`public/favicon.svg`. Swap those two files when the final logo is ready.

## Design in one paragraph

"Slate is a clean slate." Deep slate grey is the primary colour, light stone slate the secondary, and a single
hi-vis signal orange marks what is live or needs you right now (the truck, the next pickup, the one CTA).
Bricolage Grotesque for display, Geist for text, Geist Mono for references. Richness comes from layered
"strata" slabs, chalk route lines and stylised Uyo maps — never green leaves, illustrated people or gradients.
See `DIRECTION.md` for the full system.
