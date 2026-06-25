import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CampaignsService } from '@core/services/campaigns.service';
import { LeadsService } from '@core/services/leads.service';
import { TemplatesService } from '@core/services/templates.service';
import { ToastService } from '@core/services/toast.service';
import { VendedorCampaignsComponent } from './campaigns.component';

describe('VendedorCampaignsComponent', () => {
  const leads = Array.from({ length: 11 }, (_, i) => ({
    id: `lead-${i + 1}`,
    companyId: 'company-a',
    officeId: 'office-1',
    sellerId: 'seller-1',
    name: `Lead ${i + 1}`,
    phone: `+5730011100${i + 1}`,
    email: null,
    status: 'NUEVO',
    source: 'web',
    notes: null,
    lastContactedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  let campaignsService: { getAll: jest.Mock; create: jest.Mock };
  let templatesService: { getAll: jest.Mock };
  let leadsService: { getAll: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock; info: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorCampaignsComponent],
      providers: [
        provideNoopAnimations(),
        { provide: CampaignsService, useValue: campaignsService },
        { provide: TemplatesService, useValue: templatesService },
        { provide: LeadsService, useValue: leadsService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(VendedorCampaignsComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    campaignsService = {
      getAll: jest.fn().mockReturnValue(
        of({
          items: [
            {
              id: 'camp-1',
              name: 'Campana Mayo',
              message: 'Hola',
              status: 'ENVIADA',
              sentAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              recipientCount: 2,
            },
          ],
          total: 1,
        }),
      ),
      create: jest.fn().mockReturnValue(
        of({
          id: 'camp-2',
          name: 'Campana nueva',
          message: 'Hola {nombre}',
          status: 'ENVIADA',
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          recipients: [
            {
              id: 'rec-1',
              name: 'Lead 1',
              phone: '+57300111001',
              waLink: 'https://wa.me/57300111001?text=Hola',
            },
          ],
        }),
      ),
    };
    templatesService = { getAll: jest.fn().mockReturnValue(of([])) };
    leadsService = { getAll: jest.fn().mockReturnValue(of({ items: leads, total: 11 })) };
    toast = { success: jest.fn(), error: jest.fn(), info: jest.fn() };
  });

  it('renderiza clientes disponibles y el historial si existe', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Lead 1');
    expect(text).toContain('Historial');
    expect(text).toContain('Campana Mayo');
  });

  it('bloquea visualmente seleccionar más de 10 leads', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    for (let i = 1; i <= 10; i += 1) {
      component.toggle(`lead-${i}`);
    }
    fixture.detectChanges();

    const checkboxes: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="checkbox"]'),
    );
    expect(checkboxes[10].disabled).toBe(true);
  });

  it('renderiza links wa.me devueltos por API', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.name = 'Campana nueva';
    component.message = 'Hola {nombre}';
    component.toggle('lead-1');
    component.create();
    fixture.detectChanges();

    const waLink: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a[href*="wa.me"]');
    expect(waLink).toBeTruthy();
    expect(waLink?.getAttribute('href')).toContain('https://wa.me/');
  });
});
