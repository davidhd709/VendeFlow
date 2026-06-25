import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AnalyticsService } from '@core/services/analytics.service';
import { VendedorDashboardComponent } from './dashboard.component';

describe('VendedorDashboardComponent', () => {
  let analytics: { me: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorDashboardComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(VendedorDashboardComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    analytics = { me: jest.fn() };
  });

  it('renderiza progreso de meta y accesos rapidos', async () => {
    analytics.me.mockReturnValue(
      of({
        period: { year: 2026, month: 5 },
        sellerId: 's-1',
        name: 'Mario',
        revenueThisMonth: 1500000,
        personalGoal: 3000000,
        goalProgress: 50,
        totalLeads: 20,
        soldLeads: 8,
        conversionRate: 40,
        leadsByStatus: [{ status: 'NUEVO', count: 5 }],
        leadsToContact: 3,
      }),
    );

    const fixture = await create();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Mi avance de meta');
    expect(text).toContain('Accesos rápidos');
    expect(text).toContain('Crear cliente');
    expect(text).toContain('Enviar campaña');
  });

  it('no muestra acciones de rutas no permitidas por rol', async () => {
    analytics.me.mockReturnValue(
      of({
        period: { year: 2026, month: 5 },
        sellerId: 's-1',
        revenueThisMonth: 0,
        personalGoal: 0,
        goalProgress: 0,
        totalLeads: 0,
        soldLeads: 0,
        conversionRate: 0,
        leadsByStatus: [],
        leadsToContact: 0,
      }),
    );

    const fixture = await create();
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    );
    const hrefs = links.map((link) => link.getAttribute('href') ?? '');

    expect(hrefs.some((href) => href.includes('/admin/'))).toBe(false);
    expect(hrefs.some((href) => href.includes('/coordinador/'))).toBe(false);
  });
});
