import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PublicSiteRenderComponent } from './public-site-render.component';

describe('PublicSiteRenderComponent', () => {
  const create = async (
    config: Record<string, unknown> | null,
    companyName = 'Empresa A',
    sections: Array<Record<string, unknown>> | null = null,
    products: Array<Record<string, unknown>> = [],
    offices: Array<Record<string, unknown>> = [],
  ) => {
    await TestBed.configureTestingModule({
      imports: [PublicSiteRenderComponent],
      providers: [provideNoopAnimations(), provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PublicSiteRenderComponent);
    fixture.componentRef.setInput('config', config as never);
    fixture.componentRef.setInput('companyName', companyName);
    fixture.componentRef.setInput('subdomain', 'empresa-a');
    fixture.componentRef.setInput('sections', sections as never);
    fixture.componentRef.setInput('products', products as never);
    fixture.componentRef.setInput('offices', offices as never);
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza HERO, SERVICES y FAQ con data configurada', async () => {
    const fixture = await create({
      id: 'cfg-1',
      companyId: 'company-a',
      heroTitle: 'Hero de prueba',
      heroSubtitle: 'Subtitulo prueba',
      primaryColor: '#2563eb',
      logoUrl: null,
      banners: null,
      services: [{ title: 'Servicio Premium', description: 'Detalle' }],
      faq: [{ question: 'Pregunta 1', answer: 'Respuesta 1' }],
      contactPhone: null,
      contactEmail: null,
      address: null,
      updatedAt: new Date().toISOString(),
    });

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Hero de prueba');
    expect(text).toContain('Servicio Premium');
    expect(text).toContain('Pregunta 1');
  });

  it('muestra fallback cuando no hay configuracion', async () => {
    const fixture = await create(null);
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Celulares nuevos');
    expect(text).toContain('celulares tienen');
  });

  it('oculta bloque de contacto cuando no hay datos de contacto', async () => {
    const fixture = await create({
      id: 'cfg-1',
      companyId: 'company-a',
      heroTitle: null,
      heroSubtitle: null,
      primaryColor: null,
      logoUrl: null,
      banners: null,
      services: null,
      faq: null,
      contactPhone: null,
      contactEmail: null,
      address: null,
      updatedAt: new Date().toISOString(),
    });
    expect(fixture.nativeElement.textContent).not.toContain('Como te contactan');
  });

  it('renderiza publishedSnapshot respetando orden y ocultando invisibles', async () => {
    const fixture = await create(
      {
        id: 'cfg-1',
        companyId: 'company-a',
        heroTitle: null,
        heroSubtitle: null,
        primaryColor: '#2563eb',
        logoUrl: null,
        banners: null,
        services: null,
        faq: null,
        contactPhone: null,
        contactEmail: null,
        address: null,
        updatedAt: new Date().toISOString(),
      },
      'Empresa A',
      [
        {
          type: 'SERVICES',
          visible: true,
          data: { title: 'Servicios Publicados', items: [{ title: 'Servicio A' }] },
        },
        {
          type: 'FAQ',
          visible: false,
          data: { title: 'FAQ Oculta', items: [{ question: 'Qx', answer: 'Ax' }] },
        },
        {
          type: 'HERO',
          visible: true,
          data: { title: 'Hero Publicado' },
        },
      ],
    );

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Servicios Publicados');
    expect(text).toContain('Servicio A');
    expect(text).toContain('Hero Publicado');
    expect(text).not.toContain('FAQ Oculta');
    expect(text.indexOf('Servicios Publicados')).toBeLessThan(
      text.indexOf('Hero Publicado'),
    );
  });

  it('renderiza FEATURED_PRODUCTS y OFFICES cuando vienen en snapshot', async () => {
    const fixture = await create(
      {
        id: 'cfg-1',
        companyId: 'company-a',
        heroTitle: null,
        heroSubtitle: null,
        primaryColor: '#2563eb',
        logoUrl: null,
        banners: null,
        services: null,
        faq: null,
        contactPhone: '+573001234567',
        contactEmail: null,
        address: null,
        updatedAt: new Date().toISOString(),
      },
      'Empresa A',
      [
        { type: 'FEATURED_PRODUCTS', visible: true, data: { title: 'Top ventas', limit: 1 } },
        { type: 'OFFICES', visible: true, data: { title: 'Nuestras sedes' } },
      ],
      [
        {
          id: 'p-1',
          name: 'iPhone 14',
          price: '3500000',
          condition: 'NUEVO',
        },
      ],
      [
        {
          id: 'o-1',
          name: 'Sede Norte',
          city: 'Bogota',
          address: 'Calle 1',
          phone: '+573001234567',
          isActive: true,
        },
      ],
    );

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Top ventas');
    expect(text).toContain('iPhone 14');
    expect(text).toContain('Nuestras sedes');
    expect(text).toContain('Sede Norte');
  });

  it('aplica tema vibrante cuando HERO lo define en snapshot', async () => {
    const fixture = await create(
      {
        id: 'cfg-1',
        companyId: 'company-a',
        heroTitle: null,
        heroSubtitle: null,
        primaryColor: '#2563eb',
        logoUrl: null,
        banners: null,
        services: null,
        faq: null,
        contactPhone: null,
        contactEmail: null,
        address: null,
        updatedAt: new Date().toISOString(),
      },
      'Empresa A',
      [{ type: 'HERO', visible: true, data: { title: 'Hero', theme: 'vibrant' } }],
    );

    const shell = fixture.nativeElement.querySelector('.site-theme-shell');
    expect(shell.getAttribute('data-theme')).toBe('vibrant');
  });

  it('usa tema commercial por defecto cuando no viene theme', async () => {
    const fixture = await create(
      {
        id: 'cfg-1',
        companyId: 'company-a',
        heroTitle: null,
        heroSubtitle: null,
        primaryColor: '#2563eb',
        logoUrl: null,
        banners: null,
        services: null,
        faq: null,
        contactPhone: null,
        contactEmail: null,
        address: null,
        updatedAt: new Date().toISOString(),
      },
      'Empresa A',
      [{ type: 'HERO', visible: true, data: { title: 'Hero' } }],
    );

    const shell = fixture.nativeElement.querySelector('.site-theme-shell');
    expect(shell.getAttribute('data-theme')).toBe('commercial');
  });

  it('muestra layout premium en productos cuando theme es premium', async () => {
    const fixture = await create(
      {
        id: 'cfg-1',
        companyId: 'company-a',
        heroTitle: null,
        heroSubtitle: null,
        primaryColor: '#2563eb',
        logoUrl: null,
        banners: null,
        services: null,
        faq: null,
        contactPhone: null,
        contactEmail: null,
        address: null,
        updatedAt: new Date().toISOString(),
      },
      'Empresa A',
      [
        { type: 'HERO', visible: true, data: { title: 'Hero', theme: 'premium' } },
        { type: 'FEATURED_PRODUCTS', visible: true, data: { title: 'Top ventas', limit: 2 } },
      ],
      [
        { id: 'p-1', name: 'iPhone 16', slug: 'iphone-16', price: '5000000' },
        { id: 'p-2', name: 'Samsung S25', slug: 's25', price: '4600000' },
      ],
    );

    expect(fixture.nativeElement.querySelector('.premium-product-stage')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.premium-main-product')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.premium-main-product .chip')).toBeTruthy();
  });

  it('muestra layout vibrante en productos cuando theme es vibrant', async () => {
    const fixture = await create(
      {
        id: 'cfg-1',
        companyId: 'company-a',
        heroTitle: null,
        heroSubtitle: null,
        primaryColor: '#2563eb',
        logoUrl: null,
        banners: null,
        services: null,
        faq: null,
        contactPhone: null,
        contactEmail: null,
        address: null,
        updatedAt: new Date().toISOString(),
      },
      'Empresa A',
      [
        { type: 'HERO', visible: true, data: { title: 'Hero', theme: 'vibrant' } },
        { type: 'FEATURED_PRODUCTS', visible: true, data: { title: 'Top ventas', limit: 2 } },
      ],
      [
        { id: 'p-1', name: 'Moto Edge', slug: 'moto-edge', price: '2600000' },
        { id: 'p-2', name: 'Xiaomi 14', slug: 'xiaomi-14', price: '3200000' },
      ],
    );

    expect(fixture.nativeElement.querySelector('.vibrant-product-stage')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.promo-board')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.vibrant-main-product')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.vibrant-secondary-products')).toBeTruthy();
  });

  it('premium no usa grilla comercial en services, usa lista editorial', async () => {
    const fixture = await create(
      {
        id: 'cfg-1',
        companyId: 'company-a',
        heroTitle: null,
        heroSubtitle: null,
        primaryColor: '#2563eb',
        logoUrl: null,
        banners: null,
        services: null,
        faq: null,
        contactPhone: null,
        contactEmail: null,
        address: null,
        updatedAt: new Date().toISOString(),
      },
      'Empresa A',
      [
        { type: 'HERO', visible: true, data: { title: 'Hero', theme: 'premium' } },
        {
          type: 'SERVICES',
          visible: true,
          data: { title: 'Servicios', items: [{ title: 'Asesoria' }] },
        },
      ],
    );

    expect(fixture.nativeElement.querySelector('.premium-service-list')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.grid.services')).toBeFalsy();
  });

  it('vibrant usa bloques promocionales para services', async () => {
    const fixture = await create(
      {
        id: 'cfg-1',
        companyId: 'company-a',
        heroTitle: null,
        heroSubtitle: null,
        primaryColor: '#2563eb',
        logoUrl: null,
        banners: null,
        services: null,
        faq: null,
        contactPhone: null,
        contactEmail: null,
        address: null,
        updatedAt: new Date().toISOString(),
      },
      'Empresa A',
      [
        { type: 'HERO', visible: true, data: { title: 'Hero', theme: 'vibrant' } },
        {
          type: 'SERVICES',
          visible: true,
          data: { title: 'Servicios', items: [{ title: 'Asesoria' }] },
        },
      ],
    );

    expect(fixture.nativeElement.querySelector('.vibrant-service-tiles')).toBeTruthy();
  });
});
