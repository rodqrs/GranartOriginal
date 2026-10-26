# Café & Cacao Artesanal — Catálogo Estático

Catálogo de productos estático, sin backend. Construido con Angular 21.
Publicable en Netlify, Vercel o Cloudflare Pages.

## Estado actual

Funcional y verde. Commiteado y publicado en `github.com/quisr93/GRANART` (branch `main`).
Todavía **no hay hosting**: es la fase de desarrollo.

| Gate | Estado |
|------|--------|
| Tests | 19/19 en verde |
| Build producción | 278.43 kB inicial / 72.18 kB transfer — **0 warnings** de presupuesto |
| Lint | 0 errores, 0 warnings |
| Catálogo | 7 productos reales, sin imágenes colgantes |
| Imágenes | 0.79 MB en total (la más pesada: `chocolate.jpg`, 240 kB) |

**Lo que hay construido:** home con carrusel de 7 productos (autoplay 7 s, miniaturas,
flechas), grilla responsive, secciones de detalle por producto con navegación por chevron
en mobile, header con nav e íconos sociales, y footer.

**Lo que está deliberadamente pendiente:**

- **Producto 5 (*Café Descafeinado*) fue quitado del catálogo** porque no existe
  `cafe-descafeinado.jpg`. Los ids 1,2,3,4,6,7,8 se mantienen sin renumerar — el 5 queda
  libre para reincorporarlo cuando haya foto.
- Los productos 6, 7 y 8 **reutilizan** las fotos de 2, 3 y 4.
- El header desaparece a ≤200 px (sin navegación en esa medida); el header plegable es
  una tanda posterior.
- `cafe-cacao-frontend/` y `cafe-cacao-backend/` viven solo en local (ignorados por el
  `.gitignore` de la raíz) hasta una fase 2.

## Cómo levantarla

```bash
git clone https://github.com/quisr93/GRANART.git
cd cafe-cacao-static
npm install
npm start            # → http://localhost:4200
```

El servidor de desarrollo tarda ~4 s en estar listo. No necesita backend: la SPA es
frontend-only y lee `public/data/productos.json`.

> **Puerto ocupado.** Si `4200` ya está tomado por otro proceso, Angular no arranca en
> segundo plano: avanza al siguiente libre. Levantalo a mano con
> `npm start -- --port 4201` y abrí ese puerto.

Verificar que anduvo:

```bash
curl -s http://localhost:4200/ | grep app-root   # debe encontrar <app-root>
curl -s http://localhost:4200/data/productos.json | python -m json.tool | grep '"id"'
```

## Stack

- Angular 21 (standalone components, signals)
- Angular Material
- HttpClient + withFetch
- Vitest + angular-eslint
- Prettier

## Verificar que todo esté verde

```bash
npm run build              # Producción → dist/cafe-cacao-static/browser/
npm test -- --watch=false  # Vitest — 19 specs, 3 archivos
npm run lint               # angular-eslint
```

Los tres deben terminar sin errores. El build además debe reportar **0 warnings** de
presupuesto.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo en http://localhost:4200 |
| `npm start -- --port 4201` | Igual, forzando otro puerto si el 4200 está ocupado |
| `npm run build` | Build de producción → `dist/cafe-cacao-static/browser/` |
| `npm test -- --watch=false` | Tests con Vitest, una sola pasada |
| `npm run lint` | Linting con angular-eslint |
| `npm run lint:fix` | Linting + auto-fix |

> **`npm test` se cuelga.** El builder es `@angular/build:unit-test` con Vitest y el modo
> watch queda activo en una terminal interactiva. **Siempre** pasá `--watch=false`.

## Estructura

```
src/
├── app/
│   ├── core/
│   │   ├── data/
│   │   │   ├── product.repository.ts
│   │   │   └── productos-fallback.ts
│   │   └── models/
│   │       └── product.model.ts
│   ├── features/
│   │   └── home/
│   │       ├── home.ts / .html / .scss
│   │       └── components/
│   │           └── carousel/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── header/
│   │   │   └── footer/
│   │   └── social/
│   │       └── social-links.ts
│   ├── app.ts / .html / .scss
│   └── app.config.ts
├── assets/
│   ├── images/
│   └── styles/
├── public/
│   └── data/
│       └── productos.json
├── index.html
├── main.ts
└── styles.scss
```

