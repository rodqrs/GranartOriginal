import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ProductRepository } from './product.repository';
import { Product } from '../models/product.model';
import { PRODUCTOS_FALLBACK } from './productos-fallback';

/**
 * Tests para ProductRepository (REQ-QA-2).
 *
 * Tres escenarios:
 *  1. JSON load succeeds → response body con 7 productos válidos
 *  2. JSON load 404s → error HTTP → fallback + console.warn
 *  3. JSON body es malformed → body no-array → fallback + console.warn
 */
describe('ProductRepository', () => {
  let repo: ProductRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductRepository,
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function buildValidProducts(): Product[] {
    return PRODUCTOS_FALLBACK.map((p) => ({ ...p }));
  }

  // ── Escenario 1: JSON load succeeds ──────────────────────────
  it('should load 7 products on successful JSON fetch', () => {
    const expected = buildValidProducts();

    // El constructor del repo se ejecuta al inyectarlo. Creamos el repo
    // DESPUÉS de configurar el TestBed, pero ANTES de flush().
    repo = TestBed.inject(ProductRepository);

    const req = httpMock.expectOne('data/productos.json');
    expect(req.request.method).toBe('GET');
    req.flush(expected);

    expect(repo.productos().length).toBe(7);
    expect(repo.productos()).toEqual(expected);
  });

  it('should NOT log a warning on successful JSON fetch', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const expected = buildValidProducts();

    repo = TestBed.inject(ProductRepository);
    httpMock.expectOne('data/productos.json').flush(expected);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  // ── Escenario 2: JSON load 404s ──────────────────────────────
  it('should fall back to PRODUCTOS_FALLBACK on 404 and log a warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    repo = TestBed.inject(ProductRepository);
    httpMock
      .expectOne('data/productos.json')
      .error(new ErrorEvent('Not Found'), { status: 404, statusText: 'Not Found' });

    expect(repo.productos().length).toBe(7);
    expect(repo.productos()).toEqual(PRODUCTOS_FALLBACK);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[ProductRepository] productos.json is not an array; using fallback.'
    );

    warnSpy.mockRestore();
  });

  // ── Escenario 3: Malformed body ──────────────────────────────
  it('should warn and keep fallback when JSON body is not an array', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    repo = TestBed.inject(ProductRepository);
    httpMock.expectOne('data/productos.json').flush({ notAnArray: true });

    expect(repo.productos().length).toBe(7);
    expect(repo.productos()).toEqual(PRODUCTOS_FALLBACK);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[ProductRepository] productos.json is not an array; using fallback.'
    );

    warnSpy.mockRestore();
  });
});
