import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { LEAD_STATUS_LABELS, LeadStatus } from '@core/constants/lead-statuses';
import { SellerMetrics } from '@core/models/analytics.model';
import { ApiError } from '@core/models/api-error.model';
import { Task, TASK_STATUS_LABELS } from '@core/models/task.model';
import { AnalyticsService } from '@core/services/analytics.service';
import { TasksService } from '@core/services/tasks.service';
import { DashboardHeaderComponent } from '@shared/components/dashboard/dashboard-header.component';
import { EmptyDashboardStateComponent } from '@shared/components/dashboard/empty-dashboard-state.component';
import { KpiCardComponent } from '@shared/components/dashboard/kpi-card.component';
import { ProgressToGoalComponent } from '@shared/components/dashboard/progress-to-goal.component';
import { StatusBreakdownComponent } from '@shared/components/dashboard/status-breakdown.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

@Component({
  selector: 'app-vendedor-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ButtonModule,
    MessageModule,
    Tag,
    DashboardHeaderComponent,
    KpiCardComponent,
    ProgressToGoalComponent,
    StatusBreakdownComponent,
    EmptyDashboardStateComponent,
    LoadingComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-dashboard-header
        eyebrow="Panel vendedor"
        title="Mi desempeño comercial"
        subtitle="Revisa cuánto has vendido, qué clientes atender y cómo vas frente a tu meta."
        [periodLabel]="periodLabel()"
        [summary]="headerSummary()"
      />

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (!metrics()) {
        <app-empty-dashboard-state
          icon="pi pi-user"
          title="Todavía no tienes ventas registradas este mes"
          description="Empieza contactando tus leads nuevos para aumentar tu conversión."
        />
      } @else {
        @let m = metrics()!;

        <div class="sf-grid sf-grid--kpi">
          <app-kpi-card
            label="Mis ventas"
            [value]="money(m.revenueThisMonth)"
            [context]="'Meta: ' + money(m.personalGoal)"
            icon="pi pi-wallet"
            tone="success"
          />
          <app-kpi-card
            label="Mi meta"
            [value]="money(m.personalGoal)"
            [context]="'Avance: ' + percent(m.goalProgress ?? 0)"
            icon="pi pi-flag"
            tone="warn"
          />
          <app-kpi-card
            label="Clientes pendientes"
            [value]="m.leadsToContact ?? 0"
            context="Por contactar hoy"
            icon="pi pi-phone"
            tone="danger"
          />
          <app-kpi-card
            label="Mi conversión"
            [value]="percent(m.conversionRate)"
            [context]="m.soldLeads + ' ventas de ' + m.totalLeads + ' clientes'"
            icon="pi pi-chart-line"
            tone="info"
          />
        </div>

        <div class="mt-3">
          <app-progress-to-goal
            title="Mi avance de meta"
            subtitle="Cuánto llevas vendido frente a tu objetivo mensual"
            [percent]="m.goalProgress"
            [currentLabel]="'Vendido: ' + money(m.revenueThisMonth)"
            [targetLabel]="'Meta: ' + money(m.personalGoal)"
          />
        </div>

        <div class="sf-grid sf-grid--2 mt-3">
          <app-section-card
            title="Contacta estos clientes hoy"
            description="Prioriza tu gestión según estado de cada cliente."
          >
            @if (m.leadsByStatus.length) {
              <app-status-breakdown [items]="statusItems()" />
            } @else {
              <app-empty-dashboard-state
                icon="pi pi-inbox"
                title="Aún no tienes clientes pendientes"
                description="Cuando entren nuevas solicitudes, aparecerán aquí."
                actionLabel="Ver mis clientes"
                actionLink="/vendedor/leads"
              />
            }
          </app-section-card>

          <app-section-card
            title="Accesos rápidos"
            description="Atajos para tu operación diaria."
          >
            <div class="quick-grid">
              <a routerLink="/vendedor/leads" class="quick">
                <i class="pi pi-users"></i>
                <strong>Ver mis clientes</strong>
                <small>Pipeline completo</small>
              </a>
              <a routerLink="/vendedor/leads" class="quick">
                <i class="pi pi-user-plus"></i>
                <strong>Crear cliente</strong>
                <small>Registro manual</small>
              </a>
              <a routerLink="/vendedor/ventas" class="quick">
                <i class="pi pi-wallet"></i>
                <strong>Registrar venta</strong>
                <small>Cierra una oportunidad</small>
              </a>
              <a routerLink="/vendedor/campanas" class="quick">
                <i class="pi pi-whatsapp"></i>
                <strong>Enviar campaña</strong>
                <small>Máximo 10 contactos</small>
              </a>
              <a routerLink="/catalogo" class="quick">
                <i class="pi pi-mobile"></i>
                <strong>Ver productos</strong>
                <small>Catálogo público</small>
              </a>
            </div>
          </app-section-card>
        </div>

        <div class="mt-3">
          <app-section-card
            title="Mis tareas pendientes"
            description="Tareas asignadas a ti que aún no están completadas."
          >
            @if (pendingTasks().length === 0) {
              <app-empty-dashboard-state
                icon="pi pi-check-square"
                title="Sin tareas pendientes"
                description="¡Estás al día! Cuando te asignen tareas, aparecerán aquí."
                actionLabel="Ver todas las tareas"
                actionLink="/vendedor/tareas"
              />
            } @else {
              <ul class="task-list">
                @for (t of pendingTasks(); track t.id) {
                  <li class="task-item" [class.overdue]="isOverdue(t)">
                    <div class="task-body">
                      <span class="task-title">{{ t.title }}</span>
                      @if (t.dueDate) {
                        <span class="task-due text-xs text-muted">
                          <i class="pi pi-calendar"></i>
                          {{ t.dueDate | date: 'dd/MM/yy' }}
                        </span>
                      }
                    </div>
                    <p-tag
                      [value]="taskStatusLabel(t.status)"
                      [severity]="t.status === 'EN_PROGRESO' ? 'info' : isOverdue(t) ? 'danger' : 'warn'"
                    />
                  </li>
                }
              </ul>
              <div class="task-footer">
                <a routerLink="/vendedor/tareas" class="text-sm text-primary">
                  Ver todas mis tareas →
                </a>
              </div>
            }
          </app-section-card>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .quick-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
      }
      .quick {
        border: 1px solid var(--sf-border);
        border-radius: 12px;
        background: #fff;
        padding: 0.8rem;
        color: var(--sf-text);
        text-decoration: none;
        display: grid;
        gap: 0.2rem;
        transition: border-color 0.15s var(--sf-ease), transform 0.15s var(--sf-ease);
      }
      .quick:hover {
        border-color: var(--sf-primary);
        transform: translateY(-1px);
        text-decoration: none;
      }
      .quick i {
        width: 30px;
        height: 30px;
        border-radius: 9px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--sf-primary-soft);
        color: var(--sf-primary);
      }
      .quick strong { font-size: 0.86rem; }
      .quick small {
        color: var(--sf-text-muted);
        font-size: 0.75rem;
      }
      .task-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
      .task-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.6rem 0.75rem;
        border-radius: 8px;
        background: var(--sf-bg-soft, #f8fafc);
        border: 1px solid var(--sf-border, #e2e8f0);
      }
      .task-item.overdue { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.04); }
      .task-body { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; min-width: 0; }
      .task-title { font-size: 0.875rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .task-due { display: flex; align-items: center; gap: 0.3rem; }
      .task-footer { margin-top: 0.75rem; text-align: right; }
      .text-primary { color: var(--sf-primary, #2563eb); text-decoration: none; }
      .text-primary:hover { text-decoration: underline; }
    `,
  ],
})
export class VendedorDashboardComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  private readonly tasksService = inject(TasksService);
  private readonly moneyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  metrics = signal<SellerMetrics | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly pendingTasks = signal<Task[]>([]);

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
      { label: 'Ventas', value: `${m.soldLeads}`, tone: 'success' as const },
      { label: 'Pendientes', value: `${m.leadsToContact ?? 0}`, tone: 'warn' as const },
    ];
  });

  statusItems = computed(() =>
    (this.metrics()?.leadsByStatus ?? []).map((status) => ({
      label: LEAD_STATUS_LABELS[status.status as LeadStatus] ?? status.status,
      count: status.count,
    })),
  );

  ngOnInit(): void {
    this.loading.set(true);
    this.analytics.me().subscribe({
      next: (m) => {
        this.metrics.set(m);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar tus métricas');
        this.loading.set(false);
      },
    });
    this.tasksService.getAll('PENDIENTE').subscribe({
      next: (res) => this.pendingTasks.set(res.items.slice(0, 5)),
      error: () => this.pendingTasks.set([]),
    });
    this.tasksService.getAll('EN_PROGRESO').subscribe({
      next: (res) => this.pendingTasks.update((t) => [...t, ...res.items].slice(0, 5)),
      error: () => {},
    });
  }

  isOverdue(t: Task): boolean {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).getTime() < Date.now();
  }

  taskStatusLabel(status: string): string {
    return TASK_STATUS_LABELS[status] ?? status;
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
