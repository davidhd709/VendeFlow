import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PublicService } from '@core/services/public.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { PublicCatalogComponent } from './catalog.component';

describe('PublicCatalogComponent', () => {
  let publicService: { getProducts: jest.Mock };
  let configService: { getPublic: jest.Mock };

  const create = async (query: Record<string, string> = { sub: 'empresa-a' }) => {
    await TestBed.configureTestingModule({
      imports: [PublicCatalogComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
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

    const fixture = TestBed.createComponent(PublicCatalogComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    publicService = {
      getProducts: jest.fn().mockReturnValue(
        of({
          items: [
            {
              id: 'p-1',
              companyId: 'company-a',
              name: 'iPhone 14 128GB',
              slug: 'iphone-14-128',
              description: 'Equipo excelente',
              brand: 'Apple',
              model: 'iPhone 14',
              ram: '6GB',
              storage: '128GB',
              color: 'Azul',
              condition: 'NUEVO',
              warranty: '12 meses',
              price: '3500000',
              imageUrl: null,
              images: [],
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
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
          primaryColor: '#2563eb',
          logoUrl: null,
          banners: null,
          services: null,
          faq: null,
          contactPhone: '+573001112233',
          contactEmail: null,
          address: null,
          updatedAt: new Date().toISOString(),
        }),
      ),
    };
  });

  it('navega a /catalogo/:slug desde el botón Ver detalle', async () => {
    const fixture = await create();
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];
    const detail = links.find((a) => a.textContent?.includes('Ver detalle'));

    expect(detail).toBeTruthy();
    expect(detail!.getAttribute('href')).toContain('/catalogo/iphone-14-128');
  });
});
