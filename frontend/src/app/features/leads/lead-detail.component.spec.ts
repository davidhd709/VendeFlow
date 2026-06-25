import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Role } from '@core/constants/roles';
import { LeadStatus } from '@core/constants/lead-statuses';
import { AuthService } from '@core/auth/auth.service';
import { LeadsService } from '@core/services/leads.service';
import { SalesService } from '@core/services/sales.service';
import { ToastService } from '@core/services/toast.service';
import { UsersService } from '@core/services/users.service';
import { LeadDetailComponent } from './lead-detail.component';

describe('LeadDetailComponent', () => {
  const lead = {
    id: 'lead-1',
    companyId: 'company-a',
    officeId: 'office-1',
    sellerId: 'seller-1',
    name: 'Cliente Uno',
    phone: '+573001112233',
    email: null,
    status: LeadStatus.NUEVO,
    source: 'web',
    notes: null,
    lastContactedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let leadsService: {
    getById: jest.Mock;
    getFollowUps: jest.Mock;
    getComments: jest.Mock;
    getStatusHistory: jest.Mock;
    updateStatus: jest.Mock;
    addComment: jest.Mock;
    addFollowUp: jest.Mock;
    assignSeller: jest.Mock;
  };
  let salesService: { register: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock; info: jest.Mock };

  const create = async (role: Role) => {
    await TestBed.configureTestingModule({
      imports: [LeadDetailComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'lead-1' }) },
          },
        },
        { provide: AuthService, useValue: { role: () => role } },
        { provide: LeadsService, useValue: leadsService },
        { provide: SalesService, useValue: salesService },
        { provide: ToastService, useValue: toast },
        { provide: UsersService, useValue: { getSellers: jest.fn(() => of({ items: [] })) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LeadDetailComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    leadsService = {
      getById: jest.fn().mockReturnValue(of(lead)),
      getFollowUps: jest.fn().mockReturnValue(of([])),
      getComments: jest.fn().mockReturnValue(of([])),
      getStatusHistory: jest.fn().mockReturnValue(of([])),
      updateStatus: jest.fn().mockReturnValue(of({ ...lead, status: LeadStatus.CONTACTADO })),
      addComment: jest.fn().mockReturnValue(of({})),
      addFollowUp: jest.fn().mockReturnValue(of({})),
      assignSeller: jest.fn().mockReturnValue(of(lead)),
    };
    salesService = { register: jest.fn().mockReturnValue(of({ id: 'sale-1' })) };
    toast = { success: jest.fn(), error: jest.fn(), info: jest.fn() };
  });

  it('permite cambio de estado para VENDEDOR cuando la acción existe', async () => {
    const fixture = await create(Role.VENDEDOR);
    const component = fixture.componentInstance;

    component.newStatus = LeadStatus.CONTACTADO;
    component.changeStatus('lead-1');

    expect(leadsService.updateStatus).toHaveBeenCalledWith(
      'lead-1',
      LeadStatus.CONTACTADO,
    );
  });

  it('ADMIN puede registrar venta pero no cambia estado directamente', async () => {
    const fixture = await create(Role.ADMIN);
    const text = fixture.nativeElement.textContent;

    // El ADMIN puede registrar ventas
    expect(text).toContain('Registrar venta');
    // El ADMIN no ve el selector de cambio de estado (solo VENDEDOR y COORDINADOR)
    expect(text).not.toContain('Actualizar estado');
  });
});
