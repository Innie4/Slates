# Slate account access critique

Independent continuing critic. Reviewed 22 October 2026 using the app-designer rubric and the existing Slate brand contract. Scores describe rendered design evidence, not completed authentication or a production readiness assessment. The task is a responsive web app; native fluency means appropriate browser and device conventions, not a native navigation bar.

## Round 1

Evidence: opened every individual PNG in `shots/r1/` (login, signup, finish-signup, passkeys, passkey-cancelled, login-dark, access-signature and slate-icon), the reconstructed before login in `shots/before-r2/`, `DIRECTION.md`, and `shots/r1/scan.json`. The before is a source reconstruction, not a captured live page. The scan has no failures and three safe-area warnings. Rendered images were supplied at 3x; the image viewer scales the tall images to its display limit. No compact-height render or interactive product evidence has been supplied yet.

| Rubric line | Score | Visible evidence |
|---|---:|---|
| Concept on pixel | 4 | The supplied cut S mark and the narrow cleft-strata band form a recognisable entry-stone motif on both login themes and the passkey screen. |
| Not category average | 3 | Slate grey and Bricolage distinguish the page, but the central stack of provider buttons and ruled email separator remains a conventional account form. That convention is useful here; it is not portfolio-level distinction. |
| Not this skill's average | 3 | There is no mono-label or red-ticket treatment, but most of the page is still grey canvas, black type and rules; the material is confined to a thin strip. |
| Hierarchy | 4 | The heading is the clear landing point; methods, labels and helpers have deliberate descending weights. The cancellation notice is easy to find. |
| Typography | 4 | Bricolage's cut forms and Geist's quieter controls make a convincing brand pair. The two-line headings are controlled, though they occupy substantial height on small screens. |
| Colour | 4 | Slate neutrals and the single orange seam are consistent. The dark frame has separately tuned surfaces, ink and provider treatments rather than a simple colour inversion. |
| Richness | 3 | The strata band supplies a material cue without illustration clutter, but it is a small isolated accent and absent from the cancellation state. The icon's enlarged raster edges visibly soften. |
| Rhythm and space | 3 | Grouping is consistent, but the login's large header, artwork and repeated vertical gaps push its primary Sign in action into the bottom crop at 402 by 874. The before reconstruction exposed the full password action and account-help navigation. |
| Craft details | 3 | Icons, borders and typography align cleanly. However, Apple appears as a fully active action despite the free-only launch decision, the finish-signup identity omits the selected account email, and the passkey mockup advertises Rename without evidence of its implementation. |
| Native fluency | 3 | The page correctly describes the real device prompt and provides an email fallback. The 15px input text may trigger iOS Safari zoom when implemented literally; compact-height, keyboard and actual prompt behavior are unverified. |
| Signature | 3 | The three seam states explain a coherent handover without a fake biometric prompt. This is a labelled schematic, not the visible in-context waiting/success states of the actual entry form, so its effect on the interaction is unproven. |
| The feature test | 3 | Calm, credible and coherent enough to develop further, but the initial viewport still gives too much space to setup before reaching the user's password action. No frame currently merits a design-feature claim. |
| Fidelity | 3 | Logo, email/password inputs, registration, terms, local purpose and both themes are present. Create-account/help links fall below the initial login crop; route preservation, optional demo behavior and keyboard access cannot be established from these renders. |

Five changes that would raise the lowest scores most:

1. **Login and dark login: make email access reachable sooner.** In `auth-design.css`, reduce the mobile header/material allocation and vertical group gaps, use a 34px login heading, and keep 16px input text. At 402 by 874, expose the complete password submit and show an unambiguous continuation to account-help/create-account links. At 375 by 667, prove every control remains reachable by scrolling, without a clipped fixed action or horizontal overflow. Signup may remain a longer scrolling form.
2. **Provider availability: match the actual free launch.** In both signup/login frames, render Apple unavailable with an adjacent plain explanation, or omit it when absent from configuration. A visually active Apple action cannot be the launch design when membership and credentials do not exist. Treat Google similarly until configuration is present. Do not solve this by reducing text contrast below accessibility requirements.
3. **Finish-signup: identify the account being used.** Display the verified provider email below the Google identity heading, keep it read-only, and retain a clear change-method action. This prevents a user completing the wrong Google account without discovering the mistake later.
4. **Passkey management: show the real supported actions and confirmation.** Remove Rename if the implementation only supports naming at enrollment, or implement it before advertising it. Add an actual recent-auth/enrollment state and a removal confirmation with the remaining access method visible. Use a 16px input for the passkey name in the real form. The current one-line note does not demonstrate those safeguards.
5. **Show state feedback in its real context.** Replace or supplement the signature's explanatory list with small versions of the actual login action in waiting, cancelled and server-confirmed states. Keep the orange seam attached to that active action. In the cancellation screen, remove the product-implementation explanation, "This screen explains the browser prompt. It does not imitate or replace it." The preceding device explanation is sufficient for users.

