# Service picker critique

2026-10-22. One continuing independent critic reviewed both static studies and actual browser captures. The rubric is App Designer's 12-line critique plus redesign fidelity. Scores concern this scoped web component, with responsive web fluency used for the native-fluency line. No score implies a native iOS build or a 5/5 perfection claim.

## Static study rounds

| Criterion | Round 1 | Round 2 | Visible evidence in round 2 |
|---|---:|---:|---|
| Concept on the pixel | 3 | 4 | Selected slate inset, aligned facts and resolved answer express the comparison tray. |
| Not the category average | 3 | 3 | Familiar choice-list structure remains intentionally usable. |
| Not this skill's average | 3 | 4 | Cool slate, Bricolage, material selection and strong sans differ from grey-paper/red/mono. |
| Hierarchy | 4 | 4 | Choose a service leads, amounts read next. |
| Typography | 4 | 4 | Distinct title, service, amount and schedule styles; readable Naira. |
| Colour | 4 | 4 | Consistent cool slate and designed dark surfaces. |
| Richness | 3 | 3 | Surface layering and the selection material remain the main visual richness. |
| Rhythm and space | 4 | 4 | Names and schedules pair; amounts align down the right. |
| Craft details | 4 | 4 | Six exact catalog choices, stable price/unit placement, coherent corners. |
| Responsive web fluency | 3 | 4 | Bottom-aligned mobile sheet, grabber and bounded scrolling. |
| Signature | 3 | 4 | Recycling shown pressed/checked, then recorded in the collapsed answer. |
| Feature test | 3 | 3 | Useful polished component, limited editorial novelty. |
| Fidelity | 4 | 4 | Selection facts and existing source form context retained in simplified studies. |

Round 1: 5 of 12 lines at 4 or above, none below 3. Not done by the stop rule.
Round 2: 9 of 12 lines at 4 or above, none below 3. Done by the scoped stop rule. The critic opened all eight main PNGs, all seven compact frames and both scroll-check files.

Five requests and outcomes:

1. Mobile bottom sheet plus grabber: landed. Actual app already had its shared Modal sheet pattern, so this corrected mockup fidelity.
2. Make continued scrolling obvious and prove last services reachable: compact cue landed. Initial static scroll-check script ran before layout and was rejected as evidence by the critic. It was corrected to wait for load/fonts/layout; actual runtime `shots/service-picker/open-last-320.png` independently proves Event Cleanup and the price note remain visible.
3. Separate price/unit from frequency in narrow collapsed field: landed in study and real app.
4. Show middle Recycling press before closure: landed in `06-signature-choice.png`, then `07-signature-recorded.png`.
5. Reduce compact header cost by removing redundant eyebrow: landed.

No palette, logo or font replacement was requested. No further broad design changes were made after the scoped stopping criterion passed.

## Actual product rounds

The same critic independently opened the actual browser evidence under `/home/inimfon-udoh/Slates/shots/service-picker/`. These are separate from the static iPhone studies. Root owns runtime tests and deployment.

| Criterion | Actual round 1 | Actual round 2 | Evidence |
|---|---:|---:|---|
| Concept on the pixel | 4 | 4 | Real names, starting amounts and frequency share a selectable row. |
| Not the category average | 3 | 3 | Comparison stays familiar and direct. |
| Not this skill's average | 4 | 4 | Slate identity continues without a generic new palette. |
| Hierarchy | 4 | 4 | Popup title and amount contrast keep the task clear. |
| Typography | 4 | 4 | Narrow collapsed amount and schedule occupy distinct readable lines. |
| Colour | 4 | 4 | Light and dark existing tokens remain consistent. |
| Richness | 3 | 3 | Material contrast remains restrained. |
| Rhythm and space | 4 | 4 | Stable comparison rows survive desktop and compact sizes. |
| Craft details | 4 | 4 | Selected-only 3px rail distinguishes selection from hover/focus. |
| Responsive web fluency | 4 | 4 | True mobile bottom sheet/grabber and bounded option scroll. |
| Signature | 3 | 4 | Selection resolves into a readable answer, then persists in the saved request. |
| Feature test | 3 | 3 | Focused production control rather than a new visual identity. |
| Fidelity | 5 | 5 | All six choices, real form controls and request persistence verified. |

Actual round 1: 8 of 12 at 4 or above. Actual round 2: 9 of 12 at 4 or above; none below 3. Fidelity 5. Done by the scoped stop rule. No code-review blockers reported.

The critic reviewed all eleven runtime images, including `selected-320.png`, `selected-390.png`, `open-last-320.png`, dark/mobile/desktop open states and `saved-request.png`. The selected-only rail, narrow two-line facts, final choice visibility and persisted request landed.

Residual unverified items: physical touch feel, real screen-reader session and Apple system-font fidelity on Linux. No claim of 5/5 throughout or native Apple verification is made.
