# Slate request service selection

2026-10-22. Scoped refinement to the existing household web app.

## Brief

Self-authored from the user's established brief and this repository. Slate helps households in Uyo request waste collection. The first action here is to choose the right collection service while understanding its starting amount and collection frequency. The control should feel clear, considered and dependable. Preserve the Slate grey identity, supplied S mark, Bricolage Grotesque display face and Geist body face. Deliver an implemented web popup and browser evidence, with local App Designer studies. No paid generation, new fonts, SwiftUI build or app-wide navigation redesign is needed.

The user already specified the core action, brand and implementation, so these questions were not repeated. No user decision about name, tabs or removed features is required.

## Current app

Inspected `src/pages/live/AccountPage.tsx`, `account.css`, `src/lib/service-catalog.ts`, `server/contracts.ts`, existing Modal and design tokens. `/app/book` is the real household request route. Its Service field is a native select containing names only. `/app/services` already displays authoritative starting amounts and full frequency phrases; the request form should reuse the same catalog and mapping.

`before.html` is an explicitly labelled source reconstruction. It demonstrates the earlier Service field and form hierarchy, not a pixel-exact screenshot of an older deployed page. `before-after.html` keeps the same reconstruction beside the expanded selection summary. Before scan failures: none. The known tell is flat form metadata: the select hides facts needed to make a choice. This is a functional comparison control, not an excuse to redesign the full screen.

Keep:

- [x] All six services admitted by BOOKING_SERVICES, in the established order.
- [x] Catalog names, starting amounts, billing units and collection frequencies.
- [x] Default and URL-prefilled selection, stored as `draft.serviceId`.
- [x] Collection address, area, date picker, window, notes, consent and submit behavior.
- [x] Existing request API, validation, idempotency, review process and routes.
- [x] Cancel/close preserves the last service. A new service choice immediately closes the popup and becomes the form answer.
- [x] Existing logo, grey identity, fonts, light/dark modes and accessible interaction.

Lose: names-only choice list, hidden billing units and uncertainty about schedule.
Unknown: physical-device feel and screen-reader speech until real-device testing. Static designs do not prove either.

## References and research status

Read the full ten-source catalog at `/home/inimfon-udoh/.codex/skills/ui-reference-guide/references/catalog.md`. Its source selection informed this decision:

| Source | Decision |
|---|---|
| Superdesign | Use local concept exploration; no hosted canvas or project transmission. |
| Better Design | Retain semantic product tokens and a single reusable control. |
| Design Taste | Follow the installed accessibility guidance for labels, focus, targets and reduced motion. |
| Canvas UI | GPU effects add no information to this selection task, so none selected. |
| Paper Shaders | Texture shaders would reduce legibility and add runtime cost, so none selected. |
| UI Layouts | Compare facts with aligned rows, no ornamental content cards. |
| Hyperiux | No cursor or WebGL effect helps a touch-first popup. |
| Motion Primitives | Inspected `components/core/dialog.tsx`: bounded dialog transition and scroll locking are relevant; retain the existing app Modal implementation. No code copied. |
| Cursify | No pointer customization; leave native touch and keyboard behavior. |
| Trickle UI | No animated copy; service facts stay stable during comparison. |

Focused local sources actually inspected: Motion Primitives dialog implementation and Design Taste `taste-accessibility/SKILL.md`, plus App Designer's slop, directions, imagery, typography, color, layout, copy, motion, critique and setup references.

Current official category research was attempted through search and direct reads for WM, Recycle Coach and Republic Services, with an outside-app reference to Vitsoe's 606 shelving system. Search returned an error with no content. Direct reads failed DNS resolution in the sandbox. Therefore no competitor visual findings are asserted. These are research targets, not verified observations:

- https://www.wm.com/us/en/home/residential-waste-recycling-pickup
- https://www.recyclecoach.com
- https://www.republicservices.com/residents
- https://www.vitsoe.com/us/606

The concept comes from the existing Slate name, supplied mark, cool grey palette and the real need to compare services. The material-tray and depot-board analogies are inferred design references, not claims that those official sites exhibit these designs.

## Three directions

`explore.html`, rendered to `shots/explore/sheet.png`, explores three treatments of the same real services:

1. **Slate is a material tray.** Object family; light ground; Bricolage Grotesque; neutral slate accent; colour-material richness. A bright, softly bounded choice surface holds names and schedules next to large starting amounts. Selected row is one inset slate slab with a fine selection rail and check.
2. **Slate is a depot route board.** Place family; dark ground; Geist Mono; amber accent; shape richness. Compact edges and an amber selected rail make the control feel like route information. Lost because it introduces a new accent and gives every amount a code-like character.
3. **Slate is a collection notice.** Printed family; yellow colour field; Georgia serif; blue accent; colour richness. High-contrast notice material makes collection facts prominent. Lost because it changes the brand and asks users to learn a new visual voice.

