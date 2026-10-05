# Slate — Design Direction & System

> Brief: **self-authored from the Slate business plan + product requirements (Nigeria, 2026).**
> Deliverable: a mobile-first, responsive, frontend-only web platform covering the public
> website, auth, customer, estate, business, institution, operator and admin experiences.
> Logo: placeholder wordmark (`src/components/brand/Logo.tsx`) until the real mark arrives.

---

## 1. The brief

| | |
|---|---|
| **What** | Slate is a managed waste-management service. It sources, verifies and contracts waste operators, then sells households, estates, businesses and institutions one reliable service: one company, one payment, one support channel, one standard. |
| **Who** | Residents of Uyo estates, estate managers, restaurant and office owners, school and hospital facility teams, contracted waste operators and their dispatchers, and Slate's own operations staff. |
| **Core action (first 10 seconds)** | Customer: *"Is my waste being collected, and when?"* Operator: *"What are today's jobs?"* Admin: *"What is going wrong right now?"* |
| **Three words** | Dependable. Composed. Local. |
| **References outside apps** | Roofing slate and school chalk slates (layered stone, chalk marks). Hi-vis vests and truck beacons on Uyo streets at 6am. The calm of a well-run railway timetable board. |
| **Colour instruction** | Slate grey is primary. Slate grey (lighter, stone tints) is secondary. Other colours only where necessary. |

## 2. The concept

**"Slate is a clean slate."** Every pickup wipes the slate clean. The product is a slab of
dependable stone — layered, quiet, solid — with one hi-vis signal that tells you where the
action is *right now* (the truck, the next pickup, the thing that needs you).

Explorations rendered as real core screens in `design/explore.html`; the latest comparison sheet is
`shots/explore-r3/sheet.png`.

| Concept | Source family | Ground | Type | Accent | Richness | Verdict |
|---|---|---|---|---|---|---|
| **A. Clean slate (chosen)** | object (stone slab + chalk) | light chalk, with deep-slate fields | expanded/grotesque display (Bricolage Grotesque) + Geist | orange (hi-vis signal) | shape — layered "strata" slabs, chalk route lines | Most *Slate*: the name is the material. Works for a household and an ops centre. |
| B. Morning route | place (Uyo streets at dawn) | dark | condensed signage | yellow (sodium light) | stylised street maps everywhere | Lost: dark-first is wrong for an estate manager reading invoices at noon; maps kept as a secondary motif. |
| C. Service ledger | printed (timetable/ledger) | light paper | mono | red | ruled rows | Lost: the austere "printed form" overcorrection. Mono kept only for IDs and references. |

**Merge:** A is the system. B contributes the `RouteMap` illustration (live pickups). C contributes
Geist Mono for references (`PU-24-08813`, `TXN-…`), nothing else.

## 3. The category default we refuse

Top waste/recycling apps share: **leaf-green primary, recycling arrows, smiling illustrated
people holding bins, glassmorphism dashboards, a "Hello, Name 👋" header, pastel stat tiles.**

We refuse all of it:
- **No green as brand.** Green appears only as the semantic *success* tone ("Collected").
- **No recycling arrows / leaf icons as decoration.** Recycling is a service, shown with real numbers.
- **No illustrated people.** Our richness is stone strata, chalk lines and route maps.
- **No greeting headers.** The customer dashboard opens with the day of the next pickup.
- **No confetti tiles.** One accent, one role.

## 4. Tokens

### Colour — roles (light / dark)

