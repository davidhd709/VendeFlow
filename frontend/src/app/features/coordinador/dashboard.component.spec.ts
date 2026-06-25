import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '@core/services/analytics.service';
import { CoordinadorDashboardComponent } from './dashboard.component';

describe('CoordinadorDashboardComponent', () => {
  let analytics: { coordinator: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinadorDashboardComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CoordinadorDashboardComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    analytics = { coordinator: jest.fn() };
  });

  it('renderiza alertas y listas vacias sin romper', async () => {
    analytics.coordinator.mockReturnValue(
      of({
        sellers: [],
        staleLeads: [],
        overdueTasks: 0,
      }),
    );

    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Sin vendedores asignados');
    expect(fixture.nativeElement.textContent).toContain('No hay tareas vencidas');
  });

  it('renderiza leads en riesgo y CTA de gestion', async () => {
    analytics.coordinator.mockReturnValue(
      of({
        sellers: [
          {
            period: { year: 2026, month: 5 },
            sellerId: 's-1',
            name: 'Luisa',
            revenueThisMonth: 700000,
            personalGoal: 1000000,
            goalProgress: 70,
            totalLeads: 12,
            soldLeads: 4,
            conversionRate: 33,
            leadsByStatus: [],
            leadsToContact: 2,
          },
        ],
        staleLeads: [
          {
            id: 'l-1',
            name: 'Carlos',
            phone: '+573001112233',
            status: 'NUEVO',
            lastContactedAt: null,
            sellerId: 's-1',
          },
        ],
        overdueTasks: 2,
      }),
    );

    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Clientes sin seguimiento');
    expect(fixture.nativeElement.textContent).toContain('Ver cliente');
    expect(fixture.nativeElement.textContent).toContain('Carlos');
  });
});
