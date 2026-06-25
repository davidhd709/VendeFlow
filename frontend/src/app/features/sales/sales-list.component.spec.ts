import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Role } from '@core/constants/roles';
import { AuthService } from '@core/auth/auth.service';
import { SalesService } from '@core/services/sales.service';
import { UsersService } from '@core/services/users.service';
import { ToastService } from '@core/services/toast.service';
import { SalesListComponent } from './sales-list.component';

const makeSale = (id: string) => ({
  id,
  companyId: 'c-a',
  leadId: 'l-1',
  sellerId: 's-1',
  officeId: 'o-1',
  amount: '1500000',
  saleDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lead: { name: 'Cliente Test', phone: '+573001112233' },
  seller: { name: 'Vendedor Uno' },
  office: { name: 'Oficina Norte' },
});

describe('SalesListComponent', () => {
  let salesService: { getAll: jest.Mock };
  let usersService: { getSellers: jest.Mock };
  let auth: { user: jest.Mock; role: jest.Mock };

  const setup = async (role: Role = Role.ADMIN) => {
    auth = {
      user: jest.fn().mockReturnValue({ id: 'u-1', role }),
      role: jest.fn().mockReturnValue(role),
    };
    await TestBed.configureTestingModule({
      imports: [SalesListComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        MessageService,
        ToastService,
        { provide: SalesService, useValue: salesService },
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SalesListComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    salesService = { getAll: jest.fn().mockReturnValue(of({ items: [], total: 0 })) };
    usersService = { getSellers: jest.fn().mockReturnValue(of({ items: [], total: 0 })) };
  });

  it('muestra estado de carga mientras espera respuesta', async () => {
    const pending$ = new Subject<unknown>();
    salesService.getAll.mockReturnValue(pending$);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('muestra empty state cuando no hay ventas', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Sin ventas para este filtro');
  });

  it('muestra error state cuando el servicio falla', async () => {
    salesService.getAll.mockReturnValue(throwError(() => ({ userMessage: 'Error al cargar ventas' })));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Error al cargar ventas');
  });

  it('renderiza datos de ventas en la tabla', async () => {
    salesService.getAll.mockReturnValue(of({ items: [makeSale('s-1')], total: 1 }));
    const fixture = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Cliente Test');
    expect(text).toContain('Vendedor Uno');
    expect(text).toContain('Oficina Norte');
  });

  it('muestra KPIs con totales calculados', async () => {
    salesService.getAll.mockReturnValue(of({
      items: [makeSale('s-1'), makeSale('s-2')],
      total: 2,
    }));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('2 ventas en total');
  });

  it('ADMIN ve filtro de vendedor', async () => {
    const fixture = await setup(Role.ADMIN);
    fixture.detectChanges();
    expect(fixture.componentInstance.canFilterBySeller()).toBe(true);
  });

  it('VENDEDOR NO ve filtro de vendedor', async () => {
    const fixture = await setup(Role.VENDEDOR);
    fixture.detectChanges();
    expect(fixture.componentInstance.canFilterBySeller()).toBe(false);
  });
});