The supplied logo should be preserved. A sharper large icon needs a vector master from the brand owner; do not invent a replacement mark merely to raise the craft score. The icon study has a slate backing, while the already deployed favicon is a separate transparent asset; this critique does not request a favicon background.

**Stop rule:** Not done. No line is below 3, but only four of the first twelve lines score at least 4; the skill requires at least nine. Do not report 5/5. The next round should show the five asks above, compact-height evidence and the actual implemented web screens. Missing Apple fonts remain an explicitly disclosed platform-verification limit.

## Round 2

Evidence: opened all nine individual PNGs in `shots/r2/`, all nine in `shots/r2-se/`, all three bottom-scroll PNGs in `shots/r2-se-bottom/`, and the before/after sheet. Read the raw scan summaries. No failures are reported. The normal scan covers eight frames; the compact scan covers seven and does not include the signature storyboard. The supplied icon is a separate render, not a scanned screen. These are mockups of the configured Google target, not proof that Google is live. Actual product screenshots remain pending.

| Rubric line | R1 | R2 | Evidence and change |
|---|---:|---:|---|
| Concept on pixel | 4 | 4 | The cut logo and strata remain coherent; the smaller orange seam now frees the first login viewport for the entry action. |
| Not category average | 3 | 3 | Familiar provider buttons and email fields deliberately remain. The result has Slate's voice, but the composition is still conventional account access. |
| Not this skill's average | 3 | 3 | The grey canvas and ruled groups remain the principal treatment. The restrained solution is appropriate for access, but not an especially rich departure from that average. |
| Hierarchy | 4 | 4 | Headings still lead without competing with each other, and unavailable Apple now has a clear subordinate state. |
| Typography | 4 | 4 | The compact heading and 16px field values preserve the pairing's voice while improving density and Safari input sizing. |
| Colour | 4 | 4 | Both themes retain readable ink, distinct fields and a disciplined orange seam. Status green and destructive red have separate functional roles. |
| Richness | 3 | 3 | The strata provide material in secondary states, while the first login has only the supplied mark and a short seam. This is purposeful restraint, not portfolio-level visual richness. |
| Rhythm and space | 3 | 4 | The complete password action and both supporting links now fit the 402 by 874 login. The 375 by 667 bottom render proves their reachability rather than hiding them behind a fixed action. |
| Craft details | 3 | 4 | Unavailable Apple is explicit, the verified identity email is visible, Rename is gone, and the removal design names the credential and remaining methods. |
| Native fluency | 3 | 4 | Minimum-sized actions, 16px fields, device-owned verification and a clear alternate method now form a credible responsive web flow. Real iOS keyboard behavior and biometrics remain unverified. |
| Signature | 3 | 4 | Waiting, cancelled and confirmed groups now use the actual action shape and a seam attached to it; the fallback remains visible. This scores the rendered proposal, not implemented motion. |
| The feature test | 3 | 3 | It is a clean service account flow. The screenshots do not justify claiming an editor would feature the app for this design alone. |
| Fidelity | 3 | 4 | The before/after demonstrates retained password access and supporting account links with added methods. Production routing, demo gating and the layout's privacy/terms footer still need actual-product verification. |

All five Round 1 asks landed in the revised studies. No ask was declined. In particular, normal-height login is substantially clearer; signup remains intentionally scrollable and its bottom render shows passwords, consent and submission together.

The scan's safe-area warnings describe text inside an intentional scroll container passing behind the opaque device chrome. The bottom-scroll renders demonstrate that login, signup and finish-signup actions can be brought fully into view. The bottom signup's "largest text is 16px" warning is expected for the lower half of a form; adding a duplicate hero there would harm the task. Compact reauthentication/removal also scroll and should be checked in the real modal with the keyboard open. Apple font availability and the enlarged raster mark remain unchanged limitations.

