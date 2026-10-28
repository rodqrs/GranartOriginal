import { TestBed } from '@angular/core/testing';

import { Footer } from './footer';

/**
 * Tests del Footer: el nombre de marca mostrado debe ser "Granart"
 * (rebranding del sitio — ver odd/tasks/rebrand-granart-carousel-ux.md).
 */
describe('Footer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Footer],
    });
  });

  it('should render the "Granart" brand name in the copyright line', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const copyright = fixture.nativeElement.querySelector('p, small, div');
    expect(copyright?.textContent).toContain('Granart');
    expect(fixture.nativeElement.textContent).not.toContain('Café & Cacao Artesanal');
  });
});
