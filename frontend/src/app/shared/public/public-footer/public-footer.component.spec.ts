import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicFooterComponent } from './public-footer.component';

describe('PublicFooterComponent', () => {
  const baseConfig = {
    id: 'cfg-1',
    companyId: 'company-a',
    heroTitle: null,
    heroSubtitle: 'Texto base desde WebsiteConfig',
    primaryColor: '#2563eb',
    logoUrl: null,
    banners: null,
    services: null,
    faq: null,
    contactPhone: '+573001112233',
    contactEmail: 'ventas@empresa-a.com',
    address: 'Calle 1 # 2-3',
    updatedAt: new Date().toISOString(),
  };

  const create = async (
    footerData: Record<string, unknown> | null = null,
    theme: string = 'commercial',
  ) => {
    await TestBed.configureTestingModule({
      imports: [PublicFooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PublicFooterComponent);
    fixture.componentRef.setInput('subdomain', 'empresa-a');
    fixture.componentRef.setInput('company', {
      name: 'Empresa A',
      subdomain: 'empresa-a',
    });
    fixture.componentRef.setInput('config', baseConfig);
    fixture.componentRef.setInput('footerData', footerData);
    fixture.componentRef.setInput('theme', theme);
    fixture.componentRef.setInput('offices', [
      {
        id: 'office-1',
        name: 'Sede Norte',
        address: 'Calle 1',
        city: 'Bogota',
        phone: '+573001112233',
      },
    ]);
    fixture.detectChanges();
    return fixture;
  };

  it('usa datos del FOOTER publicado cuando están disponibles', async () => {
    const fixture = await create({
      description: 'Mensaje de cierre desde builder',
      copyrightText: '© 2026 Empresa A · Mensaje legal',
      whatsapp: '+573009998877',
      email: 'builder@empresa-a.com',
      showPoweredBySalesflow: true,
    });
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Mensaje de cierre desde builder');
    expect(text).toContain('builder@empresa-a.com');
    expect(text).toContain('© 2026 Empresa A · Mensaje legal');
  });

  it('usa fallback de WebsiteConfig cuando no hay FOOTER publicado', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Texto base desde WebsiteConfig');
    expect(text).toContain('ventas@empresa-a.com');
    expect(text).toContain('Powered by');
  });

  it('oculta Powered by SalesFlow cuando showPoweredBySalesflow=false', async () => {
    const fixture = await create({
      showPoweredBySalesflow: false,
      description: 'Footer sin powered',
    });
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Footer sin powered');
    expect(text).not.toContain('Powered by');
  });

  it('aplica defaults seguros cuando faltan campos en FOOTER publicado', async () => {
    const fixture = await create({
      showPoweredBySalesflow: true,
    });
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Texto base desde WebsiteConfig');
    expect(text).toContain('Todos los derechos reservados');
  });

  it('mantiene enlaces de navegación para rutas públicas clave', async () => {
    const fixture = await create({
      description: 'Footer tenant A',
      showPoweredBySalesflow: true,
    });

    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    );
    const hrefs = links.map((a) => a.getAttribute('href') ?? '');

    expect(hrefs.some((h) => h.includes('/sitio'))).toBe(true);
    expect(hrefs.some((h) => h.includes('/catalogo'))).toBe(true);
    expect(hrefs.some((h) => h.includes('/cotizar'))).toBe(true);
  });

  it('aplica shell premium cuando el tema global es premium', async () => {
    const fixture = await create({ description: 'Footer premium' }, 'premium');
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer.getAttribute('data-theme')).toBe('premium');
  });
});
