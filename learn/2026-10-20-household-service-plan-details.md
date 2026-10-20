# Show household service prices and collection frequency

> 2026-10-20 · Add plan prices and collection frequency to the household Services page.

## In short
The household Services page now shows the starting price, billing unit and collection frequency for all six bookable services. Customers can compare the plans before opening a collection request. Prices and schedules still require confirmation after review.

## What changed
- `src/lib/service-catalog.ts`: contains the existing service catalog and `serviceById` lookup, moved without changing their values.
- `src/data/index.ts`: re-exports the catalog and lookup so existing imports continue working.
- `src/pages/live/AccountPage.tsx`: uses the catalog to display prices with `formatNaira`, translates frequencies into collection counts, and keeps the service-specific booking links. Quote-based services have a visible review note.
- `src/pages/live/account.css`: adds a price and frequency row using the existing theme colors. On small screens, this row uses the full card width.

## How it works
1. `Services` selects catalog entries whose IDs appear in `BOOKING_SERVICES`, the list accepted by the booking form and server.
2. Each card displays its starting price and unit, such as ₦7,000/month.
3. `collectionSchedules` turns “Twice weekly” into “2 collections per week”. Unmapped values keep their original wording.
4. Choosing a card opens `/app/book` with its stable service ID. The booking form selects that service automatically.

## Why it's built this way
The account page needs service information without loading generated sample accounts and transactions. Moving the catalog into its own module provides that smaller import while keeping existing callers working through a re-export. Copying six prices into the account page would create another list to maintain.

The price and collection schedule have separate labels because a monthly bill can cover weekly collections. The page uses semantic description lists, which associate each label with its value for assistive technology.

## The concept worth knowing: one source of truth
Think of a restaurant using one price list for its printed menu and ordering screen. Updating one list prevents the two menus from disagreeing.

Here, the live account page and existing catalog consumers share the same service objects. The public pricing page still has its own home-plan copy, so changes to those rates should also be checked there.

## Watch out for
These are existing guide prices, not confirmed charges. A new bookable service must also have a catalog entry or it will not appear here. The verification checked that all six current booking IDs are present, with positive integer prices and recognized frequencies. Build, route and copy checks passed. Chrome checks covered booking selections, desktop and narrow mobile layouts, both themes and runtime errors. This change has not been deployed.

## Check yourself
1. Why is the billing unit separate from collection frequency?
   <details><summary>Answer</summary>A customer can pay monthly while receiving one or two collections each week. Combining those concepts could misrepresent the service.</details>

2. What happens if a booking ID has no matching catalog entry?
   <details><summary>Answer</summary>The Services filter cannot display it. Keep both lists aligned and check their IDs when adding services.</details>

3. Why preserve the old exports in `src/data/index.ts`?
   <details><summary>Answer</summary>Existing pages still import from that module. Re-exporting the same catalog keeps those imports working while the real account page uses the smaller module directly.</details>

## Explain it back
Without looking at the code, explain in 2-3 sentences what this change does and why it works. If you get stuck, that's the part to reread.

---
*Made with Edirae Learn · edirae.com*