Next five implementation checks, in priority order:

1. Compare actual login at 375 by 667 and desktop width with this study. Preserve the complete password action at the normal phone height and document the short-phone scroll behavior. Do not count mockups as product screenshots.
2. Verify actual provider availability and the selected Google email through the real continuation route. Keep unavailable Apple readable, and show callback errors when a signed-in user returns from connecting a provider.
3. Capture real enrollment, recent-authentication and removal dialogs. Verify initial focus, keyboard trapping, Escape/cancel, and the final removal guard. The modal implementation need not copy these full-page study frames literally.
4. Show waiting/cancellation feedback in the implemented passkey action, then test the native ceremony with an isolated virtual authenticator. Do not infer a real biometric-device pass from that test.
5. Compare the actual light/dark login and privacy/terms footer, and check the form with a phone keyboard. Keep Slate's source mark; obtaining a vector master is a separate brand improvement, not a reason to redraw it here.

**Stop rule:** Not done by the strict editorial rubric. Eight of the first twelve lines are now at least 4, with no line below 3. This is a meaningful improvement, but it is not 5/5. The remaining lower scores concern editorial distinctiveness and richness; they should not be raised by adding visual noise to authentication. One focused actual-product round can establish whether the implementation earns these scores. After two unchanged rounds, apply the plateau rule instead of repeating the same polish.

## Actual product review

### Round 3, implementation

Opened the actual React screenshots `shots/runtime/login-dark-desktop-final.jpg`, `login-light-desktop-final.jpg` and `login-light-mobile-final.jpg`. Also inspected the actual account-security desktop/mobile screenshots, which use isolated fixture account data. The root verified the phone capture at 390 by 844, 16px email/password fields and no horizontal overflow. These are browser product captures, unlike the earlier phone-framed studies.

The desktop captures establish one material detail the mobile studies could not: a full Slate field with wide cleft strata across its lower edge. It has a clear visual purpose, belongs to the supplied mark and supports the form without competing with it. This earns the richness increase below. The phone keeps the action compact instead of shrinking that desktop composition into a decorative banner.

| Rubric line | R2 | R3 | Actual-product evidence |
|---|---:|---:|---|
| Concept on pixel | 4 | 4 | The supplied cut mark, large Bricolage statement, grey field and cleft strata now operate together in the real desktop composition. |
| Not category average | 3 | 3 | Slate has a distinct brand voice, while provider buttons and email access deliberately follow familiar conventions. |
| Not this skill's average | 3 | 3 | The account form and settings still use grey surfaces and ruled groups. This is appropriate restraint rather than an unusually rich visual system on every screen. |
| Hierarchy | 4 | 4 | The form's Sign in heading leads its own column; the larger brand statement is clearly in a separate field. On the phone, the form becomes the sole primary content. |
| Typography | 4 | 4 | The desktop display scale has voice and controlled line breaks; the smaller phone heading and 16px fields preserve practical entry. |
| Colour | 4 | 4 | Slate remains the main material, with one orange brand seam. Light and dark inputs, canvas and ink are separately resolved. Disabled Google and Apple are explained in plain text. |
| Richness | 3 | 4 | The actual desktop's full-width cleft material, supplied cut mark and deliberately scaled display supply a coherent object reference, beyond the isolated strip in the study. |
| Rhythm and space | 4 | 4 | The real phone capture exposes the complete password action and supporting links. Desktop brand, methods and fields maintain a small set of aligned verticals. |
| Craft details | 4 | 4 | Real provider states match current configuration, input icons align, and account settings use actual component styles with explicit connection and removal actions. No clipped text or horizontal collision is visible in the supplied final captures. |
| Native fluency | 4 | 4 | Real fields use 16px text on the phone and reachable actions. The browser integration tests exercise a device-owned virtual ceremony and cancellation; physical iOS keyboard/biometric behavior remains outside the evidence. |
| Signature | 4 | 4 | The reviewed storyboard is carried into an action-bound orange seam in `.auth-passkey`, activated by busy/focus state with a reduced-motion override. The real server-verified journey has no fake biometric prompt. The proposed 160ms success closure is not independently motion-verified; no timing or hardware-feel claim is made. |
| The feature test | 3 | 3 | This is a coherent, usable service account flow. It still does not justify claiming an editorial design feature or portfolio-level perfection. |
| Fidelity | 4 | 4 | The supplied logo, password fallback, account help/create-account links, local purpose, both themes and privacy/terms footer are retained in the implemented layout. Google and Apple availability is represented honestly. |

