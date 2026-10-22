# Slate account access

2026-10-22. Research brief for login, sign up and passkey management.

## Brief

The product is Slate, a managed waste collection service for households in Uyo. The first action is to enter an existing account or create a household account to request collection. Add Google and Apple sign in, Google sign up and device passkeys while retaining email and password access. The feel is dependable, composed and local.

The brief is compiled from the user's request and the existing product, with routine design choices self-authored. It is a responsive web redesign, not a new native app. Preserve the supplied S mark, Slate grey, the existing routes and the web stack. No generated imagery or paid credits are required. A request for 5/5 is a quality target; only a critic's actual scores may be reported as scores.

## Current app

Inspected `src/pages/auth/Login.tsx`, `SignUp.tsx`, `src/components/layout/AuthLayout.tsx`, `src/components/brand/Logo.tsx`, `Strata.tsx`, `src/index.css`, `public/fonts/fonts.css` and the root `DIRECTION.md`.

The desktop layout has a dark Slate brand panel and a light form. Mobile has a short dark band above the form. The type is Bricolage Grotesque for display and Geist for controls. The supplied S artwork already has white and Slate grey variants. Existing decorative strata supply a physical material without remote imagery.

The current sign in has two fields, an email/password submit, account help, create-account navigation and optional sample-account links. Sign up contains full name, email, mobile number, password, confirmation, terms acceptance, terms/privacy links and a sign-in link.

Static source findings, pending rendered before evidence:

- The left panel's three-stat strip repeats the skill's stat-row tell. The stated 96.8%, under 24 hours and 2,477 sites have no evidence in the inspected auth code. Replace them with useful account-access information.
- The long left-panel promise competes with the action and claims operational guarantees not established by this work.
- Social access and passkeys need distinct actions with consistent targets. Do not turn each method into a floating card or decorative icon chip.
- Source review alone cannot establish clipping, contrast or rendered scan failures. Capture the existing screen before replacing it.

Keep:

- [ ] Supplied S logo and existing wordmark.
- [ ] Email/password login, recovery/help and create-account links.
- [ ] Existing validated registration fields and terms/privacy access.
- [ ] Household collection purpose and Uyo context.
- [ ] Next-route handling after sign in.
- [ ] Light and dark themes, keyboard access and reduced motion.
- [ ] Sample-account exploration only when the existing demo flag enables it.

Lose: unsupported statistics, exaggerated service promises, decorative boxes around every access choice, any implied promise that every device has Face ID.

Unknown: provider project credentials, Apple developer eligibility, provider consent/verification status, and real-device passkey behavior. These are implementation and release checks, not design assumptions.

Decisions for the user: none needed to render the options. Provider enablement must reflect the actual configured services. Do not present a method as working while its provider credentials are absent.

## Research and sources

The official product pages for three established collection products were read through web research on 2026-10-22. They are category examples, not a measured market ranking. Their feature descriptions are verified; visual comparisons remain provisional until their screenshots are directly inspected.