| Role | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#F2F4F6` | `#0E1318` | Page ground (chalk) |
| `surface` | `#FFFFFF` | `#161D25` | Panels, sheets, inputs |
| `sunken` | `#E8ECF0` | `#0A0E12` | Wells, table headers, segmented tracks |
| `ink` | `#111820` | `#EDF1F4` | Primary text |
| `ink-2` | `#46566A` | `#A8B4C0` | Secondary text (≥ 6:1 on canvas) |
| `ink-3` | `#617185` | `#8492A0` | Tertiary text, captions (≥ 4.5:1) |
| `line` | `#DAE0E6` | `#25303B` | Hairlines |
| `line-strong` | `#C0CAD4` | `#34414E` | Input borders |
| **`slate`** (primary) | `#2B3643` | `#232D38` | Brand fields, primary buttons, nav selection |
| `slate-ink` | `#F2F4F6` | `#EDF1F4` | Text on slate |
| **`stone`** (secondary) | `#DCE3EA` | `#2A3540` | Secondary buttons, chips, selected rows |
| **`signal`** (accent) | `#FF5B1F` | `#FF6A33` | ONE role: *live / now / needs you* — next pickup, live truck, primary marketing CTA, unread dot |
| `signal-ink` | `#1A0D06` | `#1A0D06` | Text on signal (6.9:1) |
| `success` / bg | `#127A57` / `#E1F2EA` | `#3FBF8F` / `#10291F` | Collected, paid, approved |
| `warning` / bg | `#9A6408` / `#FBF0D9` | `#E3A93B` / `#2B2110` | Pending, expiring, late |
| `danger` / bg | `#BF3328` / `#FBE6E3` | `#F07A6F` / `#331614` | Missed, failed, rejected |
| `info` / bg | `#2F5D8A` / `#E3ECF5` | `#7FB0E0` / `#13202D` | Scheduled, in progress |

The slate ramp (`slate-50 … slate-950`, hue ≈ 212°) is exposed for illustration only.
Status is never shown by colour alone: every badge carries a word, every chart a label.

### Type

| Step | Family | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `display-xl` | Bricolage Grotesque | clamp(44 → 104px) / 0.95 | 700 | −0.035em | Marketing hero, the pickup day |
| `display` | Bricolage Grotesque | clamp(34 → 60px) / 1.0 | 700 | −0.03em | Section heroes, big figures |
| `h1` | Bricolage Grotesque | 28 → 34px / 1.1 | 700 | −0.02em | Page titles |
| `h2` | Bricolage Grotesque | 20 → 22px / 1.25 | 650 | −0.01em | Section titles |
| `h3` | Geist | 16px / 1.4 | 600 | −0.005em | Panel titles, row titles |
| `body` | Geist | 15px / 1.6 | 400 | 0 | Running text |
| `small` | Geist | 13px / 1.5 | 450 | 0 | Metadata |
| `micro` | Geist | 12px / 1.35 | 500 | 0.01em | Labels, badges (floor: 12px) |
| `mono` | Geist Mono | 12.5–13px | 500 | 0 | IDs, references, amounts in tables |

Why: Bricolage Grotesque's ink traps and slightly hand-cut shapes read like chalk signage on
a slate board — characterful without being cute. Geist is a calm, neutral workhorse with
excellent tabular figures for an operations product. Mono is reserved for things a person
might read out on the phone to support (references).

### Space, radius, elevation

- **Spacing scale (px):** 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96.
- **Rhythm:** tight in groups (4–8), loose between groups (24–40), one rest per screen (56+).
- **Side margin:** 20px mobile, 32px tablet, content max 1240px; reading width 680px.
- **Radius family — cut stone:** `6` controls & badges, `10` panels & buttons, `16` sheets &
  hero fields, `24` marketing slabs. Badges are squared chips (6px), not pills.
- **Elevation:** content is flat. One shadow token for floating layers only (menus, sheets,
  toasts): `0 12px 32px -12px rgb(17 24 32 / .28)`. Glass (backdrop blur) only on the
  mobile tab bar and sticky headers.

### Iconography
Lucide, 1.75px stroke, 18/20px, colour = text colour. No icon chips except in settings-like lists.

## 5. Richness source — art direction

