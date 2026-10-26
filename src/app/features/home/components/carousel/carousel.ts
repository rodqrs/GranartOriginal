import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  HostListener,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { Product } from '../../../../core/models/product.model';

/**
 * Carousel de productos con auto-play, navegación por teclado, flechas y
 * miniaturas laterales enlazadas. Muestra imagen a pantalla completa
 * con overlay glassmorphism solo en el contenedor de texto.
 *
 * Diff vs la versión de `cafe-cacao-frontend/`:
 *  - Se elimina `import { environment } from '...'` (REQ-DATA-7 — no se
 *    usan claves legacy en `cafe-cacao-static/`).
 *  - El cuerpo de `getImagenUrl()` se reemplaza por la tabla de
 *    resolución estática del design §7 (REQ-DATA-6): ya no se prefija
 *    `backendUrl`, las rutas `uploads/...` se reescriben a
 *    `/assets/images/<filename>`, y la imagen fallback única es
 *    `/assets/images/logo.jpg`.
 *  - El rail de miniaturas deja de recortar la lista (con 7 productos la
 *    columna medía más que la pantalla): ahora es una ventana de ~5 items
 *    que sigue sola al producto activo (`centrarThumbnailActivo()`).
 *  - El resto del comportamiento (autoplay 7s, keyboard, thumbnails,
 *    indicators, hover pause) es idéntico al reference.
 */
