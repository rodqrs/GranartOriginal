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
  @ViewChildren('seccion', { read: ElementRef })
  pageSections!: QueryList<ElementRef<HTMLElement>>;

  private readonly repository = inject(ProductRepository);

  private scrollListener?: () => void;
  private pageSectionsSubscription?: Subscription;
  private readonly fallbackImageUrl = 'assets/images/logo.jpg';

  /**
   * Tolerancia en px para el cálculo de la sección activa.
   * Absorbe el solapamiento del header fijo sobre el borde superior del
   * viewport, sin dejar que una sección siguiente más baja robe el índice.
   */
  private readonly activeTolerance = 8;

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

    // Seguimiento pasivo de la sección visible: solo alimenta el resaltado
    // del rail lateral. No interviene en el scroll (sin preventDefault ni
    // scrollIntoView): el desplazamiento queda en manos del usuario y el
    // navegador lo hace gradual, sin saltos de pantalla completa.
    this.scrollListener = () => this.syncActiveSection();
    window.addEventListener('scroll', this.scrollListener, { passive: true });

    this.pageSectionsSubscription = this.pageSections.changes.subscribe(() => {
      this.syncActiveSection();
    });

    setTimeout(() => this.syncActiveSection(), 0);
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }

    this.pageSectionsSubscription?.unsubscribe();
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

  /**
   * Calcula la sección activa anclando la medición al BORDE SUPERIOR del
   * viewport, que es la misma referencia que usan los anclas del navbar
   * al resolver el `href`.
   *
   * Antes comparaba cada `top` contra el CENTRO del viewport. Con secciones de
   * altura desigual eso devuelve un índice adelantado: si la sección siguiente
   * mide menos de media pantalla, su `top` queda más cerca del centro que el de
   * la sección visible. Ahora se toma la última sección cuyo `top` ya alcanzó
   * el borde superior, que es exactamente la que ocupa el viewport.
   */
  private syncActiveSection(): void {
    if (typeof window === 'undefined' || this.pageSections.length === 0) {
      return;
    }

    const probe = window.scrollY + this.activeTolerance;
    let activeIndex = 0;

    this.pageSections.forEach((sectionRef, index) => {
      const top = sectionRef.nativeElement.getBoundingClientRect().top + window.scrollY;
      if (top <= probe) {
        activeIndex = index;
      }
    });

    // Derivar el producto activo desde el `id` real de la sección en vez de
    // asumir un offset fijo de índices. Si mañana se agrega o quita una sección
    // (grilla, banner), el rail sigue resaltando el producto correcto.
    const sectionId = this.pageSections.get(activeIndex)?.nativeElement.id ?? '';
    const match = /^detalle-producto-(\d+)$/.exec(sectionId);
    this.activeDetalleId.set(match ? Number(match[1]) : null);
  }
}
