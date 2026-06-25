import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Role } from '@core/constants/roles';
import { AuthService } from '@core/auth/auth.service';
import { GoalsService } from '@core/services/goals.service';
import { UsersService } from '@core/services/users.service';
import { ToastService } from '@core/services/toast.service';
import { AdminGoalsComponent } from './goals.component';

const makeGoal = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  companyId: 'c-a',
  year: 2026,
  month: 6,
  targetAmount: '5000000',
  targetSales: 10,
  actualAmount: 2500000,
  actualSales: 5,
  progress: 50,
  userId: null,
  officeId: null,
  userName: null,
  officeName: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('AdminGoalsComponent', () => {
  let goalsService: { getAll: jest.Mock; create: jest.Mock; update: jest.Mock };
  let usersService: { getSellers: jest.Mock };
  let auth: { user: jest.Mock; role: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock };

  const setup = async (role: Role = Role.ADMIN) => {
    auth = {
      user: jest.fn().mockReturnValue({ id: 'u-1', role }),
      role: jest.fn().mockReturnValue(role),
    };
    await TestBed.configureTestingModule({
      imports: [AdminGoalsComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        MessageService,
        ToastService,
        { provide: GoalsService, useValue: goalsService },
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminGoalsComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    goalsService = {
      getAll:  jest.fn().mockReturnValue(of([])),
      create:  jest.fn().mockReturnValue(of(makeGoal('new'))),
      update:  jest.fn().mockReturnValue(of(makeGoal('g-1'))),
    };
    usersService = { getSellers: jest.fn().mockReturnValue(of({ items: [], total: 0 })) };
    toast = { success: jest.fn(), error: jest.fn() };
  });

  it('muestra estado de carga mientras espera respuesta', async () => {
    const pending$ = new Subject<unknown>();
    goalsService.getAll.mockReturnValue(pending$);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('muestra empty state cuando no hay metas', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Sin metas para este periodo');
  });

  it('muestra error state cuando el servicio falla', async () => {
    goalsService.getAll.mockReturnValue(throwError(() => ({ userMessage: 'Sin conexión' })));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Sin conexión');
  });

  it('renderiza tarjetas de metas con los datos correctos', async () => {
    goalsService.getAll.mockReturnValue(of([
      makeGoal('g-1', { userName: 'Carlos López', progress: 75 }),
      makeGoal('g-2', { userName: null, progress: 50 }),
    ]));
    const fixture = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Carlos López');
    expect(text).toContain('Empresa');
    expect(text).toContain('75% completado');
  });

  it('ADMIN ve el botón "Nueva meta" y puede abrir el modal', async () => {
    const fixture = await setup(Role.ADMIN);
    const btn: HTMLButtonElement | undefined = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((b) => (b as HTMLButtonElement).textContent?.includes('Nueva meta')) as HTMLButtonElement | undefined;

    expect(btn).toBeTruthy();
    btn?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.createDialog).toBe(true);
  });

  it('COORDINADOR NO ve el botón "Nueva meta"', async () => {
    const fixture = await setup(Role.COORDINADOR);
    const btn = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b) => (b as HTMLButtonElement).textContent?.includes('Nueva meta'),
    );
    expect(btn).toBeFalsy();
  });

  it('muestra porcentaje completado de manera segura para valores fuera de rango', async () => {
    goalsService.getAll.mockReturnValue(of([
      makeGoal('g-over', { progress: 150 }),
    ]));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('100% completado');
  });
});
