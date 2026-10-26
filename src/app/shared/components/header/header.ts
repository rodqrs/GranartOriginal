import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SOCIAL_LINKS, SocialLink } from '../../social/social-links';

/**
 * Header fijo semi-transparente con logo, nombre de empresa y redes sociales.
 * Usa `backdrop-filter: blur()` para el efecto de cristal (ver `header.scss`).
 *
 * Es un componente presentacional puro: no tiene inputs ni outputs y no se
 * suscribe a ningún servicio. Lee directamente del módulo `shared/social/`
 * para mantener Header y Footer sincronizados sobre la misma lista.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  readonly nombreEmpresa = 'Café & Cacao Artesanal';
  readonly redesSociales: readonly SocialLink[] = SOCIAL_LINKS;
}