## Agregar un producto

Dos lugares, NUNCA ambos. Si modificás el JSON en runtime se pisa el fallback; si no, el fallback queda como red de seguridad.

### Opción 1: JSON (recomendado — datos sin recompilar)
1. Abrir `public/data/productos.json`
2. Agregar una entrada con la forma:
```json
{
  "id": 9,
  "titulo": "Café Tostado Premium",
  "descripcion": "Café 100% arábica.",
  "categoria": "cafe-tostado",
  "precio": 25000,
  "cantidadDisponible": 50,
  "imagenUrl": "/assets/images/nuevo-producto.jpg",
  "disponible": true
}
```
3. **Categorías válidas**: `"cafe-tostado" | "cafe-molido" | "cafe-verde" | "chocolate"` (cualquier otra hace que `isProduct()` rechace el item y se descarte en silencio).
4. **Imagen**: poner el archivo en `src/assets/images/` y referenciarlo con `/assets/images/<archivo>`.
5. Reconstruir: `npm run build`

### Opción 2: Fallback (datos compilados en el bundle)
1. Abrir `src/app/core/data/productos-fallback.ts`
2. Agregar al array `PRODUCTOS_FALLBACK` con la misma forma que el JSON.
3. Reconstruir: `npm run build`

> **Tip**: si tenés pocos productos y querés que anden incluso si el JSON no se carga, mantené ambos sincronizados. El fallback SIEMPRE se carga primero y solo se pisa si el JSON responde 200 con items válidos (validación vía `isProduct()`).

### Validación de productos

El repositorio descarta items inválidos en silencio. Un item es inválido si:
- falta cualquier campo (`id`, `titulo`, `descripcion`, `categoria`, `precio`, `cantidadDisponible`, `imagenUrl`, `disponible`)
- `precio <= 0`
- `categoria` no es una de las 4 válidas

Si todos los items del JSON son inválidos, la app usa el fallback completo.

## Cambiar el nombre de la empresa

Está en **dos lugares** (por ahora — ver "Refactor pendiente" al final):

1. `src/app/shared/components/header/header.ts` línea 22:
   ```typescript
   readonly nombreEmpresa = 'Café & Cacao Artesanal';
   ```
2. `src/app/shared/components/footer/footer.ts` línea 25:
   ```typescript
   readonly nombreEmpresa = 'Café & Cacao Artesanal';
   ```

> Si más adelante querés un solo punto de verdad, mové `nombreEmpresa` a `src/app/shared/const/brand.ts` y consumilo desde Header/Footer.

## Cambiar las redes sociales (URLs y/o agregar una)

Un solo lugar:

`src/app/shared/social/social-links.ts`

Estado actual:

```typescript
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { nombre: 'WhatsApp',  iconoClase: 'fa-brands fa-whatsapp',  url: 'https://wa.me/c/573222370317', ariaLabel: 'Contactar por WhatsApp' },
  { nombre: 'Instagram', iconoClase: 'fa-brands fa-instagram', url: 'https://www.instagram.com/granart.col/', ariaLabel: 'Visitar Instagram' },
  { nombre: 'Facebook',  iconoClase: 'fa-brands fa-facebook-f', url: null, ariaLabel: 'Visitar Facebook' }
];
```

- **`url: null` = red deshabilitada.** El ícono se queda a la vista, atenuado y sin
  `<a>`, para no romper el layout ni mentir sobre un link que no existe. Ponerle URL lo
  reactiva solo — Header y Footer lo detectan.
- `iconoClase` debe ser una clase válida de **Font Awesome 6.6.0** (ya precargado en
  `index.html`).
- `ariaLabel` es OBLIGATORIO por accesibilidad (los íconos son decorativos para screen
  readers).
- Para agregar una red nueva, agregá un objeto al array — Header y Footer se actualizan
  automáticamente.
- Para reordenar, cambiá el orden de los objetos en el array.

## Cambiar textos fijos de la UI

Los textos del carousel (no de los productos, que están en el JSON) están **hardcodeados en el HTML** del componente:

