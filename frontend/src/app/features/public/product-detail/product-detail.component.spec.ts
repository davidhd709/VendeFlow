import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { PublicService } from '@core/services/public.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { PublicProductDetailComponent } from './product-detail.component';

describe('PublicProductDetailComponent', () => {
  let publicService: {
    getProductBySlug: jest.Mock;
    getOffices: jest.Mock;
  };
  let configService: { getPublic: jest.Mock };

  const create = async (
    params: Record<string, string> = { slug: 'iphone-14-128' },
    query: Record<string, string> = { sub: 'empresa-a' },
  ) => {
    await TestBed.configureTestingModule({
      imports: [PublicProductDetailComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(params),
              queryParamMap: convertToParamMap(query),
            },
          },
        },
        { provide: PublicService, useValue: publicService },
        { provide: WebsiteConfigService, useValue: configService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PublicProductDetailComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    publicService = {
      getProductBySlug: jest.fn().mockReturnValue(
        of({
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
        }),
      ),
      getOffices: jest.fn().mockReturnValue(
        of([
          {
            id: 'office-1',
            name: 'Sede Norte',
            city: 'Bogota',
            address: 'Calle 1',
            phone: '+573001112233',
          },
        ]),
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

  it('renderiza loading state mientras llega el producto', async () => {
    const pending$ = new Subject<unknown>();
    publicService.getProductBySlug.mockReturnValue(pending$);

    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('renderiza estado not found/error', async () => {
    publicService.getProductBySlug.mockReturnValue(
      throwError(() => ({ statusCode: 404, userMessage: 'Producto no encontrado' })),
    );
    const fixture = await create();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Este producto ya no está disponible o fue actualizado');
    expect(text).toContain('Revisa el catálogo para ver opciones similares.');
  });

  it('renderiza producto y CTA de cotizar con query product', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent;
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];
    const quote = links.find((a) =>
      a.textContent?.includes('Cotizar este equipo'),
    );

    expect(text).toContain('iPhone 14 128GB');
    expect(text).toContain('Consulta disponibilidad en tu oficina más cercana');
    expect(quote).toBeTruthy();
    expect(quote!.getAttribute('href')).toContain('/cotizar');
    expect(quote!.getAttribute('href')).toContain('product=p-1');
    expect(quote!.getAttribute('href')).not.toContain('companyId');
  });
});
