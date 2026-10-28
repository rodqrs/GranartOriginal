import { TestBed } from '@angular/core/testing';

import { Header } from './header';

/**
 * Tests del Header: el nombre de marca mostrado debe ser "Granart"
 * (rebranding del sitio — ver odd/tasks/rebrand-granart-carousel-ux.md).
 */
describe('Header', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Header],
    });
  });

  it('should render the "Granart" brand name', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    const brand = fixture.nativeElement.querySelector('.brand-name');
    expect(brand?.textContent?.trim()).toBe('Granart');
  });
});
