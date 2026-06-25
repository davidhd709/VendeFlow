import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, computed } from '@angular/core';
import { of, throwError } from 'rxjs';
import { DashboardLayoutComponent } from './dashboard-layout.component';
import { AuthService } from '@core/auth/auth.service';
import { AlertsService } from '@core/services/alerts.service';
import { UsersService } from '@core/services/users.service';
import { Role } from '@core/constants/roles';

function makeAuthMock(role: Role | null = null, name = '') {
  const userSig = signal<{ name: string; role: Role } | null>(
    role ? { name, role } : null,
  );
  const companyId = signal<string | null>('company-1');
  const companyName = signal<string | null>('Tienda Test');
  return {
    role: computed(() => userSig()?.role ?? null),
    user: userSig.asReadonly(),
    companyId: companyId.asReadonly(),
    companyName: companyName.asReadonly(),
    logout: jest.fn(() => of(undefined as void)),
  };
}

describe('DashboardLayoutComponent', () => {
  let alertsMock: { getAll: jest.Mock };
  let usersMock: { changeMyPassword: jest.Mock };
  let routerMock: { url: string; events: any; navigate: jest.Mock; navigateByUrl: jest.Mock };

  const setup = async (role: Role | null = Role.ADMIN, name = 'Ana López') => {
    const authMock = makeAuthMock(role, name);
    alertsMock = { getAll: jest.fn(() => of([])) };
    usersMock = { changeMyPassword: jest.fn(() => of({})) };
    routerMock = {
      url: '/admin/dashboard',
      events: of(),
      navigate: jest.fn(),
      navigateByUrl: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: AlertsService, useValue: alertsMock },
        { provide: UsersService, useValue: usersMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardLayoutComponent);
    fixture.detectChanges();
    return { fixture, authMock };
  };

  describe('initials()', () => {
    it('toma las primeras letras de dos palabras', async () => {
      const { fixture } = await setup(Role.ADMIN, 'Ana López');
      expect(fixture.componentInstance.initials()).toBe('AL');
    });

    it('usa solo la primera inicial con un nombre de una palabra', async () => {
      const { fixture } = await setup(Role.ADMIN, 'Carlos');
      expect(fixture.componentInstance.initials()).toBe('C');
    });

    it('retorna vacío cuando user es null', async () => {
      const { fixture } = await setup(null, '');
      expect(fixture.componentInstance.initials()).toBe('');
    });
  });

  describe('roleLabel()', () => {
    it('ADMIN → Administrador', async () => {
      const { fixture } = await setup(Role.ADMIN);
      expect(fixture.componentInstance.roleLabel()).toBe('Administrador');
    });

    it('VENDEDOR → Vendedor', async () => {
      const { fixture } = await setup(Role.VENDEDOR);
      expect(fixture.componentInstance.roleLabel()).toBe('Vendedor');
    });

    it('SUPERADMIN → Super Admin', async () => {
      const { fixture } = await setup(Role.SUPERADMIN);
      expect(fixture.componentInstance.roleLabel()).toMatch(/super/i);
    });

    it('null → cadena vacía', async () => {
      const { fixture } = await setup(null);
      expect(fixture.componentInstance.roleLabel()).toBe('');
    });
  });

  describe('groupedNav()', () => {
    it('ADMIN genera grupos con items agrupados', async () => {
      const { fixture } = await setup(Role.ADMIN);
      const groups = fixture.componentInstance.groupedNav();
      const titles = groups.map((g) => g.title);
      expect(titles).toContain('Comercial');
      expect(titles).toContain('Equipo');
    });

    it('VENDEDOR devuelve ítems sin grupos (título vacío)', async () => {
      const { fixture } = await setup(Role.VENDEDOR);
      const groups = fixture.componentInstance.groupedNav();
      expect(groups.every((g) => g.title === '')).toBe(true);
    });

    it('ADMIN tiene 13 ítems de navegación en total', async () => {
      const { fixture } = await setup(Role.ADMIN);
      const total = fixture.componentInstance
        .groupedNav()
        .reduce((sum, g) => sum + g.items.length, 0);
      expect(total).toBe(13);
    });

    it('VENDEDOR tiene 5 ítems de navegación', async () => {
      const { fixture } = await setup(Role.VENDEDOR);
      const total = fixture.componentInstance
        .groupedNav()
        .reduce((sum, g) => sum + g.items.length, 0);
      expect(total).toBe(5);
    });

    it('null devuelve arreglo vacío de grupos', async () => {
      const { fixture } = await setup(null);
      expect(fixture.componentInstance.groupedNav()).toHaveLength(0);
    });
  });

  describe('alertCount()', () => {
    it('es 0 cuando alerts está vacío', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance.alertCount()).toBe(0);
    });

    it('refleja el número de alertas cargadas', async () => {
      const ALERTS = [
        { id: '1', type: 'STALE_LEAD', leadId: 'l1', message: 'msg' },
        { id: '2', type: 'OVERDUE_TASK', leadId: 'l2', message: 'msg2' },
      ];
      const { fixture } = await setup();
      // Inyectar alertas manualmente (simula lo que haría ngOnInit con el mock)
      fixture.componentInstance.alerts.set(ALERTS as any);
      fixture.detectChanges();
      expect(fixture.componentInstance.alertCount()).toBe(2);
    });
  });

  describe('alertLeadPath()', () => {
    it('ADMIN genera la ruta /admin/leads/:leadId', async () => {
      const { fixture } = await setup(Role.ADMIN);
      const path = fixture.componentInstance.alertLeadPath({
        id: 'a1',
        type: 'STALE_LEAD',
        leadId: 'lead-99',
        message: 'msg',
      });
      expect(path).toBe('/admin/leads/lead-99');
    });

    it('VENDEDOR genera la ruta /vendedor/leads/:leadId', async () => {
      const { fixture } = await setup(Role.VENDEDOR);
      const path = fixture.componentInstance.alertLeadPath({
        id: 'a2',
        type: 'OVERDUE_TASK',
        leadId: 'lead-42',
        message: 'msg',
      });
      expect(path).toBe('/vendedor/leads/lead-42');
    });
  });

  describe('toggle()', () => {
    it('alterna collapsed', async () => {
      const { fixture } = await setup();
      const initial = fixture.componentInstance.collapsed();
      fixture.componentInstance.toggle();
      expect(fixture.componentInstance.collapsed()).toBe(!initial);
    });
  });

  describe('openPwDialog()', () => {
    it('abre el diálogo y limpia los campos', async () => {
      const { fixture } = await setup();
      const comp = fixture.componentInstance;
      comp.pwCurrent = 'old';
      comp.pwNew = 'new';
      comp.pwConfirm = 'new';
      comp.openPwDialog();
      expect(comp.pwDialog).toBe(true);
      expect(comp.pwCurrent).toBe('');
      expect(comp.pwNew).toBe('');
      expect(comp.pwConfirm).toBe('');
      expect(comp.pwError()).toBeNull();
    });
  });

  describe('savePassword()', () => {
    it('muestra error si falta contraseña actual', async () => {
      const { fixture } = await setup();
      const comp = fixture.componentInstance;
      comp.pwCurrent = '';
      comp.pwNew = 'nueva123';
      comp.pwConfirm = 'nueva123';
      comp.savePassword();
      expect(comp.pwError()).toContain('actual');
    });

    it('muestra error si la nueva tiene menos de 6 caracteres', async () => {
      const { fixture } = await setup();
      const comp = fixture.componentInstance;
      comp.pwCurrent = 'actual';
      comp.pwNew = '123';
      comp.pwConfirm = '123';
      comp.savePassword();
      expect(comp.pwError()).toContain('6');
    });

    it('muestra error si las contraseñas no coinciden', async () => {
      const { fixture } = await setup();
      const comp = fixture.componentInstance;
      comp.pwCurrent = 'actual';
      comp.pwNew = 'nueva123';
      comp.pwConfirm = 'diferente';
      comp.savePassword();
      expect(comp.pwError()).toContain('coinciden');
    });

    it('llama changeMyPassword y cierra el diálogo en éxito', async () => {
      const { fixture } = await setup();
      const comp = fixture.componentInstance;
      comp.pwCurrent = 'actual';
      comp.pwNew = 'nueva123';
      comp.pwConfirm = 'nueva123';
      comp.savePassword();
      // of() es síncrono, el subscribe completa inmediatamente
      expect(usersMock.changeMyPassword).toHaveBeenCalledWith('actual', 'nueva123');
      expect(comp.pwDialog).toBe(false);
      expect(comp.pwSaving()).toBe(false);
    });

    it('muestra userMessage del servidor en caso de error', async () => {
      const { fixture } = await setup();
      usersMock.changeMyPassword = jest.fn(() =>
        throwError(() => ({ userMessage: 'Contraseña incorrecta' })),
      );
      const comp = fixture.componentInstance;
      comp.pwCurrent = 'actual';
      comp.pwNew = 'nueva123';
      comp.pwConfirm = 'nueva123';
      comp.savePassword();
      expect(comp.pwError()).toBe('Contraseña incorrecta');
    });
  });

  describe('ngOnInit()', () => {
    it('carga alertas para ADMIN', async () => {
      await setup(Role.ADMIN);
      expect(alertsMock.getAll).toHaveBeenCalled();
    });

    it('no carga alertas para SUPERADMIN', async () => {
      await setup(Role.SUPERADMIN);
      expect(alertsMock.getAll).not.toHaveBeenCalled();
    });
  });
});
