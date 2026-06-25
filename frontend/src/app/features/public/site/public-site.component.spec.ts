import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { PublicService } from '@core/services/public.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { PublicSiteComponent } from './public-site.component';

describe('PublicSiteComponent', () => {
  let publicService: {
    getCompany: jest.Mock;
    getProducts: jest.Mock;
    getOffices: jest.Mock;
    getWebsite: jest.Mock;
  };
  let configService: { getPublic: jest.Mock };

  const create = async (query: Record<string, string> = { sub: 'empresa-a' }) => {
    await TestBed.configureTestingModule({
      imports: [PublicSiteComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(query) },
          },
        },
        { provide: PublicService, useValue: publicService },
        { provide: WebsiteConfigService, useValue: configService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PublicSiteComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    publicService = {
      getCompany: jest.fn().mockReturnValue(
        of({
          id: 'company-a',
          name: 'Empresa A',
          slug: 'empresa-a',
          subdomain: 'empresa-a',
        }),
      ),
      getProducts: jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      getOffices: jest.fn().mockReturnValue(of([])),
      getWebsite: jest.fn().mockReturnValue(
        of({
          theme: {
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
          },
          page: null,
        }),
      ),
    };
    configService = {
      getPublic: jest.fn().mockReturnValue(
        of({
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
        }),
      ),
    };
  });

  it('renderiza loading mientras el endpoint público del sitio no responde', async () => {
    const pending$ = new Subject<unknown>();
    publicService.getWebsite.mockReturnValue(pending$);

    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('renderiza estado empty cuando no llega subdominio', async () => {
    const fixture = await create({});
    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos cargar la información en este momento',
    );
  });

  it('consume /public/website/:subdomain y renderiza publishedSnapshot', async () => {
    publicService.getWebsite.mockReturnValue(
      of({
        theme: {
          id: 'cfg-1',
          companyId: 'company-a',
          heroTitle: 'Hero Theme',
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
        page: {
          slug: 'home',
          title: 'Inicio',
          publishedAt: new Date().toISOString(),
          sections: [
            {
              type: 'HERO',
              visible: true,
              data: { title: 'Hero Publicado' },
            },
            {
              type: 'SERVICES',
              visible: true,
              data: {
                items: [{ title: 'Servicio Publicado', description: 'Detalle' }],
              },
            },
            {
              type: 'FAQ',
              visible: false,
              data: { items: [{ question: 'FAQ OCULTA', answer: 'No ver' }] },
            },
            {
              type: 'FAQ',
              visible: true,
              data: { items: [{ question: 'FAQ Visible', answer: 'Sí ver' }] },
            },
          ],
        },
      }),
    );

    const fixture = await create();
    const text = fixture.nativeElement.textContent;
    expect(publicService.getWebsite).toHaveBeenCalledWith('empresa-a');
    expect(text).toContain('Hero Publicado');
    expect(text).toContain('Servicio Publicado');
    expect(text).toContain('FAQ Visible');
    expect(text).not.toContain('FAQ OCULTA');
  });

  it('usa fallback WebsiteConfig si no hay publishedSnapshot', async () => {
    publicService.getWebsite.mockReturnValue(
      of({
        theme: {
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
        },
        page: null,
      }),
    );

    const fixture = await create();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Celulares nuevos');
  });

  it('si /public/website falla, conserva fallback con WebsiteConfig', async () => {
    publicService.getWebsite.mockReturnValue(throwError(() => ({ status: 500 })));
    configService.getPublic.mockReturnValue(
      of({
        id: 'cfg-2',
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
      }),
    );

    const fixture = await create();
    expect(configService.getPublic).toHaveBeenCalledWith('empresa-a');
    expect(fixture.nativeElement.textContent).toContain('Celulares nuevos');
  });
});
