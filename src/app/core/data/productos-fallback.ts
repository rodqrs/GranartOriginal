import { Product } from '../models/product.model';

/**
 * Red de seguridad para la capa de datos.
 *
 * `PRODUCTOS_FALLBACK` es el array que el `ProductRepository` carga en su
 * signal ANTES de pedir el JSON estático (REQ-DATA-5). Esto garantiza que
 * la primera paint nunca muestre un grid vacío (REQ-QA-3) y que cualquier
 * fallo posterior (404, body malformado, red caída, todos los items
 * rechazados por validación) caiga siempre sobre los mismos 7 productos.
 *
 * El modificador `readonly Product[]` es el contrato de inmutabilidad: los
 * consumidores no pueden mutar el array de respaldo. Si lo intentasen, la
 * mutación sería local al array retornado por `productos()` y no
 * contaminaría el signal (REQ-DATA-5).
 *
 * Los primeros 4 items son los mismos que `cafe-cacao-frontend/src/app/features/home/home.ts:40-81`; del 5º en adelante son propios de esta SPA.
 *
 * IMPORTANTE — este array y `public/data/productos.json` son las DOS fuentes
 * de datos del catálogo y deben mantenerse sincronizados. Si agregás o
 * modificás un producto en uno y no en el otro, quedan desalineados: el JSON
 * pisa a este fallback cuando responde 200 con items válidos, así que un
 * cambio hecho solo acá no se ve; y si el JSON falla, un cambio hecho solo
 * en el JSON tampoco. Mismo `id` y mismos valores en ambos, siempre.
 *
 * `imagenUrl` apunta a las fotos reales en `src/assets/images/`
 * (`REQ-DATA-6`). `logo.jpg` queda solo como imagen de último recurso
 * cuando el `<img>` falla al cargar (`onImageError`).
 */
export const PRODUCTOS_FALLBACK: readonly Product[] = [
  {
    id: 1,
    titulo: 'Café Tostado Premium Artesanal',
    descripcion: 'Café 100% arábica colombiano tostado de forma artesanal.',
    categoria: 'cafe-tostado',
    precio: 25000,
    cantidadDisponible: 50,
    imagenUrl: 'assets/images/cafe-tostado.jpg',
    disponible: true
  },
  {
    id: 2,
    titulo: 'Café Molido Especial Tipo Uva',
    descripcion: 'Perfil afrutado, acidez cítrica balanceada y cuerpo medio-alto.',
    categoria: 'cafe-molido',
    precio: 28000,
    cantidadDisponible: 30,
    imagenUrl: 'assets/images/cafe-molido.jpg',
    disponible: true
  },
  {
    id: 3,
    titulo: 'Café Verde Orgánico Sin Tostar',
    descripcion: 'Granos de café verde orgánico para infusiones.',
    categoria: 'cafe-verde',
    precio: 22000,
    cantidadDisponible: 40,
    imagenUrl: 'assets/images/cafe-verde.jpg',
    disponible: true
  },
  {
    id: 4,
    titulo: 'Chocolate Artesanal 70% Cacao',
    descripcion: 'Chocolate artesanal con cacao fino colombiano.',
    categoria: 'chocolate',
    precio: 18000,
    cantidadDisponible: 60,
    imagenUrl: 'assets/images/chocolate.jpg',
    disponible: true
  },
  {
    id: 6,
    titulo: 'Café Molido Reserva Tueste Oscuro',
    descripcion: 'Molienda fina para espresso, cuerpo intenso y notas de cacao amargo.',
    categoria: 'cafe-molido',
    precio: 26000,
    cantidadDisponible: 45,
    imagenUrl: 'assets/images/cafe-molido.jpg',
    disponible: true
  },
  {
    id: 7,
    titulo: 'Café Verde Geisha de Altura',
    descripcion: 'Variedad Geisha de altura, perfil floral y cítrico para tostión en casa.',
    categoria: 'cafe-verde',
    precio: 34000,
    cantidadDisponible: 20,
    imagenUrl: 'assets/images/cafe-verde.jpg',
    disponible: true
  },
  {
    id: 8,
    titulo: 'Chocolate Artesanal 85% Cacao',
    descripcion: 'Barra de chocolate oscuro 85% con cacao fino de aroma colombiano.',
    categoria: 'chocolate',
    precio: 22000,
    cantidadDisponible: 40,
    imagenUrl: 'assets/images/chocolate.jpg',
    disponible: true
  }
];
