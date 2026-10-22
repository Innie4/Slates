# Service picker design verification

2026-10-22. These records cover local design artifacts. Root owns source/build/runtime tests and live deployment proof.

## Render environment

Node v24.21.0; Chrome at `/usr/bin/google-chrome`; existing playwright-core available. Initial sandboxed Chrome launch failed with `setsockopt: Operation not permitted`; the normal elevated local renderer succeeded. Preflight rendered one screen and passed the scan; the image was visually opened. No package or browser was installed.

Apple system fonts are absent on Linux. The studies intentionally use locally licensed project Bricolage Grotesque and Geist files. The shared device kit may request unavailable Apple fonts; this does not establish native Apple-font fidelity. No external imagery, paid generation or hosted design service was used. Official web research was unavailable as documented in DIRECTION.md.

## Fresh local renders

Commands use `/home/inimfon-udoh/.codex/skills/app-designer/scripts/shoot.mjs` and all final main renders are at default 3x.

| Artifact | Viewport | Frames | Failures | Warnings |
|---|---|---:|---:|---:|
| shots/explore | 402×874 | 3 | 0 | 0 |
| shots/r1 | 402×874 | 6 | 0 | 3 |
| shots/r1-se | 375×667 | 6 | 0 | 6 |
| shots/r2 | 402×874 | 7 | 0 | 3 |
| shots/r2-se | 375×667 | 7 | 0 | 3 |
| shots/before-after-r2 | 402×874 | 2 | 0 | 2 |

The supplied icon is a separate rendered asset, excluded from text scan frame counts. It is unchanged.

Warning answers: main request-form screens have partial hint or field text at the edge of their intentional scroll container. At compact height the next form field passes below the home safe area. The opaque safe-area layers cover it, and the actual form remains scrollable. Before/after warnings have the same cause in the source reconstruction and final field study. No horizontal clipping, contrast failure or text collision was reported in final sets. All final popup states have zero warnings in the main and compact sets.

Header and footer of the popup are explicitly opaque fixed layers outside the scrollable choice list. The renderer's text-box collision logic does not account for clipping, so these layers use its documented `data-float` annotation. This describes the real composition; it does not hide a visible text overlap. The full-size light/dark captures were opened and inspected.

The first scroll-end capture was rejected by the independent critic because the script ran before layout. The corrected source waits for load, fonts and a layout frame before scrolling. Actual runtime `shots/service-picker/open-last-320.png` is independent proof that Event Cleanup and the final-price note are reachable together. Do not infer end-of-list proof from an early screenshot showing Slate Home at the top.

## Independent review

One continuing critic reviewed static rounds 1 and 2 and actual product rounds 1 and 2. Latest scoped result: 9 of 12 rubric lines at 4 or above, none below 3, actual fidelity 5. All five specific refinement requests landed. This meets the skill's stop rule for this web control; it is not a claim of visual perfection. Details are in CRITIQUE.md.

## Actual application evidence

Root reports and owns tests of all six catalog choices, choice-and-close behavior, cancel preservation, focus return/trap, saved booking, preselection, light/dark mode, reduced motion and responsive viewports 320×667, 390×844 and 1440×1000. Runtime screenshots are in `/home/inimfon-udoh/Slates/shots/service-picker/`, reviewed by the independent critic. Deployment is verified separately by root. Static HTML is supporting design evidence, not a replacement for those runtime checks.

## Deliverable paths

- `DIRECTION.md`: self-authored brief, keep inventory, concepts, references, tokens, exact facts, interaction.
- `explore.html` and `shots/explore/sheet.png`: three rendered alternatives.
- `mockup.html` and `shots/r2/sheet.png`: final selected treatment and interaction states.
- `before-after.html` and `shots/before-after-r2/sheet.png`: labelled reconstruction versus improved answer.
- `scroll-check.html`: local compact scroll capture.
- `CRITIQUE.md`: independent scores and remaining limits.

Global App Designer history was not edited because it is outside this agent's owned workspace files. Pending row retained in DIRECTION.md. Existing `shots/` ignore rules keep PNGs and raw scans local; HTML/CSS/JS, generator, catalog snapshot and documents remain reviewable source.
