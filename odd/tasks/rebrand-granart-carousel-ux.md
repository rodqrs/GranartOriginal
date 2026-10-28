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
- [x] T3 Desktop: reposition carousel left arrow so it never overlaps the info card at 760-1000px, mirroring the right arrow's edge offset.
- [x] T4 Scroll: remove full-screen snap behavior (`scroll-snap-type` in `src/styles.scss`, `.snap-section` rules in `src/app/features/home/home.scss`) and any JS in `src/app/features/home/home.ts` that forces scroll/focus between sections; keep smooth anchor scrolling for nav links.
- [x] T5 Carousel tablet fix v2 (user feedback on `542c6a7`): the rail cap truncated the sidebar — restore the FULL thumbnail sidebar (remove the tablet `max-height: calc(50vh - 9rem)` cap) and instead shift the slide info card to the right to open a clear corridor for the prev arrow between rail and card. Measured at 900px: rail x≈12.8-202.8, prev arrow currently x=32-82, card x=254-631. Target: arrow sits clear of BOTH (original slot ~x=217-267 works if card left edge ≥ ~300px at 769-1000px). Applies to tablet 769-1024px; desktop ≥1025px unchanged; mobile ≤768px has no carousel (hidden).
- [ ] T6 Mobile: hide the "Catalogo destacado" eyebrow (`home.html` line 9, the `.section-header .eyebrow` of `#productos-grid`) on mobile only — redundant and crowds the title. Keep the "Resumen final" eyebrow untouched.
- [ ] T7 Header: increase the "Granart" brand title font size — it currently renders smaller than the product card titles; it must read clearly larger (header component template/styles; check all breakpoints, keep mobile legible).

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
- Follow-up fix `3acc4a9`: user chose to collapse the blank mobile hero. Root cause of
  the leftover 844px blank area: a second `@include responsive(mobile)` block later in
  home.scss re-set `min-height: 100svh` on `.home-hero-section`, overriding the earlier
  `min-height: 0`. Removed `.home-hero-section` from that selector list. Verified:
  hero height 0 at 390px, grid starts at viewport top (elementFromPoint mid-screen =
  productos-grid-section). Build green.
- Delivery: merged to `main` and pushed 2026-10-28 (user-approved); CI deploys to
  https://rodqrs.github.io/GranartOriginal/.
- 2026-10-28: implementation complete on `feat/rebrand-carousel-ux`. Work-unit commits:
  - T1 `37e46af` feat(brand): rename company to Granart across title, header and footer
    - RED first: added `header.spec.ts` / `footer.spec.ts` asserting "Granart" → 2 failed
      against the old brand; GREEN after the rename. No pre-existing spec asserted the old
      name (verified: only home/carousel/product.repository specs existed).
  - T2 `b14b4d9` feat(home): hide hero carousel on mobile and remove volver-al-carrusel button
    - CSS/template-only change: no meaningful runnable RED (stated exception). Carousel
      hidden + hero collapsed via `responsive(mobile)` (max-width 768px, project mixin);
      `#inicio-carrusel` anchor kept in DOM so header links still resolve to top.
      `.volver-carrusel-btn` had no TS references (verified) → markup + 3 SCSS blocks removed.
  - T3 `542c6a7` fix(carousel): keep prev arrow clear of info card at tablet widths
    - SCSS-only: no runnable RED (stated exception). Reasoning vs measured geometry:
      rail right edge x≈203 for 769-1024px; card left edge ≈157@760 / 225@900 / 279@1000;
      corridor rail↔card (22px @900) cannot fit the 50px arrow → at tablet the arrow
      mirrors `.next` edge offset (`left: 2rem`, x=32-82, always left of the card) and the
      rail `max-height` is capped to `calc(50vh - 9rem)` so it ends above the arrow top
      (50vh - 25px). Desktop ≥1025px keeps the rail-right position (corridor ≈87px;
      measured clear at 1000px). Mobile ≤768px unchanged (bottom pair).
  - T4 `3b9c0eb` refactor(home): remove full-screen scroll snap and wheel navigation hijack
    - Removed `scroll-snap-type` (styles.scss), `.snap-section` rules (home.scss), the
      wheel `preventDefault` + `scrollIntoView` hijack and the scroll-idle lock/timer
      (home.ts). Kept smooth anchor scrolling and the passive active-section tracking
      that feeds the detalle rail highlight (`activeDetalleId`). Renamed snap-named
      identifiers (`#snapSection`→`#seccion`, `.home-snap-layout`→`.home-layout`,
      `syncCurrentSectionIndex`→`syncActiveSection`) — no dead code left.
    - Known leftover outside allowed edit surfaces: stale "scroll-snap layout" doc
      comment in `src/app/app.ts:15` (not touched per constraints).
- Verification (2026-10-28, final pass on committed state):
  - `npm run build`: OK — production build completes, no errors, no budget warnings.
  - `npm test`: OK — Vitest 5 files / 21 tests passed (browser mode).
  - `npm run lint`: OK — "All files pass linting."
  - Browser check (ego-browser): DONE (2026-10-28, local dev server, committed state).
    - Mobile 390px: `<title>` "Granart", carousel `display: none` / not visible,
      `.volver-carrusel-btn` absent. NOTE: hero section still occupies full
      viewport height (844px) as blank space — product decision pending on what
      to show there (collapse vs content).
    - Tablet 900px: prev arrow measured x=32-82, info card starts x=254 → no
      overlap (was x=217-267 overlapping). Next arrow unchanged x=803+.
    - Snap removed: computed `scroll-snap-type: none` on root scroller.
  - Wheel test: 300px requested → exactly 300px moved (twice), gradual scroll
    restored (was 300px → 921px full-viewport jump).
- Iteración 2 (rama `feat/carousel-ux-iter2`):
  - T5 `<id>` fix(carousel): abrir corredor tablet corriendo la tarjeta y soltar el cap del rail
    - SCSS-only: no runnable RED (stated exception — CSS geometry, no test harness
      renders layout). Geometric reasoning (all in px, tablet 769-1024px):
      - Rail cap REMOVED → sidebar shows all 7 thumbnails again (rail spans
        y=7rem → 100vh-8.5rem as on desktop; rail x≈12.8-202.8, constant across
        the range because `26vw ≥ 190px` for vw ≥ 731px).
      - `.slide-overlay` tablet block: drop centering (`left: 50%` +
        `translateX(-50%)`) for fixed band `left: 21rem` (336) / `right: 7rem`
        (112). Card left edge = 336 ≥ target ~300 at every tablet width;
        card right edge = viewport-112 → 30px clear of the next arrow's left
        edge (viewport-82, from `right: 2rem` + 50px button) at both 769 and
        1024. Card width shrinks to viewport-448 (321px at 769px, 576px at
        1024px) — bottom-anchored, text wraps, no overflow.
      - `.carousel-arrow.prev`: tablet `left: 2rem` override REMOVED → base
        formula `calc(0.8rem + min(190px, 26vw) + 0.9rem)` = 217.2 at the whole
        tablet range → x=217-267 (original slot), inside the corridor: 14px
        gap to rail (202.8), 69px gap to card (336), same "apoyado al rail"
        rhythm as desktop; arrow vertically centered (y=0.5·vh±25) never
        overlaps card horizontally (267 < 336).
      - Desktop ≥1025px: same base rules as before (no diff emitted). Mobile
        ≤768px: carousel hidden, no diff.
