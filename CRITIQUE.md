# Slate visual critique

The available environment did not expose a separate critic harness, so this follows the
app-designer fallback: self-score harder than feels fair, keep every round, and judge rendered
pixels rather than the design brief.

## Round 1

Reviewed at full size:

- `/home/inimfon-udoh/Slates/shots/explore-r2/sheet.png`
- `/home/inimfon-udoh/Slates/shots/mockup-r2/sheet.png`
- `/home/inimfon-udoh/Slates/shots/mockup-r2-se/02-pickup-detail.png`

| # | Rubric line | Score | Pixel evidence |
|---|---|---:|---|
| 1 | Concept on the pixel | 5 | Slate strata, chalk route lines and the wiping-clean storyboard carry the material idea without relying on a logo. |
| 2 | Not the category average | 5 | The system avoids leaf green, recycling arrows and cheerful mascot art in favour of an operational slate field and hi-vis signal. |
| 3 | Not this skill's average | 5 | Expanded display type, stone bands and live-route geometry keep it far from the grey-paper mono-ledger default. |
| 4 | Hierarchy | 4 | The stop count, pickup window and service choice each land first, though the pickup-detail window needed a clearer intermediate size. |
| 5 | Typography | 3 | The hierarchy has character, but three screens introduced a third font family and the app-wide scale had too many sizes. |
| 6 | Colour | 5 | Deep slate, chalk white and one signal orange have memorable jobs; the dark Today frame feels authored rather than inverted. |
| 7 | Richness | 5 | Every core state has a shared material and route illustration, with no decorative stock imagery or card-grid filler. |
| 8 | Rhythm and space | 4 | Groups and rests are deliberate, but the compact pickup detail pushed its lower facts too close to the home indicator. |
| 9 | Craft details | 2 | Content is specific and corners align, but lower facts collided with the compact-phone home indicator and three screens failed the font-family scan. |
| 10 | Native fluency | 4 | Status chrome, a floating glass tab bar, thumb-zone actions and a reduced-motion story read as iPhone-native patterns. |
| 11 | Signature | 5 | The 700 ms eraser sweep turns collection into a literal clean slate and is shown in three readable frames. |
| 12 | The feature test | 4 | Today and the signature storyboard are screenshot-worthy, while craft defects kept the set below portfolio finish. |

Five changes requested:

1. Limit every screen to two content type families; keep IDs tabular without a third mono face.
2. Give the pickup window a distinct 22 px display step between the title and supporting sentence.
3. Reduce the app-wide type scale from ten sizes to eight or fewer.
4. Shorten the pickup map and facts spacing so all meaningful text clears the compact-phone safe area.
5. Re-render the three directions, standard set and 375 × 667 set; accept no mechanical failures.

**Status:** not done. Typography and compact safe-area defects remain.

## Round 2

Changes 1–5 landed. The type families are constrained, the collection window leads clearly,
the scale is eight sizes at standard height and seven at compact height, and the pickup detail
now clears the home indicator. No request was declined.

Reviewed at full size:

- `/home/inimfon-udoh/Slates/shots/explore-r3/sheet.png`
- `/home/inimfon-udoh/Slates/shots/mockup-final2/sheet.png`
- `/home/inimfon-udoh/Slates/shots/mockup-final2-se/sheet.png`