**Strata.** Layered slabs of slate, drawn as stacked bands with gently cleft (irregular) edges,
in slate tints with one chalk-white line and, where something is live, one signal-orange band.
Used on: marketing hero, auth panel, empty states, the customer pickup field, portal headers.
Always one hand: same band height rhythm (1 : 1.6 : 2.6), same 3–5 band count, same slight
2–4° tilt. Never decorative blobs, never gradients.

**Chalk lines.** Thin (1.5px) dashed or hand-curved strokes in `slate-ink` at 40% on slate
fields — routes, arrows, underline marks. The route line becomes signal orange when live.

**Route maps.** Stylised Uyo street grids (Aka Road, Oron Road, Ikot Ekpene Road, Abak Road)
for live pickup tracking, service areas and the admin control centre.

## 6. Signature interaction — "Clean slate"

When a pickup is marked collected:
1. **0 ms** — the slate pickup field holds; the truck dot reaches the address pin.
2. **0–520 ms** — a chalk-eraser sweep crosses the field diagonally (masked wipe, eased
   `cubic-bezier(.2,.8,.2,1)`), leaving a clean surface.
3. **380–700 ms** — "Collected 07:42" settles in; the status chip turns success.
4. **Haptic:** `navigator.vibrate([10, 30, 14])` where supported.
5. **Reduced motion:** a 160ms crossfade, no sweep.

Implemented in `src/components/brand/CleanSlate.tsx`, used on the customer dashboard and the
pickup detail live tracker.

## 7. Voice

Slate sells reliability, not technology. Calm, specific, short. Sentence case. No
exclamation marks. "Your waste gets collected. We handle the rest." Labels say what things are:
"Report missed pickup", not "Let us know!". Errors say what happened and what to do next.

## 8. Content realism

Uyo first: Ewet Housing Estate, Shelter Afrique Estate, Osongama Estate, Aka Road, Oron Road,
Ikot Ekpene Road, Nwaniba Road, Udo Udoma Avenue, Wellington Bassey Way, Abak Road, Itam.
Names from the place (Aniekan, Imaobong, Uduak, Ekemini, Nsikak, Idara, Edidiong, Mfon).
Money in naira with uneven, believable figures (₦7,000 plans, ₦23,400 payouts, ₦1.84m MRR).
References in mono: `PU-26-08813`, `TXN-7Q4K2M`, `CT-UYO-014`, `CMP-1182`.

## 9. Structure

- **Mobile:** content edge-to-edge with 20px margins; floating glass tab bar (4 destinations +
  More sheet); primary action in the thumb zone; modals become bottom sheets.
- **Desktop:** left sidebar (grouped), top bar with ⌘K command palette, notifications, account.
- **Tables** collapse into stacked rows on mobile, never horizontal scroll for primary data.
- **Every major flow** has loading, empty, error, success, pending, failed, cancelled,
  suspended, expired, offline, unauthorized, not found and service-unavailable states
  (`StateView`).

---

## 10. Implementation guide (for everyone building pages)

**Stack:** Vite 8 · React 19 · React Router 8 (data router, `src/routes.tsx` generated by
`scripts/routes.py`) · Tailwind 4 (tokens in `src/index.css`) · lucide-react · TypeScript strict.

**Reference page:** `src/pages/app/Dashboard.tsx` — the quality bar. Read it before writing a page.

**Rules**
1. **Tokens only.** Colours via semantic utilities: `bg-canvas bg-surface bg-sunken text-ink text-ink-2 text-ink-3
   border-line border-line-strong bg-slate text-slate-ink bg-stone bg-signal text-signal-ink bg-success-bg text-success …`.
   No raw hex outside SVG illustration. Must look right in dark mode (`.dark` swaps the variables).
2. **Type styles:** `t-display-xl t-display t-h1 t-h2 t-h3 t-body t-small t-micro t-mono` and `tnum`. Nothing under 12px.
3. **One accent, one role.** `signal` = live / now / needs-you, plus the single primary marketing CTA. Primary actions
   inside portals are `<Button>` (slate). Never use signal decoratively.
