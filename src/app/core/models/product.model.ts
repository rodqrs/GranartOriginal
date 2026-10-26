/**
 * Modelo de producto para la SPA estática `cafe-cacao-static/`.
 *
 * Esta interfaz es el contrato de la capa de datos: coincide con el shape
 * del JSON estático (`public/data/productos.json`) y del fallback
 * (`PRODUCTOS_FALLBACK`). El repositorio la filtra mediante `isProduct()`
 * antes de exponer cualquier item al resto de la app.
 *
 * Reqs cubiertas: REQ-DATA-3 (shape validation), REQ-DATA-4 (categoria union).
 */

/** Categorías válidas del catálogo. Unión cerrada — REQ-DATA-4. */
export type Categoria = 'cafe-tostado' | 'cafe-molido' | 'cafe-verde' | 'chocolate';

/** Lista materializada de la unión — se usa para validar y para spec. */
export const CATEGORIAS: readonly Categoria[] = [
  'cafe-tostado',
  'cafe-molido',
  'cafe-verde',
  'chocolate'
] as const;

/**
 * Producto del catálogo. Los 8 campos son obligatorios; `disponible` lo
 * calcula el backend en la app original; aquí se mantiene en el JSON y en
 * el fallback como dato de origen.
 */
export interface Product {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: Categoria;
  precio: number;
  cantidadDisponible: number;
  imagenUrl: string;
  disponible: boolean;
}

/**
 * Type guard que valida shape + tipos + semántica de un item desconocido.
 *
 * Devuelve `false` cuando:
 *  - el valor no es objeto (o es null),
 *  - falta cualquier campo requerido,
 *  - el tipo de cualquier campo no coincide,
 *  - `precio <= 0` (REQ-DATA-3 — no se aceptan precios no positivos),
 *  - `categoria` no pertenece a la unión (REQ-DATA-4).
 *
 * Esta es la **única** función de validación que el repositorio invoca.
 * Centralizar la regla evita drift entre specs, tests, y código de runtime.
 */
export function isProduct(x: unknown): x is Product {
  if (typeof x !== 'object' || x === null) {
    return false;
  }

  // `noPropertyAccessFromIndexSignature` exige acceso por índice. TypeScript
  // primero reduce `x` a `object`; casteamos a `Record<string, unknown>`.
  const data = x as Record<string, unknown>;

  if (typeof data['id'] !== 'number') return false;
  if (typeof data['titulo'] !== 'string') return false;
  if (typeof data['descripcion'] !== 'string') return false;
  if (typeof data['precio'] !== 'number') return false;
  if (data['precio'] <= 0) return false;
  if (typeof data['cantidadDisponible'] !== 'number') return false;
  if (typeof data['imagenUrl'] !== 'string') return false;
  if (typeof data['disponible'] !== 'boolean') return false;

  const categoria = data['categoria'];
  if (typeof categoria !== 'string') return false;
  if (!(CATEGORIAS as readonly string[]).includes(categoria)) return false;

  return true;
}