`src/app/features/home/components/carousel/carousel.html`:
- Línea 32: `'Disponible' | 'Agotado'` — etiquetas de estado
- Línea 39: `'Ver detalle completo'` — link
- Líneas 69, 77, 89: aria-labels de los controles de navegación

Otros textos fijos en la app:
- `src/index.html` línea 5: `<title>` del browser
- `src/index.html` línea 11-13: preloads de Google Fonts
- `src/app/features/home/home.html`: el bloque "resumen-final" con la grilla de detalle de cada producto

## Cambiar el logo

1. Reemplazar el archivo en **dos lugares** (los asset globs lo buscan en ambos):
   - `src/assets/images/logo.jpg` (usado en runtime; se copia a `dist/assets/images/`)
   - `public/favicon.ico` (favicon del browser)
2. La fallback de las imágenes de producto es `/assets/images/logo.jpg` — si querés que el fallback sea otro, hay que cambiar en:
   - `src/app/features/home/home.ts` línea 62: `private readonly fallbackImageUrl = '/assets/images/logo.jpg';`
   - `src/app/features/home/components/carousel/carousel.ts` línea 38 (la misma constante)
3. `npm run build`

## Cambiar el `<title>` del browser

`src/index.html` línea 5. Tenés que reconstruir.

## Agregar / cambiar imágenes de productos

Las imágenes de producto se referencian en cada `Product` del JSON (o del fallback):

