import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Role } from '@core/constants/roles';
import { LeadStatus } from '@core/constants/lead-statuses';
import { AuthService } from '@core/auth/auth.service';
import { LeadsService } from '@core/services/leads.service';
import { OfficesService } from '@core/services/offices.service';
import { ToastService } from '@core/services/toast.service';
import { LeadsListComponent } from './leads-list.component';

describe('LeadsListComponent', () => {
  const lead = {
    id: 'lead-1',
    companyId: 'company-a',
    officeId: 'office-1',
    sellerId: 'seller-1',
    name: 'Carlos Perez',
    phone: '+573001112233',
    email: null,
    status: LeadStatus.NUEVO,
    source: 'web',
    notes: null,
    lastContactedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let leadsService: { getAll: jest.Mock };
  const officesServiceMock = { getAll: jest.fn(() => of({ items: [], total: 0 })) };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsListComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        provideRouter([]),
        MessageService,
        ToastService,
        { provide: LeadsService, useValue: leadsService },
        { provide: OfficesService, useValue: officesServiceMock },
        { provide: AuthService, useValue: { role: () => Role.ADMIN } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LeadsListComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    leadsService = { getAll: jest.fn() };
  });

  it('renderiza loading state', async () => {
    const pending$ = new Subject<unknown>();
    leadsService.getAll.mockReturnValue(pending$);

    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('renderiza empty state', async () => {
    leadsService.getAll.mockReturnValue(of({ items: [], total: 0 }));

    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Sin leads');
  });

  it('renderiza error state', async () => {
    leadsService.getAll.mockReturnValue(
      throwError(() => ({ userMessage: 'Error al cargar leads' })),
    );

    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Error al cargar leads');
  });

  it('renderiza lista con datos', async () => {
    leadsService.getAll.mockReturnValue(of({ items: [lead], total: 1 }));

    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Carlos Perez');
    expect(fixture.nativeElement.textContent).toContain('+573001112233');
  });
});