**Stop rule: Done for the design rubric**, with nine of twelve lines at 4 and none below 3. The unchanged 3s are preserved rather than inflated. There are no awarded 5s, and no basis for saying the UI is 5/5 or perfect. The small phone and large desktop treatments now satisfy their distinct layout needs; further decorative iteration is not required to complete this access flow.

Root reported fresh passes for the real isolated-server/virtual-authenticator journey, authentication lifecycle races and account-security browser suites. The reviewed tests cover enrollment and persisted credentials, sign-out and new-session ownership, revocation with password fallback, cancellation, recent-authentication prompts and delayed requests after route changes. I inspected those test paths; I did not independently rerun the unchanged passing suites. The combined SQLite/Neon suite was still running when these final visuals were supplied.

### Code review disposition

The independent code pass found and followed up three concrete issues: link callback errors disappeared for already signed-in users, delayed sign-in requests could act after their screen unmounted, and an Apple link callback without the Lax session cookie left the bound old session valid. All three have focused code fixes and regression coverage. The final reviewed backend has browser-bound one-use state, fixed provider endpoints with library validation, explicit account linking, required phone/terms completion, recent authentication, exact passkey origin/RP/user verification, credential ownership checks, locked counters and protection against removing the last usable method. No further confirmed correctness or security defect remained in this review. This is bounded review evidence, not a claim that authentication is secure merely because tests pass.

The compatibility rollback patch was inspected separately. It preserves schema version 2 and the previous password application behavior, safely rejecting external-only password sentinels. A rollback disables the new OAuth/passkey methods, so a social-only account may retain a valid session but cannot begin a fresh login on that rollback build. The unpatched previous live commit cannot boot against schema 2 and must not be used as the rollback target.

### Release limits

- The actual final login captures show Google unavailable. They prove truthful availability UI, not a live Google connection. Live Google consent/redirect and a real provider callback still require service setup and verification.
- Apple remains unavailable for this free-only launch, as the user requested. The signed-provider fixtures do not substitute for Apple membership or a live Apple integration.
- The Chrome virtual authenticator proves the software ceremony and real API boundary, not fingerprint/Face ID hardware or passkey sync across physical devices.
- Physical iPhone rendering, Apple system fonts, keyboard feel and motion timing were not verified on this Linux host. The existing bundled web fonts remain the production typography.
- Authentication/authorization changes require qualified human review before a consequential production release under the supplied engineering policy. Staging verification and this independent agent review do not satisfy that human-review requirement.
- The final deployment, live database migration and combined database-suite outcome must be reported from their own fresh evidence. This visual review does not certify them.

## Follow-up review: callback diagnostics

Reviewed the uncommitted diagnostic diff in `server/auth.ts` and `tests/server/auth.test.ts` against deployed auth commit `649e132` after the first live Google link failed. This is a bounded diagnostic review; it does not change the visual scores above.

The change adds a fixed callback stage and a fixed failure category to the existing rejection audit event. Every value returned by `callbackFailureReason` is a literal string selected by a switch. Provider messages, descriptions, tokens, authorization codes, claims and URLs are not copied to the event. Nested causes are inspected at a maximum depth of four. Unknown codes remain `unclassified`. I checked the installed openid-client/oauth4webapi error wrapping: the nested claim metadata path used for issuer/audience categories matches that implementation.

The grant call retains the same expected state, expected nonce, required ID token and Google PKCE verifier. Identity/email verification, explicit linking, flow consumption, session creation and browser error redirects are unchanged. No protocol check is weakened to diagnose the live failure. Moving configuration creation into a local variable only identifies which stage failed.

The added regression supplies a sensitive marker in a client secret, authorization code, provider response description, nested cause and error message. It checks exact fixed event output for invalid-client, timeout and unknown failures, then checks that marker, nonce and state never occur in captured records. This is focused coverage of the changed logging boundary. Its fresh execution result must be reported by the implementation owner; this reviewer inspected the test and did not independently run it.

No must-fix or should-fix issue was found in this diagnostic diff. It is suitable for the authorized staging diagnostic deployment after the focused test and existing checks pass. The provider configuration still needs live verification. A user reply saying sign-in completed is not proof of a linked identity, and no authentication-success claim is made here.
