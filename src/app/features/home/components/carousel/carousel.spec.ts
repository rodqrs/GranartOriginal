import { TestBed } from '@angular/core/testing';

import { Carousel } from './carousel';

/**
 * Tests parametrizados para `Carousel.getImagenUrl()` (REQ-QA-4).
 *
 * Cubre las 6 clases de entrada documentadas en `design.md` §7:
 *  1. empty / null / undefined
 *  2. http(s)://...
 *  3. data:...
 *  4. /assets/...
 *  5. assets/... (sin slash inicial)
 *  6. uploads/... (reescritura legacy)
 *
 * Cada fila es un par [input, expectedOutput].
 */
describe('Carousel getImagenUrl', () => {
  function mountCarousel(): Carousel {
    TestBed.configureTestingModule({
      imports: [Carousel],
    });

    const fixture = TestBed.createComponent(Carousel);
    return fixture.componentInstance;
  }

  const carousel = mountCarousel();
  const FALLBACK = '/assets/images/logo.jpg';

  it.each([
    // ── Clase 1: empty / null / undefined / whitespace ──────────
    ['', FALLBACK],
    ['   ', FALLBACK],
    // ── Clase 2: http(s):// ─────────────────────────────────────
    ['https://cdn.example.com/img.jpg', 'https://cdn.example.com/img.jpg'],
    ['http://legacy/old.jpg', 'http://legacy/old.jpg'],
    // ── Clase 3: data: URI ──────────────────────────────────────
    ['data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='],
    // ── Clase 4: /assets/... (leading slash) ────────────────────
    ['/assets/images/cafe.jpg', '/assets/images/cafe.jpg'],
    // ── Clase 5: assets/... (no leading slash) ──────────────────
    ['assets/images/cafe.jpg', '/assets/images/cafe.jpg'],
    // ── Clase 6: uploads/... (rewrite legacy path) ──────────────
    ['uploads/products/cafe.jpg', '/assets/images/cafe.jpg'],
    ['/uploads/products/cafe.jpg', '/assets/images/cafe.jpg'],
    // ── Bonus: bare filename (no slashes, no protocol) ──────────
    ['foo', '/assets/images/foo'],
    ['foo/bar/img.png', '/assets/images/img.png'],
  ])('should resolve "%s" to "%s"', (input, expected) => {
    expect(carousel.getImagenUrl(input)).toBe(expected);
  });

  it('should NOT prepend any backendUrl prefix', () => {
    const result = carousel.getImagenUrl('/assets/images/cafe.jpg');
    expect(result).not.toContain('backendUrl');
    expect(result).not.toContain('apiUrl');
    expect(result).not.toContain('http://localhost');
  });
});
