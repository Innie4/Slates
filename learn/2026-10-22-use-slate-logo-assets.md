# Use the supplied Slate logo

> 2026-10-22 · Replace the placeholder logo with the supplied artwork and recolor green to Slate grey.

## In short
Slate now uses the supplied S symbol throughout its shared logo component, standalone brand examples and browser icon. The green artwork renders in the design system's Slate grey, #2B3643. The supplied white version appears on dark backgrounds.

## What changed
- `public/brand/slate-mark-grey.svg`: embeds the original green PNG and uses its transparency to define a grey silhouette.
- `public/brand/slate-mark-white.svg`: embeds the original white PNG with its surrounding empty space excluded from the view.
- `public/favicon.svg`: uses the white artwork on a Slate grey background.
- `src/components/brand/Logo.tsx`: adds `BrandMark` and replaces the placeholder symbol while preserving links, portal labels and compact mode.
- `src/pages/public/DesignSystem.tsx`: shows the new artwork, theme variants and sizes.
- `src/pages/app/ComplaintDetail.tsx`: uses the white mark for Slate support messages on a dark background.
- `src/components/brand/Strata.tsx` and `DIRECTION.md`: distinguish the supplied logo from decorative slabs and update the brand guidance.

## How it works
1. The grey SVG loads the supplied green image inside an alpha mask. An alpha mask uses pixel transparency to decide where another color may appear.
2. A rectangle filled with #2B3643 shows through that mask. The original green color cannot appear in the rendered result.
3. `BrandMark` selects the white asset when `tone="light"`. Otherwise, existing dark-mode classes switch between grey and white images.
4. `Logo` keeps the existing Slate wordmark and navigation behavior, so its callers receive the new artwork without changing their routes.

## Why it's built this way
The original PNG bytes remain intact inside the SVG files. This preserves the supplied silhouette rather than redrawing it. Cropped SVG view boxes remove transparent margins without stretching the symbol. Both assets are self-contained, so they have no external image dependency.

The mark is decorative inside the logo link, which already has the accessible name “Slate home”. Empty image descriptions avoid repeating that name for screen readers.

## The concept worth knowing: alpha masks
Think of a stencil: its openings determine the shape of the paint, while the paint determines the color. Here, the PNG's transparency is the stencil and the grey rectangle is the paint. Partially transparent edge pixels stay partially transparent, preserving smooth edges.

## Watch out for
These SVG wrappers contain bitmap artwork; they are not vector traces. Very large print uses would benefit from the original vector files. Keep both theme variants when changing the logo component. Asset checks verify the embedded bytes, mask, grey fill and self-contained favicon; browser checks cover contrast, loading and responsive sizing. Build, route and copy checks verify the combined code change, not a live deployment.

## Check yourself
1. Why does the green color disappear without rewriting PNG pixels?
   <details><summary>Answer</summary>The mask reads transparency only. The visible color comes entirely from the Slate grey rectangle.</details>

2. What happens if the grey logo is used on a dark sidebar?
   <details><summary>Answer</summary>Its contrast drops. That placement should use the explicit white variant through `tone="light"`.</details>

3. Why retain the existing `Logo` props?
   <details><summary>Answer</summary>Headers, portals and document previews already depend on their link, compact and label behavior. Preserving the interface avoids unrelated caller changes.</details>

## Explain it back
Without looking at the code, explain in 2-3 sentences what this change does and why it works. If you get stuck, that's the part to reread.

---
*Made with Edirae Learn · edirae.com*