| # | Rubric line | Score | Pixel evidence |
|---|---|---:|---|
| 1 | Concept on the pixel | 5 | The live route, layered slate and clean-state wipe form one recognisable visual sentence across screens. |
| 2 | Not the category average | 5 | The chosen direction remains distinctly operational and material-driven without environmental-app clichés. |
| 3 | Not this skill's average | 5 | The bold grotesque voice and route geometry stay present in lists, facts, services, dark mode and the icon. |
| 4 | Hierarchy | 5 | Each screen has one unmistakable lead: stops, window, service decision, motion story or clear-state message. |
| 5 | Typography | 5 | Geist and Bricolage provide controlled contrast, tight display tracking and readable tabular numerals with no third family. |
| 6 | Colour | 5 | Slate owns the surfaces, orange means live, and success green is restricted to the confirmed state in both themes. |
| 7 | Richness | 5 | Maps, strata, route marks and the eraser storyboard give the set visual substance with one art direction. |
| 8 | Rhythm and space | 4 | Alignment and grouping are strong at both heights; the compact detail intentionally sacrifices the lower CTA to preserve safe-area clarity. |
| 9 | Craft details | 5 | All labels, references, naira figures, corners and safe areas now hold at 3× with no clipping or placeholder content. |
| 10 | Native fluency | 4 | iOS chrome, safe areas, glass navigation and reduced-motion intent are convincing, though physical-device haptics remain unverified. |
| 11 | Signature | 5 | The concept-born wipe has a clear arrival, sweep and settled timestamp rather than a generic success animation. |
| 12 | The feature test | 4 | The Today screen, dark mode and motion storyboard are strong editorial frames; real-device motion is the remaining proof point. |

No further visual changes are required by the rubric. The mechanical scan reports zero failures
for 17 final frames: three direction screens, seven standard screens and seven compact screens.

**Status:** done by the stop rule — no line below 3, and all 12 lines are 4 or above.

## Round 3 — implemented webapp audit before redesign

The current environment did not expose a resumable critic agent, so the redesign uses the
documented fallback: self-score harder than feels fair and point to rendered pixels. The
user's requested 9/10 floor maps to 4.5/5 on this rubric.

Reviewed at full size:

- `/home/inimfon-udoh/Slates/shots/final-desktop/home@1440.png`
- `/home/inimfon-udoh/Slates/shots/final-desktop/institution_procurement@1440.png`
- `/home/inimfon-udoh/Slates/shots/final-desktop/admin_settings@1440.png`
- `/home/inimfon-udoh/Slates/shots/all-mobile-r2/about@390.png`
- `/home/inimfon-udoh/Slates/shots/all-mobile-r2/app_pickups@390.png`

| # | Rubric line | Score | Pixel evidence |
|---|---|---:|---|
| 1 | Concept on the pixel | 4.5 | Live pickup and marketing heroes clearly use slate, strata and routes, but generic pages lose that sentence below the header. |
| 2 | Not the category average | 5 | Slate/orange, local operations data and route geometry avoid recycling green, mascot art and pastel eco cards. |
| 3 | Not this skill's average | 4 | Flagship screens have a voice; settings, procurement and many inherited routes fall back to ordinary white SaaS cards. |
| 4 | Hierarchy | 4.5 | Core customer and admin screens land correctly, while generic pages give title, tabs and one large panel nearly equal weight. |
| 5 | Typography | 4.5 | Bricolage and Geist are tuned and readable, but the repeated generic compositions underuse the expanded display voice. |
| 6 | Colour | 5 | Slate owns the interface and orange retains one live role in both themes. |
| 7 | Richness | 4 | Route maps and strata are strong where present; 94 shared-template routes have little visual substance beyond UI components. |
| 8 | Rhythm and space | 4 | Flagship layouts breathe, while generic forms strand a single card in large empty desktop fields. |
| 9 | Craft details | 4 | Content and controls are believable, but fallback row labels and generic page furniture reveal the template. |
| 10 | Native fluency | 4.5 | Mobile navigation, safe spacing and sheets are convincing; desktop portal chrome still reads as a standard admin shell. |
| 11 | Signature | 5 | The clean-slate pickup completion remains specific, memorable and concept-born. |
| 12 | The feature test | 4 | Home and live pickup are feature-ready; the long tail does not yet sustain that quality. |
| 13 | Fidelity | 5 | All required routes, roles, controls and service facts are present and functional. |

Five changes requested:

