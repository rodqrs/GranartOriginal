/**
 * Fuente única de verdad para los enlaces a redes sociales.
 *
 * El header y el footer consumen el mismo array `SOCIAL_LINKS`, así si el
 * equipo agrega una red nueva (o corrige un URL), ambos
 * componentes se actualizan sin divergencia. WhatsApp e Instagram son las
 * cuentas reales, y Facebook está intencionalmente deshabilitado
 * (`url: null`) para que el ícono permanezca visible sin enlazar a ningún sitio.
 *
 * El modificador `readonly SocialLink[]` impide que cualquier consumidor
 * mute el array por accidente (mismo contrato que `PRODUCTOS_FALLBACK`).
 */
export interface SocialLink {
  nombre: string;
  iconoClase: string;
  url: string | null;
  ariaLabel: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    nombre: 'WhatsApp',
    iconoClase: 'fa-brands fa-whatsapp',
    url: 'https://wa.me/c/573222370317',
    ariaLabel: 'Contactar por WhatsApp'
  },
  {
    nombre: 'Instagram',
    iconoClase: 'fa-brands fa-instagram',
    url: 'https://www.instagram.com/granart.col/',
    ariaLabel: 'Visitar Instagram'
  },
  {
    nombre: 'Facebook',
    iconoClase: 'fa-brands fa-facebook-f',
    url: null,
    ariaLabel: 'Visitar Facebook'
  }
];