- [My WM](https://www.wm.com/us/en/my-wm-mobile-app): account and billing access, service requests, pickup schedules and biometric login. Its official page includes a green video title card and mobile screen imagery. Useful lesson: account access leads to practical collection tasks, not a sustainability speech.
- [Republic Services online account](https://www.republicservices.com/online-account-signup) and [account update instructions](https://www.republicservices.com/customer-support/online-account-updates): email/password access followed by schedule, bills, site switching and service requests. Useful lesson: familiar terminology and a clear path back to the service.
- [Recycle Coach collection calendars](https://www.recyclecoach.com/solutions/key-features/collection-calendars): address-based schedules, reminders and issue reporting across web and mobile. Useful lesson: local place and timing are meaningful context.

Shared product defaults are account access before schedule/service administration and extensive billing/support features. The proposed Slate access screen does not copy the category's recycling-green cue, generic environmental illustration or dashboard preview. The claims about competitors' visual treatment in older project documentation are not treated as newly verified research.

Non-app references:

- Existing physical source: cleft roofing slate and school chalk slates, already expressed in `Strata`. The grain, narrow seams and cut edges suggest a material system, not extra decoration.
- [Vitsœ 606](https://www.vitsoe.com/us/606): the official source identifies a modular shelving system by Dieter Rams. Its modular rails suggest aligned access choices and repeatable spacing. This is a structural reference; no photography or branding will be copied.
- Existing local source: Uyo streets at dawn and high-visibility route signals in the root direction. This is a supplied project concept, not a claim of a newly commissioned photographic study.

Authoritative access guidance:

- [Google branding](https://developers.google.com/identity/branding-guidelines): approved text includes Continue with Google and Sign up with Google. Keep the standard multicolour G; do not recolour it Slate. Follow documented spacing and shape guidance or use Google's rendered button.
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple/) and [web button guidance](https://developer.apple.com/documentation/signinwithapple/displaying-sign-in-with-apple-buttons-on-the-web): approved actions include Continue with Apple, Sign in with Apple and Sign up with Apple. Use an official Apple mark and a permitted monochrome button style, with comparable prominence to other provider actions.
- [Google passkey UX](https://developers.google.com/identity/passkeys/ux/communicating-passkeys) and [Apple passkeys](https://developer.apple.com/passkeys/): explain the familiar device unlock method while calling the credential a passkey.
- [iOS platform behavior](https://passkeys.dev/docs/reference/ios/): Touch ID or Face ID is used when available, with device passcode fallback. The site must not collect biometric data or draw a fake biometric prompt.

## Three directions to render before selection

These are alternatives, not a new brand palette. Their differences satisfy the exploration step; unselected hues and type do not enter the product.

1. **Slate is a hand-cut entry stone.** Object family. Dark ground `#2B3643`, expanded Bricolage headings, orange `#FF5B1F` only on a small active seam, cleft cut-shape richness. The S mark is the hinge of the composition. Light controls sit on a quiet contrasting lower field. A passkey action leads into the real system prompt. This is the recommended starting candidate because it carries the user's assets and Slate material while making account access the single focus. It still needs a rendered comparison before selection.
2. **Slate is a collection route at first light.** Place family. Light ground `#F2F4F6`, serif display in a verified available fallback for exploration only, blue route signal, route illustration richness. The route stops at the auth form rather than displaying fake customer records. This tests whether local service context helps orientation. Reject it if the route drawing competes with the access methods or makes the page look like a transport tracker.
3. **Slate is a civic broadcast card.** Media family. Saturated yellow field, Geist Mono display, neutral Slate ink accent, colour-material richness through a bold flat field and letterpress-like cuts. The form stays unboxed and the S mark remains unchanged. This tests a strong public-service message. Reject it if the saturated field distracts from password entry or weakens the existing restrained brand.

History check: the current product's documented row is `place / light / expanded / orange / illustration`. Candidate 1 is `object / dark / expanded / orange / shape`, differing on three columns. It differs on at least three columns from the five history rows inspected in `/home/inimfon-udoh/.app-designer/history.md`. Candidates 2 and 3 are unselected tests. Recheck history only when appending the final chosen row; if permissions prevent the append, keep a pending row here.

## Implementation tokens

Reuse `src/index.css`; no new colour system is needed.

| Role | Light | Dark |
|---|---|---|
| Canvas | `#F2F4F6` | `#0E1318` |
| Surface | `#FFFFFF` | `#161D25` |
| Ink | `#111820` | `#EDF1F4` |
| Secondary ink | `#46566A` | `#A8B4C0` |
| Tertiary ink | `#617185` | `#8492A0` |
| Rule | `#DAE0E6` | `#25303B` |
| Slate field | `#2B3643` | `#232D38` |
| Signal | `#FF5B1F` | `#FF6A33` |

Bricolage Grotesque display is deliberate: cut-looking forms relate to the cleft Slate material. Geist controls preserve the established product and legibility. Use six useful sizes: 12px metadata, 13px helper, 15px body, 16px controls, 22px group heading and 34px screen heading. A desktop-only brand statement may reach 44px. Keep display tracking around -0.03em, controls at normal tracking. Controls use existing radii 6/10px, groups are separated by space, and floating task sheets use 16px. Phone gutters are 20px. Group gaps use 8/12px; section gaps use 24/32px.

Use the actual bundled web fonts in production. Apple SF/New York fonts are absent on this Linux host. The skill's device mockups may preserve Apple chrome tokens but must be described as provisional, not Apple-font verified. Do not download Apple fonts.

## Content

Login:

- Sign in
- Collection requests and support for your home.
- Continue with Google
- Continue with Apple
- Sign in with a passkey
- Use your fingerprint, face or device PIN.
- Or use your email
- Email
- Password
- Sign in
- New to Slate? Create an account
- Account help

Sign up:

- Create your account
- Request collection for your home in Uyo.
- Sign up with Google
- Continue with Apple, if the same registration path is implemented and configured.
- Or use your email
- Full name
- Email
- Mobile number
- Your collection team may use this number to contact you.
- Password
- Use at least 12 characters. A few unrelated words make a good password.
- Confirm password
- I have read and accept the service terms and privacy notice.
- Service terms / Privacy notice
- Create account
- Already registered? Sign in

Passkey setup after a verified account session:

- Passkeys
- Sign in with your fingerprint, face or device PIN.
- Add a passkey
- Your device will ask you to confirm.
- Passkey added
- You can use this passkey to sign in to Slate.
- Use a name you can recognise, such as My phone.
- Remove passkey, with confirmation and an alternative access requirement.

Cancellation/error states must preserve email access. If the user cancels the browser dialog, say: Passkey sign in was cancelled. Try again or use your email. Unsupported browser: Your browser does not support passkeys. Sign in with your email or use a newer browser. Provider failure: Google sign in could not finish. Try again or use your email. Use Apple in the analogous Apple message. Distinguish provider unavailability from user cancellation without exposing server details.

No em dashes, greetings, exclamation marks or stock promotional phrases in product copy. Provider marks are their permitted exception to the single-accent rule.

## Signature storyboard

The signature is a short Slate seam that resolves when access succeeds, without delaying navigation or substituting for a real system verification screen.

1. User chooses a passkey. The page labels that method as active and opens the browser/OS credential prompt. No custom biometric animation.
2. While waiting, the action says Continue on your device. The neighboring email method remains available after cancellation; do not launch two concurrent sign-in attempts.
3. On server-verified success, one orange seam closes to Slate in 160ms, then navigation completes. It does not imply success before verification.
4. The browser owns biometric haptics. No additional page vibration. Reduced motion uses an immediate state change with the same status text.

## Verification and design deliverables

Node `v24.21.0`, `/usr/bin/google-chrome` and local `playwright-core` are available. The first-use renderer smoke command still needs to run. Do not install anything automatically. All rendering must use a task-owned temporary browser, never the user's Chrome profile.

Required evidence to produce after research:

- Before screenshots and a faithful before representation; `before-after.html` after implementation.
- `explore.html`: three full-craft login directions, shot and viewed before selecting.
- `mockup.html`: login, signup, passkey setup, provider continuation/error, dark login and the real supplied mark as the icon. A storyboard can be a sixth/seventh frame. Native framing is for design comparison, not a claim this web app is native iOS.
- At least two render/scan/critic rounds, plus compact 375 by 667 checks and desktop product verification.
- Full-size 3x PNG inspection, saved raw scan reports, every failure fixed and every warning answered.
- One continuing critic across rounds and `CRITIQUE.md` retaining actual scores. Do not invent a 5/5 result.

Critic rubric is the skill's 12 lines: concept visible, category distinction, avoiding the skill's average, hierarchy, typography, colour, richness, rhythm/space, craft, native fluency, signature and feature test. For this responsive web task, native fluency means correct browser/OS prompts, mobile safe areas, reachable controls and platform conventions; do not penalise the absence of a native tab bar on a login page. Add fidelity as a thirteenth line for the keep list. The skill's done threshold is no line below 3 and at least nine of twelve at 4 or above, not a guarantee of all fives. Scores should point to pixels in the supplied renders.

## UI source selection

The ten-source catalog was read. Superdesign supplies exploration structure; Better Design informs semantic tokens and component consistency; Design Taste informs measured contrast and calm copy; UI Layouts informs responsive composition; Motion Primitives and Trickle inform restrained state feedback. No component dependency is selected. Canvas UI, Paper Shaders, Hyperiux and Cursify effects add no benefit to authentication, so no GPU shader, cursor effect or decorative scroll behavior is proposed. No hosted design review or paid generation has run.

## Rendered selection and evidence

Root reviewed the rendered exploration sheet and selected A, entry stone. B lost because its route/serif composition pushed the entry controls down and suggested tracking; C lost because the yellow field and mono display weakened Slate's established restraint. The implementation study carries A's Slate material, supplied logo and display family into a light form and a separately designed dark form. Existing brand takes precedence over recreating the all-dark exploration literally.

- `explore.html` and `shots/explore-r2/sheet.png`: three 3x directions, all individual PNGs inspected, no scan failures. Initial accent-count failures were caused by Google's required four-colour mark. Only that standard provider mark has `data-system`; the mandated colours remain unchanged.
- `mockup.html` and `shots/r1/sheet.png`: eight 3x frames, all individual PNGs inspected, no scan failures. States are login, sign up, provider finish-signup, passkey management, passkey cancellation, dark login, a three-state access storyboard and the supplied icon.
- `before.html` and `shots/before-r2/01-before-login.png`: source reconstruction of the previous mobile login, explicitly labelled as reconstruction rather than a captured production page. Its first run used the wrong colour behind the status bar; the corrected run has no scan failures.
- Renderer smoke passed after the sandbox denied Chrome's crashpad socket; isolated CLI rendering was then approved outside the sandbox. The renderer uses a temporary profile, not the user's Chrome data.

Known warnings: long pages intentionally scroll under a reserved opaque home-indicator strip; the scanner counts those off-viewport text fragments as safe-area warnings. The primary design's signup and finish-signup forms require scrolling. The initial exploration has the same warning on its lowest actions. This is answered as intentional scrolling; compact-height checks remain required. One font request fails because `SFNS.ttf` is absent on Linux. Bricolage and Geist are loaded from the existing bundled assets; Apple system-font fidelity remains unverified.

The provided logo embeds a small raster, so its edges soften when enlarged to the 1032px icon study. The supplied artwork is preserved. A new vector master would improve large icon output; none was invented for this task.

## Round 2 response

Root approved changes after the continuing critic's first round. All five requested changes were implemented in the design artifacts:

1. Login uses a 34px heading, smaller header/gaps, 16px field values and no separate art strip. The full password submit, create-account link and account-help link are visible at 402 by 874. At 375 by 667 the lower actions remain reachable by scrolling, with separate bottom screenshots.
2. Apple is visibly unavailable, with a dashed outline and readable helper rather than a faint label. Google represents the **configured target state**, explicitly named in login PNG filenames. It is not proof that the actual provider connection is configured. Root is independently setting up the free Google project; runtime screenshots must establish actual availability.
3. Finish-signup shows the read-only, illustrative verified address `imaobong@example.com` beneath the provider. This is fictional design content, not a real user's account.
4. Unsupported Rename was removed. New passkey-enrollment, confirm-signin and remove-passkey frames show the name field, recent sign-in confirmation, cancellation paths and remaining access methods. Removal is clearly destructive. The actual app must derive remaining methods from the account rather than copying these illustrative methods.
5. The signature now shows the real passkey action group in waiting, cancelled and server-confirmed states, with its seam attached to the action. Cancellation keeps email access visible. No fake native biometric sheet or implementation-only cancellation explanation remains.

`mockup.html` now contains eight frames plus the unchanged supplied icon. The strata illustration uses full-width geometry rather than an aspect-fit inset. Source-derived before/after composition is in `before-after.html`; the previous screen remains explicitly a reconstruction.

Fresh raw scan evidence:

| Set | Viewport | Scan result |
|---|---|---|
| `shots/r2/` | 402 by 874, 3x | 8 scanned frames, 0 FAILs, 1 warning |
| `shots/r2-se/` | 375 by 667, 3x | 7 scanned frames, 0 FAILs, 6 warnings |
| `shots/r2-se-bottom/` | 375 by 667, 3x, scrolled to bottom | 3 scanned frames, 0 FAILs, 4 warnings |
| `shots/before-after/` | 402 by 874, 3x | 2 scanned frames, 0 FAILs, 0 warnings |

The compact renderer intentionally excludes non-device storyboard panels from scanning, so seven of the eight frames are scanned there. The eight-frame main set includes the storyboard scan. Every individual main, compact and bottom PNG was viewed, as well as the sheets. The supplied icon does not contain text and is rendered separately from frame scans.

Warning answers: the single main warning is the finish-signup change-method link below the first viewport. Compact warnings refer to text fragments in scrolling containers at the bottom edge. The bottom set reports fragments passing under the status area and a missing hero in the signup's lower form; that is deliberate because it is a form-bottom screenshot. The mockups have opaque status/home safe-area layers, and bottom screenshots show full submit actions and follow-up links. A scrolling form's off-viewport text is not a fixed clipped action. No horizontal text overflow, contrast failure or collision was reported. The expected missing Apple-font request remains disclosed.

## Status and remaining work

Research, two mockup render rounds, compact-height checks and before/after artifacts are complete. The continuing critic owns `CRITIQUE.md` and must reassess round 2 before any completion score is reported. Root owns production code, service configuration, actual browser tests and deployment. A 5/5, Google connection, biometric success or production-readiness claim is not established by these static mockups.

No shared history file was edited by the research agent. Pending final exploration row: `2026-10-22 | Slate account access | object | dark | expanded | orange | shape`. This row describes the selected exploration; the final light-form adaptation intentionally preserves the existing web brand. Do not imply a complete app-wide rebrand or an Apple-font-verified native build.