The material tray wins because it makes price and frequency visible while continuing the established product. The other directions were rendered before selection. No new palette or font ships.

The history check normally requires three changed columns. This is an intentionally narrow refinement within an established brand, and user instructions to preserve Slate grey take precedence over an arbitrary identity change. Current app row and chosen row both preserve `object | light | grotesque | neutral | colour-material`. This is a documented scope exception, not a claim that a fresh identity meets the history threshold. The shared history is read-only for this agent; the pending row below is retained here.

Pending history row: `2026-10-22 | Slate request service picker | object | light | grotesque | neutral | colour-material`.

## Refused defaults

No green environmental theme, leaf icons, generic recycling illustration, promotional plan badges or new dashboard skeleton. No fake discounts, recommended-plan claim, payment promise or forced elaborate motion. The comparison has only two facts beyond each service name: starting amount and collection frequency. The existing required review remains clear.

## Tokens

Use existing production variables; mockups mirror their values.

| Role | Light | Dark |
|---|---|---|
| Ground | #f2f4f6 | #0e1318 |
| Raised surface | #ffffff | #161d25 |
| Primary ink | #111820 | #edf1f4 |
| Secondary ink | #46566a | #b2bfca |
| Rule | #c0cad4 | #4b5b6c |
| Selection | #2b3643 | #dce3ea |
| Selected material | #e8ecf0 | #242e3a |

Typography: Bricolage Grotesque headings and amounts, Geist for names and supporting facts. Scale 38 page title, 28 popup title, 19 amount, 16 selected field title, 15 row title, 14 body, 12 supporting copy, 11 billing unit. Prices use tabular figures. The real app can follow its existing 14px supporting text minimum. The mockups use locally licensed project fonts; Apple fonts are absent on Linux, and these are not Apple-font verified native screens.

Spacing: 4/8/12/16/20/24/32. Page gutter 22px in study, popup padding 20px, row gap 12px. Existing implementation may retain its established 24px Modal padding. Radius family 9px field, 10px selected row, 20px mockup modal; use existing live Modal radius to preserve consistency. Touch: rows at least 86px in mockup, close target 44px. One selected surface only; other rows use hairlines.

## Content

Source: `catalog.json`, copied from the six booking entries in `src/lib/service-catalog.ts` without changing business data.

| Service | Starting amount | Frequency |
|---|---|---|
| Slate Home | From ₦7,000/month | 2 collections per week |
| Slate Home Lite | From ₦4,500/month | 1 collection per week |
| Bulk Waste Pickup | From ₦15,000/pickup | One-time collection |
| Recycling Pickup | From ₦1,500/month | 1 collection per month |
| Special Collection | From ₦45,000/job | One-time collection |
| Event Cleanup | From ₦60,000/event | One-time collection |

Field label: `Service`.
Popup title: `Choose a service`.
Intro: `Compare the starting price and collection frequency.`
Price qualifier: `From`.
Review note: `The team confirms the final price before collection.`
Close accessible label: `Close service selector` in the study; the implementation may retain the existing Modal's `Close` accessible label.
Selected trigger: service name plus `From <amount><unit> · <frequency>`.

The rest of the form retains existing copy. All copy avoids em dashes and the skill's stock marketing phrases. The demo form simplifies notes/consent below the fold; production retains them. No personal data is used.

## Signature interaction

The signature is the comparison resolving into the answer. Trigger: activate Service. Frame 1: popup shows six factual choices, current selection shaded with rail and check. Frame 2: press a row; its check replaces the previous check. Frame 3: popup closes and the form carries the selected name, price, unit and frequency. No second confirmation button. Target elapsed motion is 120 to 180ms if the existing Modal supports it; no haptics are claimed by a browser. Reduced motion resolves immediately. Static `signature-open` and `signature-recorded` frames represent the endpoints; browser tests prove the actual behavior.

Keyboard contract: focus moves into the popup, Tab stays inside it, Enter or Space selects; Escape, close and backdrop cancel. Closing returns focus to the Service trigger. Native buttons use clear pressed state; selection is not conveyed by colour alone. Selection changes form state only until Send request saves the existing request payload.

## Deliverables and scope

Five distinct states plus a signature endpoint and unchanged icon live in `mockup.html`. `before-after.html` compares the source reconstruction with the selected service facts. `shots/` preserves 3x PNGs and raw scans locally and is already ignored by the repository. No unrelated page, logo or icon redesign was made. Root owns application implementation, runtime browser testing, commit, push and deployment.

## Round 2 refinements

Continuing independent critic requested five small changes. Applied in the mockups: bottom-aligned mobile sheet with a short grabber; compact scroll cue and separate last-row proof; price/unit and frequency on separate selected-field lines; a selected Recycling middle frame before closure; and removal of the redundant Collection plans eyebrow from the selected treatment. No new business facts, palette or font changes were introduced. Actual implementation retains existing shared Modal semantics and owns runtime interaction proof.
