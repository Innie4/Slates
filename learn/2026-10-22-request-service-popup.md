# Choose a collection service with price and frequency

> 2026-10-22 · Add a service popup to the new collection request form.

## In short
The Service field now opens a popup showing each household service's starting price, billing unit and collection frequency. Choosing a row immediately updates the form and closes the popup. The selection uses the existing booking flow, so it is saved with the request when the user submits it.

## What changed
- `src/pages/live/AccountPage.tsx`: adds `ServicePicker`, replaces the native service dropdown, and reuses the service catalog and `collectionSchedules` labels.
- `src/pages/live/account.css`: styles the selected field, price column, selection mark and compact layouts with existing theme tokens.
- `tests/browser/service-picker.mjs`: checks comparison values, keyboard controls, responsive layouts, preserved form inputs and saved bookings against an isolated local app.
- `design/request-service/`: records the design direction, rendered alternatives and visual review.

## How it works
1. `RequestCollection` starts with a valid service from the URL, or the existing default. Its `draft.serviceId` holds the choice.
2. `ServicePicker` filters the existing catalog to the six services accepted by `BOOKING_SERVICES`. It derives the visible name, price and schedule from that catalog.
3. Clicking the field opens the existing `Modal`. Desktop uses a centred popup; phones use its bottom sheet. The price-confirmation note stays in the footer while options can scroll.
4. Clicking an option calls `onChange(service.id)`, which updates the parent draft, then closes the popup. Escape, the backdrop and Close only dismiss it.
5. Sending the request passes the same `draft.serviceId` to `/api/bookings`. The existing backend validates and stores it. No new database fields are needed.

## Why it's built this way
One catalog keeps prices consistent with the Services page. Reusing `Modal` preserves its focus trap, Escape handling, scroll lock and focus restoration. A second confirmation button would add a step without improving this single-choice interaction.

## The concept worth knowing: one source of truth
Think of the popup as a window into the form's answer, rather than a second answer sheet. There is only one chosen service.

Precisely, the selected ID belongs to `RequestCollection`. The picker receives that ID and reports changes through a callback. It owns only whether it is open. This prevents a cancelled popup from overwriting a previous selection or other draft fields.

## Watch out for
- Amounts are starting prices. Selecting a service does not confirm a quote, schedule a recurring contract or take payment.
- The selection is stored in form state until submission. Reloading an unfinished form still follows the existing reset behavior.
- Automated Chrome checks cover local persistence and compact layouts. Physical touch and screen-reader testing remain useful follow-ups.
- Keep catalog IDs aligned with `BOOKING_SERVICES` when adding a service.

## Check yourself
1. Why does the popup keep only its open state?
<details><summary>Answer</summary>The parent already owns the selected service ID. A second copy could disagree with the value submitted to the backend.</details>

2. What happens if someone closes the popup without selecting a row?
<details><summary>Answer</summary>Only `open` changes. The previous service, address and notes remain in the parent draft.</details>

3. Why does the popup say “From” and retain a price-confirmation note?
<details><summary>Answer</summary>The catalog provides starting prices. The team still reviews the final price and availability before collection or payment.</details>

## Explain it back
Without looking at the code, explain in 2-3 sentences what this change does and why it works. If you get stuck, that's the part to reread.

*Made with Edirae Learn · edirae.com*
