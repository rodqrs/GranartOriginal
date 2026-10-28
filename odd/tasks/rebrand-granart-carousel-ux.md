# Feature: rebrand-granart-carousel-ux

## Objective
Rebrand the site to "Granart" and fix carousel/scroll UX issues reported and
verified live with browser automation (ego-browser) on 2026-10-28.

## Problem / why
- Header, footer and tab title still say "Café & Cacao Artesanal"; the brand is now Granart.
- On mobile the carousel is noise: it must be hidden.
- The "Volver al carrusel" button is redundant and must be hidden.
- Between 760-1000px viewport width the carousel left arrow overlaps the slide info card (measured: arrow fixed at x=217-267; info card starts x≈225 at 900px, x≈279 at 1000px). The right arrow never overlaps.
- Global scroll-snap forces full-viewport jumps (measured: 300px wheel → 921px jump). Sections taller than the viewport (productos-grid 832px, resumen-final 972px vs 800px vh) get their last products skipped.

## Scope
Working repo: `rodqrs.github.io` (deploy repo for https://rodqrs.github.io/GranartOriginal/).

## Tasks
- [x] T1 Brand: rename company name to "Granart" in `src/index.html` `<title>`, `src/app/shared/components/header/header.ts` (nombreEmpresa), `src/app/shared/components/footer/footer.ts` (nombreEmpresa); update any spec asserting the old name.
- [x] T2 Mobile: hide the carousel (hero `app-carousel`) on mobile via existing breakpoint conventions; hide the `.volver-carrusel-btn` button in `src/app/features/home/home.html` (globally).
- [ ] T3 Desktop: reposition carousel left arrow so it never overlaps the info card at 760-1000px, mirroring the right arrow's edge offset.
- [ ] T4 Scroll: remove full-screen snap behavior (`scroll-snap-type` in `src/styles.scss`, `.snap-section` rules in `src/app/features/home/home.scss`) and any JS in `src/app/features/home/home.ts` that forces scroll/focus between sections; keep smooth anchor scrolling for nav links.

## Constraints
- Comments in Spanish (project convention).
- Conventional Commits, no AI attribution.
- Do not push; commits on feature branch `feat/rebrand-carousel-ux`.

## Verification
- `npm run build` passes (production).
- `npm test` passes.
- `npm run lint` passes.
- Browser check (ego-browser): mobile 390px no carousel visible; 760/900/1000px left arrow clear of info card; wheel scroll moves gradually, no full-viewport jump.

## Progress / evidence
- Route: delegated direct (one writer, work-unit commits). Trigger: 4 tasks across 6+ non-trivial files.
- 2026-10-28: feature doc created after live verification; implementation starting.