1. Carry the route/place concept into shared page headers and the portal ground.
2. Replace the generic white desktop rail with a distinctly Slate operations rail.
3. Give public shared routes page-specific statements, live facts and Uyo service signals.
4. Replace card-stacked listing, settings, record and form templates with ledgers, passports, hairline sections and an approval route.
5. Mechanically audit all 159 routes at 390px, then inspect every portal family at 1440px and in dark mode.

**Status:** not done. Four rubric lines remain below the user's 4.5/5 floor.

## Round 4 — Uyo in motion

All five requested changes landed. The visual source is now the city route itself: a fixed,
quiet Uyo road field behind portal work; orange movement marks in headers; a dark operational
rail; page-specific public statements; ledger registers; service passports; and a procurement
approval route. The exhaustive mobile and desktop runs each report 0 failing of 159.

Reviewed at full size:

- `/home/inimfon-udoh/Slates/shots/redesign-r2/about@1440.png`
- `/home/inimfon-udoh/Slates/shots/redesign-r2/app_pickups@390.png`
- `/home/inimfon-udoh/Slates/shots/redesign-r2/operator_vehicles@1440.png`
- `/home/inimfon-udoh/Slates/shots/redesign-r2/institution_procurement@1440.png`
- `/home/inimfon-udoh/Slates/shots/redesign-r2/admin_settings@390.png`
- `/home/inimfon-udoh/Slates/shots/redesign-dark/admin_customers_CUS-2477@1440-dark.png`
- `/home/inimfon-udoh/Slates/shots/explore-r4-final/sheet.png`
- `/home/inimfon-udoh/Slates/shots/before-after-final3/sheet.png`

| # | Rubric line | Score | 10-point | Pixel evidence |
|---|---|---:|---:|---|
| 1 | Concept on the pixel | 5 | 10 | Route geometry, live orange movement and the dark operations rail identify the Uyo-in-motion idea on public, list, form, settings and record screens. |
| 2 | Not the category average | 5 | 10 | No recycling green, leaves, illustrated people or stat-tile confetti; the product looks like a local service network. |
| 3 | Not this skill's average | 5 | 10 | Settings use a workspace index, lists use operational ledgers, and forms use an approval route rather than grey-paper mono tables. |
| 4 | Hierarchy | 5 | 10 | Every sampled screen has one lead: service promise, arrival state, record count, approval trail or service standard. |
| 5 | Typography | 4.5 | 9 | Expanded Bricolage creates a recognisable voice while Geist carries dense operations; a few mobile portal titles need deliberate multiline wrapping. |
| 6 | Colour | 5 | 10 | Slate, chalk and signal orange remain memorable and role-bound; dark mode is composed as its own ground rather than inverted. |
| 7 | Richness | 5 | 10 | Uyo roads, route trajectories, service passports, strata and indexed ledgers sustain one art direction without external imagery. |
| 8 | Rhythm and space | 4.5 | 9 | Desktop fields have strong rests and alignments; long mobile registers intentionally reveal fewer rows above the floating navigation. |
| 9 | Craft details | 5 | 10 | All 159 routes pass overflow, tiny-text, broken-media, console and stub checks; local references, dates and naira values remain specific. |
| 10 | Native fluency | 4.5 | 9 | Mobile glass navigation, safe-area spacing, touch-sized controls and stateful progress are convincing; physical-device haptics remain unverified. |
| 11 | Signature | 5 | 10 | The route arrives and the pickup wipes to a clean slate; the interaction remains visible and unique to the service promise. |
| 12 | The feature test | 4.5 | 9 | About, live pickup, procurement and service-passport frames are editorially strong; production photography and real-device motion are the remaining proof. |
| 13 | Fidelity | 5 | 10 | Every item in the redesign keep list remains present, and generic routes now expose the same actions with clearer local context. |

The minimum is **4.5/5, equivalent to 9/10**. No concrete visual defect remains from round 3.
The only unverified items are physical-device haptics, motion timing under real load and Apple's
SF system font on a Mac/iPhone; those are environment limits rather than known defects.

**Status:** done by both the skill stop rule and the requested 9/10 floor.
