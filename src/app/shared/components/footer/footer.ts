import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SOCIAL_LINKS, SocialLink } from '../../social/social-links';

/**
 * Footer chrome pequeño del layout raíz.
 *
 * Aclaración de scope: este NO es el "resumen-final" del catálogo que vive
 * dentro de `home.html` (ese bloque grande con la grilla de "todos los
 * productos en detalle" se mantiene en `features/home/home.html`). Este
 * `app-footer` es la pieza de chrome montada en `app.html` después de
 * `</main>`, fuera del layout principal de secciones, y solo contiene
 * copyright + los 3 íconos de redes sociales (mismo set que el Header).
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  readonly anio = new Date().getFullYear();
  readonly nombreEmpresa = 'Granart';
  readonly redesSociales: readonly SocialLink[] = SOCIAL_LINKS;
}
