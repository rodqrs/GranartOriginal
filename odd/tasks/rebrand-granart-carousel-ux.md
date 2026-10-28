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
- [x] T6 Mobile: hide the "Catalogo destacado" eyebrow (`home.html` line 9, the `.section-header .eyebrow` of `#productos-grid`) on mobile only — redundant and crowds the title. Keep the "Resumen final" eyebrow untouched.
- [x] T7 Header: increase the "Granart" brand title font size — it currently renders smaller than the product card titles; it must read clearly larger (header component template/styles; check all breakpoints, keep mobile legible).
- [x] T8 Header v2 (user feedback on T7): bump the "Granart" title a bit MORE at every breakpoint (all versions), keeping hierarchy and no header overflow. Current: desktop clamp(1.4rem,2.5vw,1.6rem); 390px 0.95rem; ≤480px 0.95rem; ≤360px 0.85rem — card h3 reference 0.86-1.12rem.
- [x] T9 Detail cards desktop fix: at desktop widths BELOW 1200px (1025-1199px), each product detail card (`.producto-detalle-seccion` content card with the detalle rail sidebar present) slides under the sidebar. Apply the same pattern as T5: shift the card right with a fixed band/offset so it clears the rail with a clean corridor at 1025-1199px; ≥1200px unchanged; verify no overflow against the right edge.

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
- Iteration 2 browser check (ego-browser, 2026-10-28, local dev server, commit `8680f99`):
  - Tablet 769/900/1024px: prev arrow x=217-267 (original slot), card left edge x=336
    (fixed band `left: 21rem`), 69px corridor rail↔card, 30px card↔next-arrow at all
    three widths. Rail cap removed: full 7-thumbnail sidebar visible (screenshot).
  - Mobile 390px: "Catalogo destacado" eyebrow not visible; "Resumen final" eyebrow
    kept visible. Brand `h1.brand-name` "Granart" 15.2px (0.95rem, ≤480px step) vs
    card h3 13.76px (0.86rem) — brand now larger; desktop 22.4px vs 17.9px max.
  - Delivery: merged to `main` and pushed (established auto-deploy flow).
- Iteration 3 browser check (ego-browser, 2026-10-28, local dev server, commits `9d010f2`..`c52e92b`):
  - T9 detail card: band at 1025/1100px → card x=240-960 (w=720), corridor 37px,
    65px right clearance. At ≥1200px unchanged (x=212 centered, corridor 17px +).
  - BOUNDARY FIX (orchestrator, follow-up commit): at exactly 1199px the band did
    NOT apply — `matchMedia("(max-width: 1199px)")` false at innerWidth 1199
    (viewport width 1199.00000002 from float rounding). Changed to
    `max-width: 1199.98px`; re-measured 1199 → card x=240-960, corridor 37px.     Rule:
    half-pixel upper bounds for exclusive ranges.
  - T8 brand: 390px → 17.6px (1.2rem) vs card h3 13.76px; eyebrow still hidden.
  - Delivery: merged to `main` and pushed (established auto-deploy flow).
- Iteration 4 (detail band extended to tablet, 2026-10-28, orchestrator edit + browser check):
  - Measured before: detail card x=124-884 at 1024px (79px under the rail); worse at
    769/900px. Rail present from 769px (hidden ≤768px only).
  - Fix: band media query extended `min-width: 1025px` → `769px`, and
    `max-width: min(45rem, calc(100% - 12rem))` so the card shrinks to the
    rail+padding remainder at narrower widths.
  - Measured after: card underRail=false with corridor 27-37px at 769/900/1024/1025px
    (card x=230-240, w=485-720, right gap 53-65px); ≥1200px unchanged; ≤768px unchanged
    (rail hidden). Screenshot at 900px confirms clean separation.
  - Delivery: merged to `main` and pushed (established auto-deploy flow).
