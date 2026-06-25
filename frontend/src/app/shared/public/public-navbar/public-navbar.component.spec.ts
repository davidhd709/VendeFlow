import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicNavbarComponent } from './public-navbar.component';

describe('PublicNavbarComponent', () => {
  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [PublicNavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PublicNavbarComponent);
    fixture.componentRef.setInput('subdomain', 'empresa-a');
    fixture.componentRef.setInput('company', {
      id: 'company-a',
      name: 'Empresa A Celulares',
      slug: 'empresa-a',
      subdomain: 'empresa-a',
    });
    fixture.componentRef.setInput('config', {
      id: 'cfg-1',
      companyId: 'company-a',
      heroTitle: null,
      heroSubtitle: null,
      primaryColor: '#2563eb',
      logoUrl: null,
      banners: null,
      services: null,
      faq: null,
      contactPhone: '+573001112233',
      contactEmail: null,
      address: null,
      updatedAt: new Date().toISOString(),
    });
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza marca y CTA principales', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Empresa A Celulares');
    expect(text).toContain('Cotizar ahora');
    expect(text).toContain('WhatsApp');
  });

  it('muestra franja de contacto cuando hay teléfono', async () => {
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Atención comercial');
    expect(fixture.nativeElement.textContent).toContain('+573001112233');
  });

  it('abre menú móvil al hacer toggle', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;
    component.toggle();
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('.nav-links');
    expect(nav.classList.contains('open')).toBe(true);
  });
});
