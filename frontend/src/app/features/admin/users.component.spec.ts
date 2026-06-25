import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Role } from '@core/constants/roles';
import { UsersService } from '@core/services/users.service';
import { OfficesService } from '@core/services/offices.service';
import { ToastService } from '@core/services/toast.service';
import { AdminUsersComponent } from './users.component';

const makeUser = (id: string, role: Role = Role.VENDEDOR, isActive = true) => ({
  id,
  companyId: 'c-a',
  username: `user_${id}`,
  name: `Nombre ${id}`,
  email: null,
  role,
  isActive,
  officeId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('AdminUsersComponent', () => {
  let usersService: {
    getAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    resetPassword: jest.Mock;
    updateStatus: jest.Mock;
    getSellers: jest.Mock;
    getAssignedSellers: jest.Mock;
    assignSeller: jest.Mock;
    unassignSeller: jest.Mock;
    getCoordinatorOffices: jest.Mock;
    assignOffice: jest.Mock;
    unassignOffice: jest.Mock;
  };
  let officesService: { getAll: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsersComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        MessageService,
        ToastService,
        { provide: UsersService, useValue: usersService },
        { provide: OfficesService, useValue: officesService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    usersService = {
      getAll:                jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      create:                jest.fn().mockReturnValue(of(makeUser('new'))),
      update:                jest.fn().mockReturnValue(of(makeUser('u-1'))),
      resetPassword:         jest.fn().mockReturnValue(of({ success: true })),
      updateStatus:          jest.fn().mockReturnValue(of(makeUser('u-1'))),
      getSellers:            jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      getAssignedSellers:    jest.fn().mockReturnValue(of([])),
      assignSeller:          jest.fn().mockReturnValue(of({})),
      unassignSeller:        jest.fn().mockReturnValue(of({})),
      getCoordinatorOffices: jest.fn().mockReturnValue(of([])),
      assignOffice:          jest.fn().mockReturnValue(of({})),
      unassignOffice:        jest.fn().mockReturnValue(of({})),
    };
    officesService = { getAll: jest.fn().mockReturnValue(of({ items: [], total: 0 })) };
    toast = { success: jest.fn(), error: jest.fn() };
  });

  it('muestra estado de carga mientras espera', async () => {
    const pending$ = new Subject<unknown>();
    usersService.getAll.mockReturnValue(pending$);
    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('muestra empty state cuando no hay usuarios', async () => {
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Aún no has creado usuarios');
  });

  it('muestra error state cuando el servicio falla', async () => {
    usersService.getAll.mockReturnValue(throwError(() => ({ userMessage: 'Error de red' })));
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Error de red');
  });

  it('renderiza tabla con usuarios cargados', async () => {
    usersService.getAll.mockReturnValue(of({
      items: [makeUser('u-1', Role.VENDEDOR), makeUser('u-2', Role.COORDINADOR)],
      total: 2,
    }));
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Nombre u-1');
    expect(fixture.nativeElement.textContent).toContain('Nombre u-2');
  });

  it('filtra por nombre en tiempo real', async () => {
    usersService.getAll.mockReturnValue(of({ items: [], total: 0 }));
    const fixture = await create();
    const component = fixture.componentInstance;

    // Cambiar search y luego actualizar la señal users para forzar re-evaluación del computed
    component.search = 'Nombre u-1';
    component.users.set([makeUser('u-1'), makeUser('u-2')]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Nombre u-1');
    expect(text).not.toContain('Nombre u-2');
  });

  it('filtra por estado activo/inactivo', async () => {
    usersService.getAll.mockReturnValue(of({ items: [], total: 0 }));
    const fixture = await create();
    const component = fixture.componentInstance;

    // Cambiar statusFilter y luego actualizar la señal users para forzar re-evaluación del computed
    component.statusFilter = 'active';
    component.users.set([
      makeUser('u-activo', Role.VENDEDOR, true),
      makeUser('u-inactivo', Role.VENDEDOR, false),
    ]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Nombre u-activo');
    expect(text).not.toContain('Nombre u-inactivo');
  });

  it('abre modal de nuevo usuario al hacer clic en "Nuevo usuario"', async () => {
    const fixture = await create();
    const btn: HTMLButtonElement | undefined = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((b) => (b as HTMLButtonElement).textContent?.includes('Nuevo usuario')) as HTMLButtonElement | undefined;

    btn?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.newDialog).toBe(true);
    expect(document.body.textContent).toContain('Nuevo usuario');
  });

  it('abre modal de edición al hacer clic en "Editar usuario"', async () => {
    usersService.getAll.mockReturnValue(of({ items: [makeUser('u-1')], total: 1 }));
    const fixture = await create();
    const component = fixture.componentInstance;

    const user = makeUser('u-1');
    component.openEdit(user);
    fixture.detectChanges();

    expect(component.editDialog).toBe(true);
    expect(component.editTarget()).toEqual(user);
  });
});
