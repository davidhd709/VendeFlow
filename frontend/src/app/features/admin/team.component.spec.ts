import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Role } from '@core/constants/roles';
import { UsersService } from '@core/services/users.service';
import { ToastService } from '@core/services/toast.service';
import { AdminTeamComponent } from './team.component';

describe('AdminTeamComponent', () => {
  let usersService: {
    getAll: jest.Mock;
    getAssignedSellers: jest.Mock;
    assignSeller: jest.Mock;
    unassignSeller: jest.Mock;
  };

  const toast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTeamComponent],
      providers: [
        provideNoopAnimations(),
        { provide: UsersService, useValue: usersService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminTeamComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    usersService = {
      getAll: jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      getAssignedSellers: jest.fn().mockReturnValue(of([])),
      assignSeller: jest.fn().mockReturnValue(of({})),
      unassignSeller: jest.fn().mockReturnValue(of({})),
    };
  });

  it('no envía un limit mayor a 100 al cargar equipo', async () => {
    await create();
    expect(usersService.getAll).toHaveBeenCalledWith(1, 100);
  });

  it('muestra error amigable cuando API responde error técnico de limit', async () => {
    usersService.getAll.mockReturnValue(
      throwError(() => ({ userMessage: 'limit must not be greater than 100' })),
    );

    const fixture = await create();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain(
      'No se pudo cargar el equipo en este momento. Intenta de nuevo en unos segundos.',
    );
    expect(text).not.toContain('limit must not be greater than 100');
  });

  it('carga coordinadores correctamente cuando API responde datos', async () => {
    usersService.getAll.mockReturnValue(
      of({
        items: [
          {
            id: 'u-1',
            companyId: 'c-1',
            role: Role.COORDINADOR,
            name: 'Coord 1',
            username: 'coord1',
            email: null,
            isActive: true,
            officeId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
      }),
    );

    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Coord 1');
  });
});

