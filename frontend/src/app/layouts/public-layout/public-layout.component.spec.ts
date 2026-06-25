import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { PublicFooterComponent } from '@shared/public/public-footer/public-footer.component';
import { PublicService } from '@core/services/public.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { PublicLayoutComponent } from './public-layout.component';

describe('PublicLayoutComponent', () => {
  let route$: Subject<ReturnType<typeof convertToParamMap>>;
  let publicService: {
    getCompany: jest.Mock;
    getOffices: jest.Mock;
    getWebsite: jest.Mock;
  };
  let configService: { getPublic: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [PublicLayoutComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: route$.asObservable() },
        },
        { provide: PublicService, useValue: publicService },
        { provide: WebsiteConfigService, useValue: configService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PublicLayoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    route$ = new Subject();
    publicService = {
      getCompany: jest.fn().mockReturnValue(
        of({ id: 'c-1', name: 'Empresa A', slug: 'empresa-a', subdomain: 'empresa-a' }),
      ),
      getOffices: jest.fn().mockReturnValue(of([])),
      getWebsite: jest.fn().mockReturnValue(
        of({
          theme: null,
          page: {
            slug: 'home',
            title: 'Inicio',
            publishedAt: new Date().toISOString(),
            sections: [],
          },
        }),
      ),
    };
    configService = {
      getPublic: jest.fn().mockReturnValue(
        of({
          id: 'cfg-1',
          companyId: 'company-a',
          heroTitle: null,
          heroSubtitle: 'WebsiteConfig subtitle',
          primaryColor: '#2563eb',
          logoUrl: null,
          banners: null,
          services: null,
          faq: null,
          contactPhone: '+573001112233',
          contactEmail: 'ventas@empresa-a.com',
          address: 'Calle 1 # 2-3',
          updatedAt: new Date().toISOString(),
        }),
      ),
    };
  });

  it('usa datos de FOOTER publicado cuando existe y está visible', async () => {
    publicService.getWebsite.mockReturnValue(
      of({
        theme: null,
        page: {
          slug: 'home',
          title: 'Inicio',
          publishedAt: new Date().toISOString(),
          sections: [
            {
              type: 'FOOTER',
              visible: true,
              data: { description: 'Footer desde snapshot', showPoweredBySalesflow: false },
            },
          ],
        },
      }),
    );

    const fixture = await create();
    route$.next(convertToParamMap({ sub: 'empresa-a' }));
    await fixture.whenStable();
    fixture.detectChanges();

    const footer = fixture.debugElement.query(By.directive(PublicFooterComponent));
    expect(footer.componentInstance.footerData).toEqual(
      expect.objectContaining({ description: 'Footer desde snapshot' }),
    );
  });

  it('deriva tema premium desde HERO publicado y lo pasa al footer', async () => {
    publicService.getWebsite.mockReturnValue(
      of({
        theme: null,
        page: {
          slug: 'home',
          title: 'Inicio',
          publishedAt: new Date().toISOString(),
          sections: [
            {
              type: 'HERO',
              visible: true,
              data: { title: 'Hero premium', theme: 'premium' },
            },
          ],
        },
      }),
    );

    const fixture = await create();
    route$.next(convertToParamMap({ sub: 'empresa-a' }));
    await fixture.whenStable();
    fixture.detectChanges();

    const footer = fixture.debugElement.query(By.directive(PublicFooterComponent));
    expect(footer.componentInstance.theme).toBe('premium');
  });

  it('usa fallback cuando no existe FOOTER publicado', async () => {
    const fixture = await create();
    route$.next(convertToParamMap({ sub: 'empresa-a' }));
    await fixture.whenStable();
    fixture.detectChanges();

    const footer = fixture.debugElement.query(By.directive(PublicFooterComponent));
    expect(footer.componentInstance.footerData).toBeNull();
  });

  it('FOOTER visible=false no reemplaza el footer real', async () => {
    publicService.getWebsite.mockReturnValue(
      of({
        theme: null,
        page: {
          slug: 'home',
          title: 'Inicio',
          publishedAt: new Date().toISOString(),
          sections: [
            {
              type: 'FOOTER',
              visible: false,
              data: { description: 'No debe aplicarse' },
            },
          ],
        },
      }),
    );

    const fixture = await create();
    route$.next(convertToParamMap({ sub: 'empresa-a' }));
    await fixture.whenStable();
    fixture.detectChanges();

    const footer = fixture.debugElement.query(By.directive(PublicFooterComponent));
    expect(footer.componentInstance.footerData).toBeNull();
  });
});