4. **Compose from the kit** (`@/components/ui`): `Page, PageHeader, Section, Panel, List, ListRow, DescriptionList,
   Button, ButtonLink, IconButton, Badge, StatusBadge, Input, Select, Textarea, PhoneInput, CurrencyInput, PasswordInput,
   OTPInput, SearchInput, Checkbox, Switch, ChoiceCard, Segmented, ChipGroup, FileDrop, AddressInput, Tabs/useTab,
   Modal, Drawer, ConfirmDialog, Menu, Popover, Tooltip, useToast, Alert, EmptyState, StateView, Skeleton, SkeletonRows,
   ProgressBar, Meter, DataTable, FilterBar, useFilteredRows, ExportMenu, Stat, StatStrip, Timeline, Stepper, Sparkline,
   AreaChart, BarChart, Donut, StackedBar, Avatar, AvatarStack, Breadcrumbs, Kbd, Ref`.
   Brand: `Logo, Strata, SlabMark, RouteMap, CleanSlate, ServiceAreaMap` (`@/components/brand/*`).
5. **Group with space and hairlines first**; `Panel` only when the thing is an object (an invoice, a contract, a job).
   No cards inside cards. No 2×2 stat-tile grids by reflex — say the fact as a sentence, or one hero number.
6. **Mobile first.** Design at 390px, then `sm: md: lg: xl:`. No horizontal page scroll. Tables via `DataTable` (stacks on
   phones). Primary actions reachable by thumb. To hide a `Button`/`IconButton`/`ButtonLink` on small screens use a
   variant (`max-md:hidden`) — never bare `hidden` (it loses to the button's own `inline-flex`).
7. **Everything works.** Tabs filter, search searches, forms validate (show errors), modals open and confirm, actions
   change local state and toast. Exports call `toast`. Destructive actions use `ConfirmDialog`.
8. **States.** Use `StateView`/`EmptyState`/`Skeleton` where the spec lists them (Part L): loading, empty, error, success,
   pending, failed, cancelled, suspended, expired, offline, unauthorized, not found, service unavailable.
9. **Copy.** Sentence case. No exclamation marks, no emoji, no "Welcome back"/greetings, no marketing fluff in the app.
   Specific, uneven, Uyo-real data from `@/data` (`DEMO_NOW` = Mon 5 Oct 2026 08:12). Money with `formatNaira`.
   References in mono via `<Ref>`/`t-mono`.
10. **Don't edit shared files** (`src/components/**`, `src/data/**`, `src/lib/**`, `src/index.css`, `src/routes.tsx`).
    Put page-local helpers in `src/pages/<area>/_shared.tsx` and extra mock data in `src/pages/<area>/_data.ts`.
    Report shared-component bugs instead of patching them.
11. **Verify.** `npx tsc -b --noEmit 2>&1 | grep "src/pages/<area>"` must be empty. Run a dev server on your own port
    (`npx vite --port <PORT> --strictPort &`) and `node scripts/shot.mjs --base http://localhost:<PORT> --out shots/<area> /route …`
    (390 and 1440 widths; add `--dark` once). Open the PNGs and fix what you see. The script fails on console errors,
    horizontal overflow and tiny text.

---

## 11. App-designer evidence

- **Three directions:** `design/explore.html` → `shots/explore-r3/sheet.png`.
- **Chosen direction set:** `design/mockup.html` → `shots/mockup-final2/sheet.png`.
- **Compact-height set:** `shots/mockup-final2-se/sheet.png` at 375 × 667.
- **Mechanical scan:** 0 failures for all three directions, all seven standard frames, and all seven compact frames.
- **Critique:** two scored rounds in `CRITIQUE.md`; round two meets the stop rule with every line at 4 or 5.
- **Environment note:** the iOS chrome renderer cannot load `/System/Library/Fonts/SFNS.ttf` on this Linux host. It falls back to the bundled web faces; safe areas, status chrome, typography, contrast and layout were still rendered at 3× and inspected.
