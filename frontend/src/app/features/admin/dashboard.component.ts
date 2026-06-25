import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { MessageModule } from 'primeng/message';
import { LEAD_STATUS_LABELS, LeadStatus } from '@core/constants/lead-statuses';
import { CompanyMetrics } from '@core/models/analytics.model';
import { ApiError } from '@core/models/api-error.model';
import { SetupStatus } from '@core/models/company.model';
import { AnalyticsService } from '@core/services/analytics.service';
import { CompaniesService } from '@core/services/companies.service';
import { AlertCardComponent } from '@shared/components/dashboard/alert-card.component';
import { DashboardHeaderComponent } from '@shared/components/dashboard/dashboard-header.component';
import { EmptyDashboardStateComponent } from '@shared/components/dashboard/empty-dashboard-state.component';
import { KpiCardComponent } from '@shared/components/dashboard/kpi-card.component';
import {
  RankingItem,
  RankingListComponent,
} from '@shared/components/dashboard/ranking-list.component';
import {
  StatusBreakdownItem,
  StatusBreakdownComponent,
} from '@shared/components/dashboard/status-breakdown.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    ChartModule,
    MessageModule,
    DashboardHeaderComponent,
    KpiCardComponent,
    AlertCardComponent,
    RankingListComponent,
    StatusBreakdownComponent,
    EmptyDashboardStateComponent,
    LoadingComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-dashboard-header
        eyebrow="Panel administrativo"
        title="Rendimiento comercial"
        subtitle="Consulta ventas, clientes nuevos y avance frente a la meta mensual."
        [periodLabel]="periodLabel()"
        [summary]="headerSummary()"
      />

      @if (onboardingVisible()) {
        <div class="onboarding-card">
          <div class="ob-header">
            <i class="pi pi-rocket ob-icon"></i>
            <div>
              <h3 class="ob-title">Configura tu tienda</h3>
              <p class="ob-sub text-muted">Completa estos pasos para que tus vendedores puedan operar y tus clientes puedan encontrarte.</p>
            </div>
          </div>
          <ul class="ob-list">
            @let s = setup()!;
            <li [class.done]="s.hasOffice">
              <i [class]="s.hasOffice ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
              <div class="ob-item-body">
                <span class="ob-item-label">Crear al menos una oficina</span>
                <span class="ob-item-hint text-muted">Las ventas y leads se asocian a sedes.</span>
              </div>
              @if (!s.hasOffice) {
                <a routerLink="/admin/oficinas" class="ob-action">Ir →</a>
              }
            </li>
            <li [class.done]="s.hasProduct">
              <i [class]="s.hasProduct ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
              <div class="ob-item-body">
                <span class="ob-item-label">Agregar al menos un producto</span>
                <span class="ob-item-hint text-muted">Aparecerá en tu catálogo público.</span>
              </div>
              @if (!s.hasProduct) {
                <a routerLink="/admin/productos" class="ob-action">Ir →</a>
              }
            </li>
            <li [class.done]="s.hasSeller">
              <i [class]="s.hasSeller ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
              <div class="ob-item-body">
                <span class="ob-item-label">Crear al menos un vendedor</span>
                <span class="ob-item-hint text-muted">Sin vendedores no se pueden asignar leads.</span>
              </div>
              @if (!s.hasSeller) {
                <a routerLink="/admin/usuarios" class="ob-action">Ir →</a>
              }
            </li>
            <li [class.done]="s.hasWebsiteConfig">
              <i [class]="s.hasWebsiteConfig ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
              <div class="ob-item-body">
                <span class="ob-item-label">Configurar el nombre y color de tu sitio</span>
                <span class="ob-item-hint text-muted">Personaliza cómo te ven tus clientes.</span>
              </div>
              @if (!s.hasWebsiteConfig) {
                <a routerLink="/admin/sitio-web" class="ob-action">Ir →</a>
              }
            </li>
          </ul>
          <div class="ob-progress-bar">
            <div class="ob-progress-fill" [style.width]="onboardingProgress()"></div>
          </div>
          <p class="ob-progress-label text-muted">{{ onboardingDone() }}/4 completados</p>
        </div>
      }

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (!metrics()) {
        <app-empty-dashboard-state
          icon="pi pi-chart-line"
          title="Aún no hay ventas registradas este mes"
          description="Cuando los vendedores registren ventas, veras el avance aqui."
        />
      } @else {
        @let m = metrics()!;

        <div class="sf-grid sf-grid--kpi">
          <app-kpi-card
            label="Ventas del mes"
            [value]="money(m.revenueThisMonth)"
            [context]="'Objetivo: ' + money(m.goalThisMonth)"
            icon="pi pi-wallet"
            tone="success"
          />
          <app-kpi-card
            label="Clientes nuevos"
            [value]="m.newLeadsThisMonth"
            [context]="'Total pipeline: ' + m.totalLeads"
            icon="pi pi-users"
            tone="info"
          />
          <app-kpi-card
            label="Conversion comercial"
            [value]="percent(m.conversionRate)"
            [context]="conversionContext()"
            icon="pi pi-chart-line"
            tone="info"
          />
          <app-kpi-card
            label="Meta mensual"
            [value]="money(m.goalThisMonth)"
            context="Asignada por administración"
            icon="pi pi-flag"
            tone="warn"
          />
          <app-kpi-card
            label="Avance de meta"
            [value]="goalDeltaLabel()"
            [context]="goalDeltaContext()"
            icon="pi pi-bullseye"
            [tone]="goalDeltaTone()"
          />
        </div>

        @if (managementAlerts().length) {
          <div class="section-title mt-3">Acciones recomendadas</div>
          <div class="alerts mt-3">
            @for (alert of managementAlerts(); track alert.title) {
              <app-alert-card
                [title]="alert.title"
                [description]="alert.description"
                [tone]="alert.tone"
                [icon]="alert.icon"
                [actionLabel]="alert.actionLabel"
                [actionLink]="alert.actionLink"
              />
            }
          </div>
        }

        <div class="sf-grid sf-grid--2 mt-3">
          <app-section-card
            title="Rendimiento por vendedor"
            description="Identifica quién está vendiendo más y quién requiere apoyo."
          >
            @if (m.revenueBySeller.length) {
              <p-chart type="bar" [data]="sellerChart()" [options]="barOptions" />
              <div class="mt-2">
                <app-ranking-list [items]="sellerRanking()" />
              </div>
            } @else {
              <app-empty-dashboard-state
                icon="pi pi-user-minus"
                title="Sin ventas por vendedor"
                description="Registra ventas para ver comparativos de equipo."
              />
            }
          </app-section-card>

          <app-section-card
            title="Oficinas con mayor movimiento"
            description="Compara el rendimiento comercial por sede y detecta dónde actuar."
          >
            @if (m.revenueByOffice.length) {
              <p-chart type="bar" [data]="officeChart()" [options]="barOptions" />
              <div class="mt-2">
                <app-ranking-list [items]="officeRanking()" />
              </div>
            } @else {
              <app-empty-dashboard-state
                icon="pi pi-map"
                title="Sin ventas por oficina"
                description="Activa y registra operaciones por sede para ver resultados."
              />
            }
          </app-section-card>

          <app-section-card
            title="Clientes por estado"
            description="Visualiza en qué etapa comercial se concentran tus oportunidades."
          >
            @if (m.leadStatusDistribution.length) {
              <p-chart type="doughnut" [data]="statusChart()" />
              <div class="mt-2">
                <app-status-breakdown [items]="statusBreakdownItems()" />
              </div>
            } @else {
              <app-empty-dashboard-state
                icon="pi pi-filter"
                title="Sin clientes para analizar"
                description="Todavía no hay suficientes leads para calcular conversión."
              />
            }
          </app-section-card>

          <app-section-card
            title="Productos con más interés"
            description="Equipos que más consultan tus clientes potenciales."
          >
            @if (m.topProducts.length) {
              <app-ranking-list [items]="productRanking()" />
            } @else {
              <app-empty-dashboard-state
                icon="pi pi-mobile"
                title="Sin productos con interés registrado"
                description="Crea productos y comparte tu catálogo para empezar a recibir clientes."
                actionLabel="Ver productos"
                actionLink="/admin/productos"
              />
            }
          </app-section-card>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .alerts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.65rem;
      }
      /* ── Onboarding checklist ── */
      .onboarding-card {
        background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
        border: 1px solid #bfdbfe;
        border-radius: 16px;
        padding: 1.25rem 1.5rem 1rem;
        margin-bottom: 1.5rem;
      }
      .ob-header {
        display: flex;
        gap: 0.85rem;
        align-items: flex-start;
        margin-bottom: 1rem;
      }
      .ob-icon {
        font-size: 1.4rem;
        color: var(--sf-primary);
        margin-top: 0.1rem;
        flex-shrink: 0;
      }
      .ob-title { margin: 0; font-size: 1rem; font-weight: 700; }
      .ob-sub { margin: 0.2rem 0 0; font-size: 0.85rem; }
      .ob-list {
        list-style: none;
        padding: 0;
        margin: 0 0 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .ob-list li {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.55rem 0.75rem;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        transition: border-color 0.15s;
      }
      .ob-list li.done {
        background: #f0fdf4;
        border-color: #bbf7d0;
      }
      .ob-list li i {
        font-size: 1rem;
        color: #94a3b8;
        flex-shrink: 0;
      }
      .ob-list li.done i { color: #22c55e; }
      .ob-item-body {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }
      .ob-item-label { font-size: 0.88rem; font-weight: 600; }
      .ob-item-hint  { font-size: 0.78rem; }
      .ob-list li.done .ob-item-label { text-decoration: line-through; color: var(--sf-text-muted); }
      .ob-action {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--sf-primary);
        white-space: nowrap;
        flex-shrink: 0;
      }
      .ob-action:hover { text-decoration: underline; }
      .ob-progress-bar {
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.4rem;
      }
      .ob-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #2563eb, #10b981);
        border-radius: 3px;
        transition: width 0.4s ease;
      }
      .ob-progress-label { font-size: 0.78rem; margin: 0; }
      /* ── fin onboarding ── */

      .section-title {
        font-size: 0.92rem;
        font-weight: 700;
        color: var(--sf-text);
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  private readonly analytics  = inject(AnalyticsService);
  private readonly companies  = inject(CompaniesService);
  private readonly moneyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  metrics = signal<CompanyMetrics | null>(null);
  setup   = signal<SetupStatus | null>(null);
  loading = signal(false);
  error   = signal<string | null>(null);

  onboardingDone = computed(() => {
    const s = this.setup();
    if (!s) return 0;
    return [s.hasOffice, s.hasProduct, s.hasSeller, s.hasWebsiteConfig].filter(Boolean).length;
  });

  onboardingProgress = computed(() => `${this.onboardingDone() * 25}%`);

  onboardingVisible = computed(() => {
    const s = this.setup();
    return !!s && this.onboardingDone() < 4;
  });

  barOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b' },
        grid: { color: '#e2e8f0' },
      },
      x: {
        ticks: { color: '#64748b' },
        grid: { display: false },
      },
    },
  };

  periodLabel = computed(() => {
    const p = this.metrics()?.period;
    if (!p) return 'Periodo actual';
    return `${this.monthLabel(p.month)} ${p.year}`;
  });

  headerSummary = computed(() => {
    const m = this.metrics();
    if (!m) return [];
    return [
      { label: 'Clientes', value: `${m.totalLeads}`, tone: 'info' as const },
      { label: 'Vendidos', value: `${m.soldLeads}`, tone: 'success' as const },
      { label: 'Conversión', value: this.percent(m.conversionRate), tone: 'warn' as const },
    ];
  });

  goalDelta = computed(() => {
    const m = this.metrics();
    if (!m) return 0;
    return m.revenueThisMonth - m.goalThisMonth;
  });

  goalDeltaLabel = computed(() => this.money(Math.abs(this.goalDelta())));

  goalDeltaTone = computed<'success' | 'warn' | 'danger'>(() => {
    const m = this.metrics();
    if (!m || m.goalThisMonth <= 0) return 'warn';
    if ((m.goalProgress ?? 0) >= 100) return 'success';
    if ((m.goalProgress ?? 0) >= 60) return 'warn';
    return 'danger';
  });

  goalDeltaContext = computed(() => {
    const m = this.metrics();
    if (!m || m.goalThisMonth <= 0) return 'Sin meta mensual configurada';
    if (this.goalDelta() >= 0) return `Supera meta por ${this.money(this.goalDelta())}`;
    return `Faltan ${this.money(Math.abs(this.goalDelta()))} para la meta`;
  });

  conversionContext = computed(() => {
    const m = this.metrics();
    if (!m) return 'Sin datos de conversión';
    if (!m.totalLeads) return 'Todavía no hay suficientes leads para calcular conversión.';
    return `${m.soldLeads} clientes convertidos`;
  });

  managementAlerts = computed(() => {
    const m = this.metrics();
    if (!m) return [];
    const alerts: Array<{
      title: string;
      description: string;
      tone: 'warn' | 'danger' | 'success';
      icon: string;
      actionLabel: string;
      actionLink: string;
    }> = [];

    if ((m.goalProgress ?? 0) < 60 && m.goalThisMonth > 0) {
      alerts.push({
        title: 'La meta mensual está en riesgo',
        description:
          'La meta mensual está en riesgo. Prioriza clientes interesados y seguimientos pendientes.',
        tone: 'danger',
        icon: 'pi pi-exclamation-triangle',
        actionLabel: 'Gestionar vendedores',
        actionLink: '/admin/usuarios',
      });
    }

    if (m.newLeadsThisMonth === 0) {
      alerts.push({
        title: 'Están entrando pocos clientes nuevos',
        description:
          'Comparte el catálogo y activa campañas por WhatsApp para aumentar la captación.',
        tone: 'warn',
        icon: 'pi pi-megaphone',
        actionLabel: 'Ver clientes',
        actionLink: '/admin/leads',
      });
    }

    if (m.revenueThisMonth > 0 && (m.goalProgress ?? 0) >= 100) {
      alerts.push({
        title: 'Meta cumplida',
        description:
          '¡Meta cumplida! Mantén el ritmo y revisa oportunidades de recompra.',
        tone: 'success',
        icon: 'pi pi-check-circle',
        actionLabel: 'Registrar venta',
        actionLink: '/admin/ventas',
      });
    }

    return alerts;
  });

  sellerRanking = computed<RankingItem[]>(() => {
    const m = this.metrics();
    if (!m) return [];
    return m.revenueBySeller.map((s) => ({
      label: s.sellerName,
      value: this.money(s.revenue),
      tone: 'success',
    }));
  });

  officeRanking = computed<RankingItem[]>(() => {
    const m = this.metrics();
    if (!m) return [];
    return m.revenueByOffice.map((o) => ({
      label: o.officeName,
      value: this.money(o.revenue),
      tone: 'info',
    }));
  });

  productRanking = computed<RankingItem[]>(() => {
    const m = this.metrics();
    if (!m) return [];
    return m.topProducts.map((p) => ({
      label: p.name,
      value: `${p.requests} consultas`,
      tone: 'warn',
    }));
  });

  statusBreakdownItems = computed<StatusBreakdownItem[]>(() => {
    const m = this.metrics();
    if (!m) return [];
    return m.leadStatusDistribution.map((s) => ({
      label: LEAD_STATUS_LABELS[s.status as LeadStatus] ?? s.status,
      count: s.count,
    }));
  });

  sellerChart = computed(() => {
    const m = this.metrics();
    return {
      labels: m?.revenueBySeller.map((s) => s.sellerName) ?? [],
      datasets: [
        {
          label: 'Ingresos',
          data: m?.revenueBySeller.map((s) => s.revenue) ?? [],
          backgroundColor: '#2563eb',
          borderRadius: 8,
          maxBarThickness: 32,
        },
      ],
    };
  });

  officeChart = computed(() => {
    const m = this.metrics();
    return {
      labels: m?.revenueByOffice.map((o) => o.officeName) ?? [],
      datasets: [
        {
          label: 'Ingresos',
          data: m?.revenueByOffice.map((o) => o.revenue) ?? [],
          backgroundColor: '#10b981',
          borderRadius: 8,
          maxBarThickness: 32,
        },
      ],
    };
  });

  statusChart = computed(() => {
    const m = this.metrics();
    return {
      labels:
        m?.leadStatusDistribution.map(
          (s) => LEAD_STATUS_LABELS[s.status as LeadStatus] ?? s.status,
        ) ?? [],
      datasets: [
        {
          data: m?.leadStatusDistribution.map((s) => s.count) ?? [],
          backgroundColor: [
            '#2563eb',
            '#0ea5e9',
            '#f59e0b',
            '#8b5cf6',
            '#10b981',
            '#ef4444',
            '#94a3b8',
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.analytics.company().subscribe({
      next: (m) => {
        this.metrics.set(m);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar el dashboard');
        this.loading.set(false);
      },
    });
    this.companies.getSetupStatus().subscribe({
      next: (s) => this.setup.set(s),
      error: () => {},
    });
  }

  money(amount: number): string {
    return this.moneyFormatter.format(amount ?? 0);
  }

  percent(value: number): string {
    const safe = Number.isFinite(value) ? value : 0;
    return `${Math.round(safe)}%`;
  }

  private monthLabel(month: number): string {
    const labels = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return labels[Math.max(1, Math.min(12, month)) - 1];
  }
}
