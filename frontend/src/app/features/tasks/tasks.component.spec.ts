import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Role } from '@core/constants/roles';
import { AuthService } from '@core/auth/auth.service';
import { TasksService } from '@core/services/tasks.service';
import { UsersService } from '@core/services/users.service';
import { ToastService } from '@core/services/toast.service';
import { TasksComponent } from './tasks.component';

const makeTask = (id: string, status: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' = 'PENDIENTE') => ({
  id,
  companyId: 'c-a',
  assignedToId: 's-1',
  createdById: 'admin-1',
  title: `Tarea ${id}`,
  description: null,
  status,
  dueDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('TasksComponent', () => {
  let tasksService: { getAll: jest.Mock; create: jest.Mock; update: jest.Mock };
  let usersService: { getAll: jest.Mock; getSellers: jest.Mock; getAssignedSellers: jest.Mock };
  let auth: { user: jest.Mock; role: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock };

  const setup = async (role: Role = Role.ADMIN) => {
    auth = {
      user: jest.fn().mockReturnValue({ id: 'u-1', role }),
      role: jest.fn().mockReturnValue(role),
    };
    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        MessageService,
        ToastService,
        { provide: TasksService, useValue: tasksService },
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TasksComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    tasksService = {
      getAll:  jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      create:  jest.fn().mockReturnValue(of(makeTask('new'))),
      update:  jest.fn().mockReturnValue(of(makeTask('t-1', 'COMPLETADA'))),
    };
    usersService = {
      getAll:              jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      getSellers:          jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      getAssignedSellers:  jest.fn().mockReturnValue(of([])),
    };
    toast = { success: jest.fn(), error: jest.fn() };
  });

  it('muestra estado de carga mientras espera respuesta', async () => {
    const pending$ = new Subject<unknown>();
    tasksService.getAll.mockReturnValue(pending$);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('muestra empty state cuando no hay tareas (ADMIN)', async () => {
    const fixture = await setup(Role.ADMIN);
    expect(fixture.nativeElement.textContent).toContain('Sin tareas');
    expect(fixture.nativeElement.textContent).toContain('Crea tareas para tu equipo');
  });

  it('muestra mensaje diferente en empty state para VENDEDOR', async () => {
    const fixture = await setup(Role.VENDEDOR);
    expect(fixture.nativeElement.textContent).toContain('No tienes tareas asignadas');
  });

  it('muestra error state cuando el servicio falla', async () => {
    tasksService.getAll.mockReturnValue(throwError(() => ({ userMessage: 'Error al cargar tareas' })));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Error al cargar tareas');
  });

  it('renderiza lista de tareas con sus datos', async () => {
    tasksService.getAll.mockReturnValue(of({ items: [makeTask('t-1'), makeTask('t-2')], total: 2 }));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Tarea t-1');
    expect(fixture.nativeElement.textContent).toContain('Tarea t-2');
  });

  it('ADMIN ve el botón "Nueva tarea"', async () => {
    const fixture = await setup(Role.ADMIN);
    const btn = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b) => (b as HTMLButtonElement).textContent?.includes('Nueva tarea'),
    );
    expect(btn).toBeTruthy();
  });

  it('COORDINADOR ve el botón "Nueva tarea"', async () => {
    const fixture = await setup(Role.COORDINADOR);
    const btn = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b) => (b as HTMLButtonElement).textContent?.includes('Nueva tarea'),
    );
    expect(btn).toBeTruthy();
  });

  it('VENDEDOR NO ve el botón "Nueva tarea"', async () => {
    const fixture = await setup(Role.VENDEDOR);
    const btn = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b) => (b as HTMLButtonElement).textContent?.includes('Nueva tarea'),
    );
    expect(btn).toBeFalsy();
  });

  it('tarea PENDIENTE muestra botones "Iniciar" y "Completar"', async () => {
    tasksService.getAll.mockReturnValue(of({ items: [makeTask('t-1', 'PENDIENTE')], total: 1 }));
    const fixture = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Iniciar');
    expect(text).toContain('Completar');
  });

  it('llama al servicio update al completar una tarea', async () => {
    tasksService.getAll.mockReturnValue(of({ items: [makeTask('t-1', 'EN_PROGRESO')], total: 1 }));
    const fixture = await setup();

    const completeBtn: HTMLButtonElement | undefined = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((b) => (b as HTMLButtonElement).textContent?.includes('Completar')) as HTMLButtonElement | undefined;

    completeBtn?.click();
    expect(tasksService.update).toHaveBeenCalledWith('t-1', { status: 'COMPLETADA' });
  });
});
