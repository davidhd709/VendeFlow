import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { AuditService } from '@core/services/audit.service';
import { AdminAuditComponent } from './audit.component';

const makeLog = (id: string, action = 'sale.registered') => ({
  id,
  companyId: 'c-a',
  actorId: 'u-1',
  actorRole: 'ADMIN',
  action,
  targetId: 'target-1',
  targetType: 'Sale',
  ip: '127.0.0.1',
  createdAt: new Date().toISOString(),
  actor: { id: 'u-1', name: 'Admin Ejemplo' },
});

describe('AdminAuditComponent', () => {
  let auditService: { getAll: jest.Mock };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAuditComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: AuditService, useValue: auditService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminAuditComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    auditService = {
      getAll: jest.fn().mockReturnValue(of({ items: [], total: 0 })),
    };
  });

  it('muestra estado de carga mientras espera la respuesta', async () => {
    auditService.getAll.mockReturnValue(new Subject());
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('muestra empty state cuando no hay eventos para el filtro', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Sin eventos para este filtro');
  });

  it('muestra error state cuando el servicio falla', async () => {
    auditService.getAll.mockReturnValue(throwError(() => ({ userMessage: 'Error de conexión' })));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Error de conexión');
  });

  it('renderiza tabla con los eventos de auditoría', async () => {
    auditService.getAll.mockReturnValue(of({
      items: [makeLog('log-1', 'sale.registered'), makeLog('log-2', 'user.created')],
      total: 2,
    }));
    const fixture = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Admin Ejemplo');
    expect(text).toContain('2 eventos');
  });

  it('actionLabel traduce acciones conocidas al español', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    expect(component.actionLabel('sale.registered')).toBe('Venta registrada');
    expect(component.actionLabel('user.created')).toBe('Usuario creado');
    expect(component.actionLabel('goal.set')).toBe('Meta creada');
  });

  it('actionLabel devuelve la clave original para acciones desconocidas', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    expect(component.actionLabel('unknown.action')).toBe('unknown.action');
  });

  it('clearFilters limpia todos los filtros y recarga', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.actionFilter = 'sale';
    component.typeFilter = 'Sale';
    component.dateFrom = '2026-01-01';
    component.dateTo = '2026-12-31';

    component.clearFilters();

    expect(component.actionFilter).toBe('');
    expect(component.typeFilter).toBe('');
    expect(component.dateFrom).toBe('');
    expect(component.dateTo).toBe('');
    expect(auditService.getAll).toHaveBeenCalledTimes(2);
  });

  it('onPage actualiza la página y recarga los datos', async () => {
    auditService.getAll.mockReturnValue(of({ items: [makeLog('log-1')], total: 45 }));
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.onPage({ first: 20, rows: 20 });

    expect(auditService.getAll).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, limit: 20 }),
    );
  });

  it('load reinicia la página a 1 y recarga', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.page = 3;
    component.load();

    expect(component.page).toBe(1);
    expect(auditService.getAll).toHaveBeenCalledTimes(2);
  });
});