@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss'
})
export class Carousel implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() productos: Product[] = [];
  currentIndex = 0;

  // Refs del rail de miniaturas. `thumbRail` es el contenedor scrolleable;
  // `thumbItems` son los items renderizados, en el mismo orden que
  // `getProductosDisponibles()` (el `@for` no se reordena nunca).
  @ViewChild('thumbRail') private thumbRail?: ElementRef<HTMLElement>;
  @ViewChildren('thumbItem') private thumbItems?: QueryList<ElementRef<HTMLElement>>;

  autoplayInterval: ReturnType<typeof setInterval> | null = null;
  isTransitioning = false;
  isHovering = false;
  private transitionTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly fallbackImageUrl = '/assets/images/logo.jpg';

  readonly AUTOPLAY_DELAY = 7000; // 7 segundos entre slides
  readonly TRANSITION_DURATION = 550; // duración de transición visual

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['productos']) return;

    if (this.currentIndex >= this.productos.length) {
      this.currentIndex = 0;
    }

    if (this.productos.length > 0) {
      this.iniciarAutoplay();
    } else {
      this.detenerAutoplay();
    }
  }

  ngOnInit(): void {
    if (this.productos.length > 0) {
      this.iniciarAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.clearTransitionTimeout();
    this.detenerAutoplay();
  }

  ngAfterViewInit(): void {
    // El rail ya existe en el DOM: se recentra la miniatura activa (índice 0)
    // para que la ventana arranque alineada con el producto visible.
    this.centrarThumbnailActivo();
  }

  getProductosDisponibles(): Product[] {
    const disponibles = this.productos.filter((producto) => producto.disponible);
    return disponibles.length > 0 ? disponibles : this.productos;
  }

  seleccionarProducto(productId: number): void {
    const index = this.productos.findIndex((producto) => producto.id === productId);
    if (index >= 0) {
      this.irASlide(index);
    }
  }

  esProductoActivo(productId: number): boolean {
    return this.productos[this.currentIndex]?.id === productId;
  }

  /**
   * ¿Hay un producto despues del slide activo?
   *
   * Los slides y `currentIndex` recorren `productos` —la MISMA lista que usa
   * `siguiente()` con su wrap por `% length`—, no `getProductosDisponibles()`,
   * que es el unico lugar que filtra por `disponible` (el rail lateral).
   * Por eso el guard compara contra `productos.length` y no contra la lista
   * del rail: en el ultimo producto el chevron se oculta y `siguiente()`
   * nunca vuelve al primero.
   */
  haySiguiente(): boolean {
    return this.currentIndex < this.productos.length - 1;
  }

  /**
   * Inicia el auto-play del carousel (cambia cada 7 segundos)
   */
  iniciarAutoplay(): void {
    this.detenerAutoplay(); // Limpiar cualquier interval previo
    this.autoplayInterval = setInterval(() => {
      if (!this.isHovering) {
        this.siguiente();
      }
    }, this.AUTOPLAY_DELAY);
  }

  /**
   * Detiene el auto-play
   */
  detenerAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  /**
   * Navega al siguiente slide con protección de transición
   */
  siguiente(): void {
    if (this.productos.length === 0) return;
    const targetIndex = (this.currentIndex + 1) % this.productos.length;
    this.applyTransition(targetIndex);
  }

  /**
   * Navega al slide anterior con protección de transición
   */
  anterior(): void {
    if (this.productos.length === 0) return;
    const targetIndex = this.currentIndex === 0
      ? this.productos.length - 1
      : this.currentIndex - 1;
    this.applyTransition(targetIndex);
  }

  /**
   * Navega a un slide específico por índice
   */
  irASlide(index: number): void {
    if (index === this.currentIndex || index < 0 || index >= this.productos.length) return;

    this.applyTransition(index);
  }

  private applyTransition(targetIndex: number): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }

    this.isTransitioning = true;
    this.currentIndex = targetIndex;
    this.centrarThumbnailActivo();
    this.transitionTimeout = setTimeout(() => {
      this.isTransitioning = false;
      this.transitionTimeout = null;
    }, this.TRANSITION_DURATION);
  }

  /**
   * Centra verticalmente la miniatura activa dentro del rail lateral.
   *
   * El scroll se calcula a mano y NO con `scrollIntoView`: ese método también
   * desplaza el scroll de la página (pelea con el `scroll-behavior: smooth`
   * global) y no se limita al contenedor del rail.
   *
   * El orden de las miniaturas no cambia nunca (`track producto.id` sobre una
   * lista filtrada estable), así que `offsetTop` es estable: lo único que hay
   * que mover es el elemento activo. La lectura del DOM se hace en el siguiente
   * frame para que el layout ya esté asentado y `clientHeight`/`scrollHeight`
   * no devuelvan 0.
   */
  private centrarThumbnailActivo(): void {
    if (typeof document === 'undefined') return;

    requestAnimationFrame(() => {
      const rail = this.thumbRail?.nativeElement;
      const items = this.thumbItems?.toArray() ?? [];

      // Sin rail renderizado o sin miniaturas todavía: nada que recentrar.
      if (!rail || items.length === 0) return;

      // Si el rail no dibuja todos los productos disponibles, el índice del
      // carousel ya no corresponde a la posición del item: se aborta antes de
      // desplazar el rail a un producto equivocado.
      if (items.length !== this.getProductosDisponibles().length) return;

      const item = items[this.currentIndex]?.nativeElement;
      if (!item) return;

      const top = item.offsetTop - (rail.clientHeight - item.clientHeight) / 2;
      rail.scrollTop = Math.max(0, Math.min(top, rail.scrollHeight - rail.clientHeight));
    });
  }

  private clearTransitionTimeout(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }

    this.isTransitioning = false;
  }

  /**
   * Navega al detalle desde CTA dentro del slide.
   *
   * Nota SSR-safety: el design §4 indica que SSR está apagado en este
   * proyecto, pero conservamos la indirección a `typeof document` (vía
   * `getElementById`) para mantener paridad con el reference y como
   * defense in depth si alguien reactiva SSR en un cambio futuro.
   */
  irADetalle(event: Event, productId: number): void {
    event.preventDefault();
    this.seleccionarProducto(productId);
    if (typeof document === 'undefined') return;
    const target = document.getElementById(`detalle-producto-${productId}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Navega a sección de detalle desde miniatura izquierda.
   */
  irADetalleDesdeMiniatura(event: Event, productId: number): void {
    event.preventDefault();
    this.seleccionarProducto(productId);
    if (typeof document === 'undefined') return;
    const target = document.getElementById(`detalle-producto-${productId}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Pausa auto-play al hacer hover sobre el carousel
   */
  alEntrarMouse(): void {
    this.isHovering = true;
  }

  /**
   * Reanuda auto-play al salir del hover
   */
  alSalirMouse(): void {
    this.isHovering = false;
  }

  /**
   * Navegación con teclado: flechas izquierda y derecha
   */
  @HostListener('window:keydown', ['$event'])
  manejarTeclado(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.anterior();
    } else if (event.key === 'ArrowRight') {
      this.siguiente();
    }
  }

  /**
   * Formatea precio con separadores de miles (formato colombiano)
   */
  formatearPrecio(precio: number): string {
    return precio.toLocaleString('es-CO');
  }

  /**
   * Resuelve la URL de imagen para un input arbitrario.
   *
   * REQ-DATA-6: NO se prefija `environment.backendUrl`. Las rutas se
   * resuelven localmente:
   *  - vacío / whitespace        → `/assets/images/logo.jpg`
   *  - `http(s)://` / `data:`    → unchanged (pass-through)
   *  - `/assets/...`             → unchanged
   *  - `assets/...` (sin /)      → se le agrega el `/` inicial
   *  - `uploads/...` o `/uploads/...` → se reescribe a
   *                                   `/assets/images/<filename>`
   *  - cualquier otra cosa       → se trata como filename y se monta
   *                                 sobre `/assets/images/`
   */
  getImagenUrl(imagenUrl: string): string {
    if (!imagenUrl) return this.fallbackImageUrl;

    const normalized = imagenUrl.trim().replace(/\\/g, '/').replace(/^\.\//, '');

    if (!normalized) return this.fallbackImageUrl;

    if (/^https?:\/\//i.test(normalized) || /^data:/i.test(normalized)) {
      return normalized;
    }

    if (normalized.startsWith('/assets/') || normalized.startsWith('assets/')) {
      return normalized.startsWith('/') ? normalized : `/${normalized}`;
    }

    const filename = normalized.split('/').pop() ?? '';
    return filename ? `/assets/images/${filename}` : this.fallbackImageUrl;
  }

  /**
   * Si una imagen no carga, reemplaza una sola vez por imagen fallback.
   */
  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.dataset['fallbackApplied'] === 'true') {
      return;
    }

    image.dataset['fallbackApplied'] = 'true';
    image.src = this.fallbackImageUrl;
  }
}
