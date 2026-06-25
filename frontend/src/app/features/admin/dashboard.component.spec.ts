import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AnalyticsService } from '@core/services/analytics.service';
import { AdminDashboardComponent } from './dashboard.component';

describe('AdminDashboardComponent', () => {
  let analytics: { company: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    analytics = { company: jest.fn() };
  });

  it('renderiza loading state', async () => {
    analytics.company.mockReturnValue(new Subject());
    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('renderiza error state', async () => {
    analytics.company.mockReturnValue(throwError(() => ({ userMessage: 'Error dashboard' })));
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Error dashboard');
  });

  it('renderiza empty state', async () => {
    analytics.company.mockReturnValue(of(null));
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay ventas registradas este mes');
  });

  it('renderiza data state', async () => {
    analytics.company.mockReturnValue(
      of({
        period: { year: 2026, month: 5 },
        revenueThisMonth: 1000000,
        goalThisMonth: 2000000,
        goalProgress: 50,
        newLeadsThisMonth: 10,
        totalLeads: 20,
        soldLeads: 5,
        conversionRate: 25,
        leadStatusDistribution: [{ status: 'NUEVO', count: 10 }],
        revenueByOffice: [{ officeId: 'o-1', officeName: 'Centro', revenue: 600000 }],
        revenueBySeller: [{ sellerId: 's-1', sellerName: 'Ana', revenue: 700000 }],
        topProducts: [{ productId: 'p-1', name: 'iPhone', requests: 12 }],
      }),
    );
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Rendimiento comercial');
    expect(fixture.nativeElement.textContent).toContain('Rendimiento por vendedor');
    expect(fixture.nativeElement.textContent).toContain('Productos con más interés');
  });
});
