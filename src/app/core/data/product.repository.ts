import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { Product, isProduct } from '../models/product.model';
import { PRODUCTOS_FALLBACK } from './productos-fallback';

/**
 * Repositorio singleton de productos para la SPA estática.
 *
 * Responsabilidades:
 *  1. Cargar `public/data/productos.json` UNA sola vez en el constructor
 *     (REQ-DATA-1).
 *  2. Validar el body con `isProduct()` (REQ-DATA-3, REQ-DATA-4).
 *  3. Exponer el resultado en un `signal<Product[]>` de solo lectura.
 *  4. Caer a `PRODUCTOS_FALLBACK` ante cualquier fallo (404, red, body no
 *     array, todos los items inválidos) y emitir un único `console.warn`
 *     con un prefijo descriptivo (REQ-DATA-2).
 *
 * El signal se inicializa a `PRODUCTOS_FALLBACK` en el field initializer
 * para garantizar que la primera paint NUNCA muestre un grid vacío
 * (REQ-QA-3 — el template puede leer el signal en el primer `detectChanges`
 * y siempre tendrá 7 productos).
 *
 * El signal es `readonly` desde el punto de vista del consumidor: nadie
 * puede hacer `repository.productos().push(x)` y afectar el estado interno
 * (REQ-DATA-5). El único mutator es `set()` dentro de `applyBody()`.
 *
 * No se inyecta `environment`: las claves legacy (`apiUrl`, `backendUrl`)
 * están prohibidas en `cafe-cacao-static/` (REQ-DATA-7).
 */
@Injectable({ providedIn: 'root' })
export class ProductRepository {
  readonly productos: Signal<Product[]>;

  private readonly http = inject(HttpClient);

  constructor() {
    // Mantenemos una referencia writable local para poder invocar `.set()`
    // desde `applyBody()`. El campo público expone solo el `Signal` de
    // lectura, así los consumidores NO pueden mutar el signal desde fuera
    // (REQ-DATA-5).
    const writable: WritableSignal<Product[]> = signal<Product[]>(
      PRODUCTOS_FALLBACK as Product[]
    );
    this.productos = writable;

    this.http
      .get<Product[]>('data/productos.json')
      .pipe(catchError(() => of(null)))
      .subscribe((body) => this.applyBody(body, writable));
  }

  /**
   * Aplica el body recibido a la signal.
   *
   * Pipeline de validación (ver `design.md` §6):
   *  - body null/no-array    → warn + signal se queda en fallback
   *  - body array con mix    → warn(batch) + signal = válidos
   *  - body array con todos válidos → signal = body
   *  - body array con todos inválidos → warn + signal se queda en fallback
   *
   * El método es privado: el único flujo de entrada es el `subscribe()` del
   * constructor. Si en el futuro se quisiera recargar (no es el caso para
   * v1 — REQ-DATA-1 dice "una sola petición"), se expondría un método
   * público separado.
   */
  private applyBody(
    body: Product[] | null,
    writable: WritableSignal<Product[]>
  ): void {
    if (!Array.isArray(body)) {
      console.warn('[ProductRepository] productos.json is not an array; using fallback.');
      return;
    }

    const valid = body.filter(isProduct);
    const dropped = body.length - valid.length;

    if (dropped > 0) {
      console.warn(
        `[ProductRepository] Dropped ${dropped} item(s) that failed validation.`
      );
    }

    if (valid.length > 0) {
      writable.set(valid);
    } else {
      console.warn(
        '[ProductRepository] No valid items in JSON; using fallback.'
      );
    }
  }
}
