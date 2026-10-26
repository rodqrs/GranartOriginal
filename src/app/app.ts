import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Header } from './shared/components/header/header';
import { Home } from './features/home/home';
import { Footer } from './shared/components/footer/footer';

/**
 * Componente raíz de la aplicación Café & Cacao (versión estática).
 *
 * Compone el layout completo: header fijo arriba, `<main>` con el
 * catálogo (Home + Carousel + grid + detalle + resumen), y el footer
 * chrome con copyright + redes sociales.
 *
 * `app-footer` se monta FUERA del scroll-snap layout (`</main>`), en
 * línea con la nota de migración de `design.md` §12 — el bloque
 * "resumen-final" con la grilla de "todos los productos en detalle"
 * sigue viviendo dentro de `home.html` como sección del snap.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header, Home, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
