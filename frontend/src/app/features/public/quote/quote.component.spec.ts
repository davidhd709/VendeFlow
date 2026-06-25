import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PublicService } from '@core/services/public.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { PublicQuoteComponent } from './quote.component';

describe('PublicQuoteComponent', () => {
  let publicService: {
    getOffices: jest.Mock;
    getProducts: jest.Mock;
    createLead: jest.Mock;
  };
  let configService: { getPublic: jest.Mock };

  const create = async (query: Record<string, string> = { sub: 'empresa-a' }) => {
    await TestBed.configureTestingModule({
      imports: [PublicQuoteComponent],
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

    const fixture = TestBed.createComponent(PublicQuoteComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    publicService = {
      getOffices: jest.fn().mockReturnValue(
        of([
          {
            id: 'office-1',
            name: 'Sede Norte',
            city: 'Bogota',
            address: 'Calle 10 # 20-30',
            phone: '3001234567',
          },
        ]),
      ),
      getProducts: jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      createLead: jest.fn().mockReturnValue(of({ id: 'lead-1' })),
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
          contactPhone: null,
          contactEmail: null,
          address: null,
          updatedAt: new Date().toISOString(),
        }),
      ),
    };
  });

  it('valida campos requeridos (incluyendo oficina)', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.name = 'Cliente';
    component.phone = '';
    component.officeId = '';
    component.submit();
    fixture.detectChanges();

    expect(publicService.createLead).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Completa nombre, teléfono y oficina.',
    );
  });

  it('envía payload esperado sin companyId', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.name = 'Cliente Uno';
    component.phone = '+573001112233';
    component.email = 'cliente@test.com';
    component.officeId = 'office-1';
    component.notes = 'Necesita asesoria';
    component.budget = '$2.000.000';
    component.submit();
    fixture.detectChanges();

    expect(publicService.createLead).toHaveBeenCalledTimes(1);
    const payload = publicService.createLead.mock.calls[0][0];
    expect(payload).toMatchObject({
      subdomain: 'empresa-a',
      officeId: 'office-1',
      name: 'Cliente Uno',
      phone: '+573001112233',
      email: 'cliente@test.com',
    });
    expect(payload.companyId).toBeUndefined();
  });

  it('muestra estado de éxito', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.name = 'Cliente Uno';
    component.phone = '+573001112233';
    component.officeId = 'office-1';
    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Solicitud enviada');
  });

  it('muestra estado de error cuando falla createLead', async () => {
    publicService.createLead.mockReturnValue(
      throwError(() => ({ userMessage: 'No se pudo enviar la solicitud' })),
    );
    const fixture = await create();
    const component = fixture.componentInstance;

    component.name = 'Cliente Uno';
    component.phone = '+573001112233';
    component.officeId = 'office-1';
    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se pudo enviar la solicitud',
    );
  });

  it('muestra dirección y teléfono de la oficina seleccionada', async () => {
    const fixture = await create({ sub: 'empresa-a', office: 'office-1' });
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Calle 10 # 20-30');
    expect(text).toContain('3001234567');
  });
});