- **Path recomendado**: `/assets/images/<archivo>.jpg` (o `.png`/`.webp`)
- **Ubicación física**: `src/assets/images/<archivo>.jpg`
- **Tamaño recomendado**: ~800x600 px (aspect ratio 4:3) — los thumbnails y el carousel lo respetan
- **Peso recomendado**: < 200 kB cada una. Comprimir con [TinyPNG](https://tinypng.com) o [Squoosh](https://squoosh.app) antes de subir.
- **Formato**: JPG para fotos, PNG para imágenes con transparencia, WebP para mejor compresión (soporte de los browsers modernos).
- **Nombre**: sin espacios ni tildes. Ej: `cafe-tostado-premium.jpg` no `Café Tostado Premium.jpg`.

Ejemplo de cambio:
1. Copiar la imagen nueva a `src/assets/images/cafe-tostado.jpg`
2. En `public/data/productos.json`, actualizar `imagenUrl: "/assets/images/cafe-tostado.jpg"` del producto correspondiente
3. Reconstruir

## Cambiar la paleta de colores / tipografía

`src/assets/styles/_variables.scss` — variables SCSS centralizadas (colores, fuentes, espaciado, breakpoints). Después de cambiar, reconstruir.

## Próximos pasos para probar funcionalidad

### Verificación automática (ya creada)
```bash
cd cafe-cacao-static
npm run build              # → exit 0, 278.43 kB inicial / 72.18 kB transfer, 0 warnings
npm test -- --watch=false  # → 19 specs, 3 archivos, todos verdes
npm run lint               # → "All files pass linting."
```

Cualquiera de los tres fallando es bloqueante para commitear.

### Pruebas manuales recomendadas

#### En desarrollo (`npm start`)
1. **Carga inicial**: ir a `http://localhost:4200`. Deben verse los 7 productos en el carousel.
2. **Carousel**: navegar con flechas, indicadores, thumbnails y scroll horizontal. El autoplay (**7 s**, `AUTOPLAY_DELAY` en `carousel.ts`) debe pausarse al hacer hover.
3. **Wheel navigation**: scroll con la rueda del mouse — debe avanzar por las secciones de scroll-snap (carousel → grilla de productos → 7 secciones de detalle → resumen-final).
4. **Anchor links**: hacer click en "Ver detalle completo" del carousel — debe scrollear al detalle del producto.
5. **Responsive**: probar en mobile (DevTools). El carousel, grilla, y layout deben adaptarse.
6. **Consola del browser**: NO debe haber errores ni warnings. Si aparece `[ProductRepository] ...`, significa que el JSON no se cargó y se está usando el fallback.
7. **Redes sociales**: los 3 íconos del Header y Footer deben abrir las URLs en nueva pestaña (con `rel="noopener noreferrer"`).

#### En el bundle de producción (`npm run build` + servir `dist/`)
1. **Localmente**: `npx http-server dist/cafe-cacao-static/browser` o `npx serve dist/cafe-cacao-static/browser` y abrir `http://localhost:8080`.
2. **404 test**: navegar a `http://localhost:8080/data/productos.json` — debe servir el JSON.
3. **SPA fallback**: navegar a `http://localhost:8080/cualquier-ruta-inventada` — debe redirigir a `index.html` (gracias a `_redirects`).
4. **Performance**: abrir DevTools → Network, hacer hard reload. Los chunks deben cachearse.

#### Despliegue (post-deploy)
1. **Netlify**: drag-and-drop de la carpeta `dist/cafe-cacao-static/browser/` o conectar el repo.
2. **Vercel**: `vercel deploy --prod` con la config del `vercel.json`.
3. **Cloudflare Pages**: drag-and-drop de la misma carpeta.
4. **Después del deploy**: validar que el SPA fallback funcione (la URL `/algo-inexistente` no debe dar 404, debe servir la app).

### Tests creados (19 specs, 3 archivos)

| Archivo | Tests | Cubre |
|---|---|---|
| `src/app/core/data/product.repository.spec.ts` | 4 | Carga OK, 404 → fallback, body malformado → fallback, signal no muta |
| `src/app/features/home/home.spec.ts` | 3 | 7 cards renderizan, títulos presentes, signal vacío → no se queda en blanco |
| `src/app/features/home/components/carousel/carousel.spec.ts` | 12 | `getImagenUrl` sobre 6 clases de input (vacío, http://, data:, /assets/, assets/, uploads/) + bordes (whitespace, mayúsculas) |

Para ejecutar con detalle:
```bash
npm test -- --watch=false
# Output:
#  ✓ product.repository.spec.ts  (4 tests)  27ms
#  ✓ carousel.spec.ts            (12 tests)  10ms
#  ✓ home.spec.ts                (3 tests)   378ms
#  Test Files  3 passed (3)
#  Tests       19 passed (19)
```

## Deploy

### Netlify
- Repo: conectar repositorio a Netlify
- Base directory: `cafe-cacao-static`
- Build command: `npm run build`
- Publish directory: `dist/cafe-cacao-static/browser`
- El archivo `netlify.toml` ya configura el SPA fallback.

### Vercel
- Proyecto: Importar desde el repositorio
- Framework preset: Other
- Root directory: `cafe-cacao-static`
- Build command: `npm run build`
- Output directory: `dist/cafe-cacao-static/browser`
- El archivo `vercel.json` ya configura el SPA fallback.

### Cloudflare Pages
- Dashboard: Create a project -> conectar repositorio
- Build command: `npm run build`
- Build output: `dist/cafe-cacao-static/browser`
- Root directory: `cafe-cacao-static`
- El archivo `public/_redirects` se copia automáticamente al build output.

## Troubleshooting

1. **Build fails**: Verificar que `angular.json` tenga los asset globs correctos (`public/**/*`).
2. **404 en /data/productos.json**: Confirmar que `public/data/productos.json` existe y que el asset glob incluye `public/**/*`.
3. **Grilla vacía**: Abrir la consola del browser. Si aparece `[ProductRepository] ...`, el JSON no se cargó y cayó al fallback.
4. **Error de lint**: Buscar imports sin usar o problemas de formato (Prettier). Correr `npm run lint:fix`.
5. **Deploy "publish dir not found"**: Verificar que `dist/cafe-cacao-static/browser/` existe localmente y que el valor de `publish` coincide exactamente.
6. **Tests fallan**: Correr `npm test -- --watch=false` para ver el detalle (Vitest no usa `--run`). Buscar `console.warn` no esperado en repository.spec.ts.
7. **Puerto 4200 ocupado**: otro proceso lo tiene. Usá `npm start -- --port 4201` y abrí ese puerto — no mates el proceso ajeno.

## Nota sobre environment

El proyecto tiene `src/environments/environment.ts` y `environment.prod.ts` por compatibilidad con Angular CLI. No hay variables `apiUrl` ni `backendUrl` — la SPA es frontend-only.
