import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { Carousel } from './components/carousel/carousel';
import { ProductRepository } from '../../core/data/product.repository';
import { Product } from '../../core/models/product.model';

/**
 * Componente página principal (Home).
 *
 * Integra el hero carousel, la grilla de productos y las secciones
 * full-screen por producto. Lee los productos del `ProductRepository`
 * mediante `inject()` (no constructor DI) — el repository se construye
 * en el bootstrap de la app, así que su signal ya tiene el fallback
 * listo antes del primer `ngOnInit` y la primera paint nunca muestra
 * un grid vacío (REQ-QA-3).
 *
 * Diff vs `cafe-cacao-frontend/src/app/features/home/home.ts`:
 *  - Se elimina `ProductService` (legacy) y se inyecta
 *    `ProductRepository` (nuevo).
 *  - Se elimina `import { environment }` (REQ-DATA-7).
 *  - `productos: Product[] = []` se reemplaza por dos getters
 *    (`productosDisponibles`, `productosGrid`) que leen del signal
 *    (REQ-DATA-1, REQ-QA-3).
 *  - Se elimina `cargarProductos()` y el array inline `productosFallback`
 *    (ahora vive en `core/data/productos-fallback.ts`).
 *  - El cuerpo de `getImagenUrl()` se reemplaza por la tabla de
 *    resolución estática del design §7 (REQ-DATA-6).
 *  - Los guards `typeof window === 'undefined'` se mantienen como
 *    defense in depth por si alguien reactiva SSR en un cambio futuro
 *    (ver design §4 nota SSR-safety).
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Carousel],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements AfterViewInit, OnDestroy {
  @ViewChildren('snapSection', { read: ElementRef })
  snapSections!: QueryList<ElementRef<HTMLElement>>;

  private readonly repository = inject(ProductRepository);

  private isWheelNavigating = false;
  private currentSectionIndex = 0;
  private wheelListener?: (event: WheelEvent) => void;
  private scrollListener?: () => void;
  private scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
  private snapSectionsSubscription?: Subscription;
  private readonly fallbackImageUrl = 'assets/images/logo.jpg';

  /**
   * Tolerancia en px para el cálculo de la sección activa.
   * Absorbe el offset residual del snap nativo y el solapamiento del header
   * fijo, sin dejar que una sección siguiente más baja robe el índice.
   */
  private readonly snapTolerance = 8;

  /**
   * ms de inactividad de scroll antes de liberar el lock de navegación.
   * El snap nativo dispara eventos `scroll` reales: 120ms de silencio
   * significa que el scroll terminó de verdad.
   */
  private readonly scrollIdleMs = 120;

  /**
   * Id del producto cuya pantalla de detalle está activa, o `null` si la
   * sección visible no es una pantalla de detalle. Alimenta el resaltado del
   * rail lateral `.detalle-thumbnails`.
   */
  readonly activeDetalleId = signal<number | null>(null);

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.wheelListener = (event: WheelEvent) => this.handleWheelNavigation(event);
    window.addEventListener('wheel', this.wheelListener, { passive: false });

    // El snap nativo (`styles.scss` → `scroll-snap-type: y mandatory`) dispara
    // scroll. Este listener renueva el lock para que se libere cuando el
    // scroll REALMENTE se detiene, en lugar de con un timeout fijo que compite
    // con la duración real del scroll suave.
    this.scrollListener = () => this.renewScrollLock();
    window.addEventListener('scroll', this.scrollListener, { passive: true });

    this.snapSectionsSubscription = this.snapSections.changes.subscribe(() => {
      this.syncCurrentSectionIndex();
    });

    setTimeout(() => this.syncCurrentSectionIndex(), 0);
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      if (this.wheelListener) {
        window.removeEventListener('wheel', this.wheelListener);
      }
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener);
      }
    }

    if (this.scrollIdleTimer) {
      clearTimeout(this.scrollIdleTimer);
      this.scrollIdleTimer = null;
    }

    this.snapSectionsSubscription?.unsubscribe();
  }

  /**
   * Mantiene el lock de navegación mientras el scroll sigue activo y lo libera
   * `scrollIdleMs` después del último evento real de scroll.
   *
   * Reemplaza el `setTimeout` fijo de 700ms. Con secciones de altura variable
   * (`min-height`, `100svh`, y el override `min-height: auto` del responsive)
   * el scroll suave puede tardar más o menos que 700ms: el lock se liberaba en
   * pleno vuelo y el siguiente evento de rueda se peleaba con el scroll que
   * todavía estaba corriendo.
   */
  private renewScrollLock(): void {
    this.isWheelNavigating = true;

    if (this.scrollIdleTimer) {
      clearTimeout(this.scrollIdleTimer);
    }

    this.scrollIdleTimer = setTimeout(() => {
      this.scrollIdleTimer = null;
      this.isWheelNavigating = false;
      // Re-sincronizar al reposo: el índice queda exactamente en la sección
      // donde el snap nativo terminó.
      this.syncCurrentSectionIndex();
    }, this.scrollIdleMs);
  }

  /** ¿La pantalla de detalle de este producto es la que está activa? */
  esDetalleActivo(productId: number): boolean {
    return this.activeDetalleId() === productId;
  }

  /**
   * Productos disponibles, leídos desde el signal del repository.
   * Si por alguna razón el array no contiene `disponible: true`,
   * devolvemos el array entero (mismo fallback que en el reference).
   * Este getter NUNCA se cachea — siempre lee del signal.
   */
  get productosDisponibles(): Product[] {
    const disponibles = this.repository.productos().filter((producto) => producto.disponible);
    return disponibles.length > 0 ? disponibles : this.repository.productos();
  }

  /**
   * Productos disponibles para mostrar en la grilla del Home.
   *
   * La grilla fue concebida originalmente como 2x2, pero ahora muestra todos
   * los productos disponibles. Con una cantidad impar de productos, la última
   * tarjeta ocupa ambas columnas para no dejar una celda vacía.
   */
  get productosGrid(): Product[] {
    return this.productosDisponibles;
  }

  formatearPrecio(precio: number): string {
    return precio.toLocaleString('es-CO');
  }

  /**
   * Resuelve la URL de imagen para un input arbitrario.
   *
   * REQ-DATA-6: NO se prefija `environment.backendUrl`. La tabla completa
   * está en `design.md` §7 — comportamiento idéntico al del Carousel.
   */
  getImagenUrl(imagenUrl: string): string {
    if (!imagenUrl) return this.fallbackImageUrl;

    const normalized = imagenUrl.trim().replace(/\\/g, '/').replace(/^\.\//, '');

    if (!normalized) return this.fallbackImageUrl;

    if (/^https?:\/\//i.test(normalized) || /^data:/i.test(normalized)) {
      return normalized;
    }

    if (normalized.startsWith('/assets/') || normalized.startsWith('assets/')) {
      // Relativa sin `/` inicial: se resuelve contra el `<base href>` y
      // funciona tanto en raíz como en subdirectorio (GitHub Pages).
      return normalized.startsWith('/') ? normalized.slice(1) : normalized;
    }

    const filename = normalized.split('/').pop() ?? '';
    return filename ? `assets/images/${filename}` : this.fallbackImageUrl;
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.dataset['fallbackApplied'] === 'true') {
      return;
    }

    image.dataset['fallbackApplied'] = 'true';
    image.src = this.fallbackImageUrl;
  }

  private handleWheelNavigation(event: WheelEvent): void {
    if (this.snapSections.length === 0) return;

    const magnitude = Math.abs(event.deltaY);
    if (magnitude < 8) return;

    event.preventDefault();

    if (this.isWheelNavigating) {
      return;
    }

    this.syncCurrentSectionIndex();

    const direction = event.deltaY > 0 ? 1 : -1;
    const maxIndex = this.snapSections.length - 1;
    const nextIndex = Math.max(0, Math.min(maxIndex, this.currentSectionIndex + direction));

    if (nextIndex === this.currentSectionIndex) {
      return;
    }

    const targetSection = this.snapSections.get(nextIndex)?.nativeElement;
    if (!targetSection) {
      return;
    }

    this.currentSectionIndex = nextIndex;
    this.renewScrollLock();
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Calcula la sección activa anclando la medición al BORDE SUPERIOR del
   * viewport, que es la misma referencia que usa
   * `scrollIntoView({ block: 'start' })`.
   *
   * Antes comparaba cada `top` contra el CENTRO del viewport. Con secciones de
   * altura desigual eso devuelve un índice adelantado: si la sección siguiente
   * mide menos de media pantalla, su `top` queda más cerca del centro que el de
   * la sección visible. Una rueda hacia arriba resolvía entonces a la sección
   * en la que ya se estaba, el evento se consumía, y el scroll quedaba
   * "trabado" respondiendo solo hacia abajo.
   *
   * Ahora se toma la última sección cuyo `top` ya alcanzó el borde superior,
   * que es exactamente la que ocupa el viewport.
   */
  private syncCurrentSectionIndex(): void {
    if (typeof window === 'undefined' || this.snapSections.length === 0) {
      return;
    }

    const probe = window.scrollY + this.snapTolerance;
    let activeIndex = 0;

    this.snapSections.forEach((sectionRef, index) => {
      const top = sectionRef.nativeElement.getBoundingClientRect().top + window.scrollY;
      if (top <= probe) {
        activeIndex = index;
      }
    });

    this.currentSectionIndex = activeIndex;

    // Derivar el producto activo desde el `id` real de la sección en vez de
    // asumir un offset fijo de índices. Si mañana se agrega o quita una sección
    // (grilla, banner), el rail sigue resaltando el producto correcto.
    const sectionId = this.snapSections.get(activeIndex)?.nativeElement.id ?? '';
    const match = /^detalle-producto-(\d+)$/.exec(sectionId);
    this.activeDetalleId.set(match ? Number(match[1]) : null);
  }
}
