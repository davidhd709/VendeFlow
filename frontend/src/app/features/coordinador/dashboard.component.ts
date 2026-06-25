import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { LEAD_STATUS_LABELS, LeadStatus } from '@core/constants/lead-statuses';
import { CoordinatorMetrics } from '@core/models/analytics.model';
import { ApiError } from '@core/models/api-error.model';
import { AnalyticsService } from '@core/services/analytics.service';
import { AlertCardComponent } from '@shared/components/dashboard/alert-card.component';
import { DashboardHeaderComponent } from '@shared/components/dashboard/dashboard-header.component';
import { EmptyDashboardStateComponent } from '@shared/components/dashboard/empty-dashboard-state.component';
import { KpiCardComponent } from '@shared/components/dashboard/kpi-card.component';
import {
  RankingItem,
  RankingListComponent,
} from '@shared/components/dashboard/ranking-list.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

@Component({
  selector: 'app-coordinador-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MessageModule,
    TableModule,
    DashboardHeaderComponent,
    KpiCardComponent,
    AlertCardComponent,
    RankingListComponent,
    EmptyDashboardStateComponent,
    LoadingComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-dashboard-header
        eyebrow="Panel coordinador"
        title="Seguimiento comercial del equipo"
        subtitle="Detecta clientes sin seguimiento, tareas vencidas y vendedores que necesitan apoyo."
        periodLabel="Vista operativa actual"
        [summary]="headerSummary()"
      />

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (!metrics()) {
        <app-empty-dashboard-state
          icon="pi pi-sitemap"
          title="Sin información del equipo"
          description="Cuando tus vendedores gestionen clientes, veras aqui su avance."
        />
      } @else {
        @let m = metrics()!;

        <div class="sf-grid sf-grid--kpi">
          <app-kpi-card
            label="Clientes sin seguimiento"
            [value]="m.staleLeads.length"
            context="Requieren gestión hoy"
            icon="pi pi-exclamation-triangle"
            tone="danger"
          />
          <app-kpi-card
            label="Tareas vencidas"
            [value]="m.overdueTasks"
            context="Pendientes de cerrar"
            icon="pi pi-clock"
            tone="warn"
          />
          <app-kpi-card
            label="Ventas del equipo"
            [value]="money(teamRevenue())"
            [context]="teamSoldLeads() + ' ventas cerradas'"
            icon="pi pi-wallet"
            tone="success"
          />
          <app-kpi-card
            label="Conversión del equipo"
            [value]="percent(teamConversion())"
            [context]="teamTotalLeads() + ' clientes totales'"
            icon="pi pi-chart-line"
            tone="info"
          />
        </div>

        <div class="alerts mt-3">
          @for (alert of teamAlerts(); track alert.title) {
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

        <div class="sf-grid sf-grid--2 mt-3">
          <app-section-card
            title="Vendedores que necesitan apoyo"
            description="Identifica quién va mejor y dónde intervenir para mejorar resultados."
          >
            @if (sellerRanking().length) {
              <app-ranking-list [items]="sellerRanking()" />
            } @else {
              <app-empty-dashboard-state
                icon="pi pi-users"
                title="Sin vendedores asignados"
                description="Solicita al administrador asignar vendedores a tu coordinación."
                actionLabel="Ver clientes"
                actionLink="/coordinador/leads"
              />
            }
          </app-section-card>

          <app-section-card
            title="Acciones para hoy"
            description="Enfoca al equipo en pendientes que afectan cierres."
          >
            @if (m.overdueTasks > 0) {
              <app-alert-card
                title="Tareas vencidas"
                [description]="'Hay ' + m.overdueTasks + ' tareas pendientes que debes resolver hoy.'"
                tone="danger"
                icon="pi pi-calendar-times"
                actionLabel="Revisar tareas"
                actionLink="/coordinador/tareas"
              />
            } @else {
              <app-empty-dashboard-state
                icon="pi pi-check-circle"
                title="No hay tareas vencidas"
                description="No hay tareas vencidas. El equipo va al día."
                actionLabel="Revisar tareas"
                actionLink="/coordinador/tareas"
              />
            }
          </app-section-card>
        </div>

        <div class="mt-3">
          <app-section-card
            title="Progreso de metas del equipo"
            description="Avance de cada vendedor hacia su meta mensual de ventas."
          >
            @if (m.sellers.length === 0) {
              <app-empty-dashboard-state
                icon="pi pi-users"
                title="Sin vendedores asignados"
                description="Cuando tus vendedores gestionen clientes, verás aquí su progreso."
              />
            } @else {
              <p-table [value]="sellersGoal()" styleClass="sf-goals-table">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Vendedor</th>
                    <th style="width:120px">Ventas este mes</th>
                    <th style="width:120px">Meta</th>
                    <th style="width:80px">Avance</th>
                    <th>Progreso</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-s>
                  <tr>
                    <td><strong>{{ s.name }}</strong></td>
                    <td>{{ money(s.revenueThisMonth) }}</td>
                    <td class="text-muted">{{ s.personalGoal ? money(s.personalGoal) : '—' }}</td>
                    <td>
                      <span [class]="s.goalProgress !== null && s.goalProgress >= 100 ? 'badge badge--success' : 'badge badge--warn'">
                        {{ s.goalProgress !== null ? percent(s.goalProgress) : '—' }}
                      </span>
                    </td>
                    <td class="progress-col">
                      <div class="progress-bar-track">
                        <div
                          class="progress-bar-fill"
                          [style.width]="progressWidth(s.goalProgress)"
                          [class.progress-bar-fill--done]="s.goalProgress !== null && s.goalProgress >= 100"
                        ></div>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            }
          </app-section-card>
        </div>

        <div class="mt-3">
          <app-section-card
            title="Clientes críticos"
            description="Revisa estos clientes antes de que se enfríen."
          >
            @if (m.staleLeads.length === 0) {
              <app-empty-dashboard-state
                icon="pi pi-phone"
                title="No hay clientes críticos por ahora"
                description="El equipo está gestionando bien todos los clientes."
                actionLabel="Ver clientes"
                actionLink="/coordinador/leads"
              />
            } @else {
              <p-table [value]="m.staleLeads" [paginator]="true" [rows]="8">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th class="actions-col"></th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-l>
                  <tr>
                    <td><strong>{{ l.name }}</strong></td>
                    <td class="mono">{{ l.phone }}</td>
                    <td class="text-muted">{{ statusLabel(l.status) }}</td>
                    <td class="actions-col">
                      <a [routerLink]="['/coordinador/leads', l.id]" class="row-link">
                        Ver cliente <i class="pi pi-arrow-right"></i>
                      </a>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
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
      .actions-col { text-align: right; }
      .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      .row-link {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--sf-primary);
        font-weight: 600;
        font-size: 0.85rem;
      }
      .row-link:hover { text-decoration: underline; }

      .progress-col { min-width: 140px; }
      .progress-bar-track {
        height: 8px;
        background: var(--sf-border, #e2e8f0);
        border-radius: 4px;
        overflow: hidden;
      }
      .progress-bar-fill {
        height: 100%;
        background: var(--sf-warn, #f59e0b);
        border-radius: 4px;
        transition: width 0.4s ease;
      }
      .progress-bar-fill--done { background: var(--sf-success, #22c55e); }

      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .badge--success { background: #dcfce7; color: #15803d; }
      .badge--warn   { background: #fef9c3; color: #92400e; }
    `,
  ],
})
export class CoordinadorDashboardComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  private readonly moneyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  metrics = signal<CoordinatorMetrics | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  teamRevenue = computed(() => {
    const m = this.metrics();
    if (!m) return 0;
    return m.sellers.reduce((sum, seller) => sum + (seller.revenueThisMonth ?? 0), 0);
  });

  teamTotalLeads = computed(() => {
    const m = this.metrics();
    if (!m) return 0;
    return m.sellers.reduce((sum, seller) => sum + (seller.totalLeads ?? 0), 0);
  });

  teamSoldLeads = computed(() => {
    const m = this.metrics();
    if (!m) return 0;
    return m.sellers.reduce((sum, seller) => sum + (seller.soldLeads ?? 0), 0);
  });

  teamConversion = computed(() => {
    const total = this.teamTotalLeads();
    if (!total) return 0;
    return (this.teamSoldLeads() / total) * 100;
  });

  headerSummary = computed(() => {
    const m = this.metrics();
    if (!m) return [];
    return [
      { label: 'Vendedores', value: `${m.sellers.length}`, tone: 'info' as const },
      { label: 'Clientes criticos', value: `${m.staleLeads.length}`, tone: 'warn' as const },
      { label: 'Tareas vencidas', value: `${m.overdueTasks}`, tone: 'danger' as const },
    ];
  });

  sellerRanking = computed<RankingItem[]>(() => {
    const m = this.metrics();
    if (!m) return [];
    return [...m.sellers]
      .sort((a, b) => (b.revenueThisMonth ?? 0) - (a.revenueThisMonth ?? 0))
      .map((seller) => ({
        label: seller.name ?? 'Vendedor',
        value: this.money(seller.revenueThisMonth ?? 0),
        detail: `${this.percent(seller.conversionRate)} conversión comercial`,
        tone: seller.conversionRate >= 30 ? 'success' : 'warn',
      }));
  });

  sellersGoal = computed(() => {
    const m = this.metrics();
    if (!m) return [];
    return [...m.sellers].sort((a, b) => (b.goalProgress ?? 0) - (a.goalProgress ?? 0));
  });

  teamAlerts = computed(() => {
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

    if (m.staleLeads.length > 0) {
      alerts.push({
        title: 'Clientes sin seguimiento',
        description: `Hay ${m.staleLeads.length} clientes sin seguimiento. Revisa estos clientes antes de que se enfrien.`,
        tone: 'danger',
        icon: 'pi pi-bell',
        actionLabel: 'Ver clientes',
        actionLink: '/coordinador/leads',
      });
    }
    if (m.overdueTasks > 0) {
      alerts.push({
        title: 'Tareas vencidas',
        description: `Hay ${m.overdueTasks} tareas vencidas. Prioriza su cierre hoy.`,
        tone: 'warn',
        icon: 'pi pi-clock',
        actionLabel: 'Revisar tareas',
        actionLink: '/coordinador/tareas',
      });
    }
    if (m.staleLeads.length === 0 && m.overdueTasks === 0) {
      alerts.push({
        title: 'Operacion al dia',
        description: 'No hay clientes criticos ni tareas vencidas. Mantengan el ritmo de seguimiento.',
        tone: 'success',
        icon: 'pi pi-check-circle',
        actionLabel: 'Ver clientes',
        actionLink: '/coordinador/leads',
      });
    }
    return alerts;
  });

  statusLabel(status: string): string {
    return LEAD_STATUS_LABELS[status as LeadStatus] ?? status;
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.analytics.coordinator().subscribe({
      next: (m) => {
        this.metrics.set(m);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar el panel');
        this.loading.set(false);
      },
    });
  }

  money(amount: number): string {
    return this.moneyFormatter.format(amount ?? 0);
  }

  percent(value: number): string {
    const safe = Number.isFinite(value) ? value : 0;
    return `${Math.round(safe)}%`;
  }

  progressWidth(goalProgress: number | null): string {
    if (goalProgress === null) return '0%';
    return `${Math.min(100, Math.max(0, Math.round(goalProgress)))}%`;
  }
}