- Iteración 2 (rama `feat/carousel-ux-iter2`):
  - T5 `861e3a6` fix(carousel): abrir corredor tablet corriendo la tarjeta y soltar el cap del rail
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
  - T6 `4b46a09` feat(home): ocultar el eyebrow "Catalogo destacado" en movil
    - SCSS-only: no runnable RED (stated exception — breakpoint visibility, no
      test harness asserts computed styles). In the `responsive(mobile)` block
      of home.scss, `.section-header .eyebrow` (only exists inside
      `#productos-grid`; the footer header uses `.footer-header`) now gets
      `display: none`. The "Resumen final" eyebrow (`.footer-header .eyebrow`,
      own mobile rule in the same file) untouched, and its 0.68rem mobile
      sizing rule kept. Removed the now-dead 0.62rem eyebrow sizing at ≤360px
      (element hidden; rule was a no-op). The h2/p rules of the section header
      keep their mobile sizing, so spacing tightens only by the eyebrow's own
      0.35rem margin.
  - T7 `0595bf6` feat(header): agrandar el titulo de marca sobre los titulos de tarjeta
    - Styles-only in header component (template untouched — the `h1.brand-name`
      node needed no markup change): no runnable RED (stated exception).
      Reference sizes measured in home.scss: grid card h3 =
      `clamp(0.92rem, 1.4vw, 1.12rem)` desktop / 0.86rem mobile / 0.77rem
      ≤360px. The real regression was mobile: brand was 0.84rem (0.74 ≤480px,
      0.68 ≤360px) — all BELOW the card titles. New sizes, all above card
      titles at every step while keeping the bar height driven by the logo
      (52/44/34/28px) and the brand inside its `max-width` ellipsis budget:
      - Desktop `.brand-name`: `clamp(1.05rem, 2.3vw, 1.65rem)` →
        `clamp(1.4rem, 2.5vw, 1.6rem)` (≥1.4rem on tablet floor, 1.6rem from
        ~1025px ≈ 1.4x card max 1.12rem; 28px rendered < 52px logo frame →
        bar height unchanged).
      - Mobile ≤768px: 0.84rem → 1.05rem (> 0.86rem card; ~70px < 140px cap).
      - ≤480px: 0.74rem → 0.95rem; ≤360px: 0.68rem → 0.85rem (> 0.77rem card;
        ~56px < 92px cap). Width budget at 390px: logo 44 + brand ~70 +
        Inicio pill ~34 + 3 social icons ~110 + gaps/padding ≈ 272px < 390px —
        no wrap, no overflow.
  - Verification (2026-10-28, iteration 2, final state after `0595bf6`):
    - `npm run build`: OK — production build completes, no errors, no budget
      warnings (initial total 276.25 kB).
    - `npm test`: OK — Vitest 5 files / 21 tests passed.
    - `npm run lint`: OK — "All files pass linting."
- Iteración 3 (rama `feat/title-detail-card-fix`, T8 + T9):
  - T8 `9d010f2` feat(header): segundo agrande del titulo de marca en todos los breakpoints
    - Styles-only en el header (template intacto): no runnable RED (stated
      exception — CSS-only, no test harness asserts computed font sizes).
      Escalones nuevos, +14-18% sobre cada valor de T7, jerarquía intacta
      (h3 de tarjeta: 0.92-1.12rem desktop / 0.86 mobile / 0.77 ≤360px):
      - Desktop `.brand-name`: `clamp(1.4rem, 2.5vw, 1.6rem)` →
        `clamp(1.6rem, 2.9vw, 1.8rem)` (≥1.6rem en todo ≥769px, 1.8rem desde
        ~993px ≈ 1.6x el máximo de tarjeta 1.12rem; 28.8px × 1.1 lh ≈ 32px
        renderizados < 52px del marco del logo → la altura de la barra sigue
        mandada por el logo).
      - Mobile ≤768px: 1.05rem → 1.2rem (1.4x el h3 0.86rem; ~80px < cap
        ellipsis 140px). ≤480px: 0.95rem → 1.1rem (1.28x; ~81px < 118px).
        ≤360px: 0.85rem → 1rem (1.30x el h3 0.77rem; ~74px < 92px).
      - Presupuesto de ancho a 390px: logo 34 + marca ~81 + pill Inicio ~31
        + 3 redes (30px) ~96 + gaps/padding ≈ 275px < 390px — sin wrap ni
        overflow, cap de 118px sin activarse.
  - T9 `cc3820a` fix(home): banda fija 1025-1199px para la tarjeta de detalle
    - SCSS-only: no runnable RED (stated exception — CSS geometry, no test
      harness renders layout). Estructura inspecteada en `home.html`: cada
      `.producto-detalle-seccion` es un flex ROW centrado con
      `.detalle-thumbnails` (rail absoluto, `left: 0.8rem`,
      `width: min(190px, 26vw)` → borde derecho x=202.8 constante en el
      rango, z=3) y `.detalle-contenido` (tarjeta en flujo, `max-width:
      760px`, z=2). Centrada, a 1025px la tarjeta arranca en
      48 + (929-760)/2 = x≈132.5 → ~70px metida bajo el rail; a 1199px
      queda en x≈219.5, sólo 17px de corredor. Mismo arreglo que
      `.slide-overlay` en tablet (`861e3a6`): se abandona el centrado
      (`justify-content: flex-start`) y se ancla banda fija
      `margin-left: 12rem` → borde izquierdo x=240 (padding 3rem + 192px;
      corredor 37.2px con el rail) y `max-width: 45rem` (720px) para que a
      1025px el borde derecho quede en 240+720=960, a 65px del viewport y
      17px del borde de padding: la tarjeta se achica, no se desborda.
      Geometría en el rango: a 1100px tarjeta 240-960 (corredor 37px,
      holgura derecha 140px); a 1199px igual (holgura 239px). Vertical
      intacto: `align-items: flex-end` sigue anclando al fondo. ≥1200px
      (centrado, corredor ≥17px ya existente) y ≤1024px sin diff.
  - Verification (2026-10-28, iteración 3, estado final de los commits):
    - `npm run build`: OK — producción completa, sin errores ni budget
      warnings (initial total 276.49 kB).
    - `npm test`: OK — Vitest 5 files / 21 tests passed.
    - `npm run lint`: OK — "All files pass linting."
    - Browser check (ego-browser): NO EJECUTADO en esta iteración (writer
      sin browser); verificación geométrica razonada sobre las medidas
      vivas de las iteraciones 1-2 (rail x≈203 constante ≥769px).
