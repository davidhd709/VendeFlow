import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { ApiError } from '@core/models/api-error.model';
import { AuditLog } from '@core/models/audit-log.model';
import { AuditService } from '@core/services/audit.service';
import { Company } from '@core/models/company.model';
import { CompaniesService } from '@core/services/companies.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

const ACTION_LABELS: Record<string, string> = {
  'sale.registered':              'Venta registrada',
  'goal.set':                     'Meta creada',
  'lead.status_changed':          'Estado de lead cambiado',
  'lead.created':                 'Lead creado',
  'user.created':                 'Usuario creado',
  'user.updated':                 'Usuario actualizado',
  'user.password_changed':        'Contraseña cambiada',
  'user.password_reset':          'Contraseña restablecida',
  'office.created':               'Oficina creada',
  'office.updated':               'Oficina actualizada',
  'office.deactivated':           'Oficina desactivada',
  'seller_assignment.added':      'Vendedor asignado a coordinador',
  'task.created':                 'Tarea creada',
  'task.completed':               'Tarea completada',
  'task.status_changed':          'Estado de tarea cambiado',
  'product.created':              'Producto creado',
  'product.updated':              'Producto actualizado',
  'template.created':             'Plantilla creada',
  'template.updated':             'Plantilla actualizada',
  'company.created':              'Empresa creada',
  'company.suspended':            'Empresa suspendida',
  'company.status_changed':       'Estado de empresa cambiado',
  'website_builder.published':    'Sitio web publicado',
  'website_config.updated':       'Config. del sitio actualizada',
};

@Component({
  selector: 'app-superadmin-audit',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    MessageModule,
    ButtonModule,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Auditoría global"
        subtitle="Todas las acciones críticas de todas las empresas."
      />

      <app-section-card
        title="Eventos"
        description="Filtra por empresa, tipo de acción, actor o fechas."
      >
        <div class="filters-bar">
          <div class="sf-field grow">
            <label>Empresa</label>
            <select class="sf-select" [(ngModel)]="companyFilter" (ngModelChange)="load()">
              <option value="">Todas</option>
              @for (c of companies(); track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
          </div>
          <div class="sf-field grow">
            <label>Acción</label>
            <input
              class="sf-input"
              [(ngModel)]="actionFilter"
              placeholder="Ej: sale, lead, user…"
              (keyup.enter)="load()"
            />
          </div>
          <div class="sf-field">
            <label>Tipo</label>
            <select class="sf-select" [(ngModel)]="typeFilter" (ngModelChange)="load()">
              <option value="">Todos</option>
              <option value="Sale">Venta</option>
              <option value="Lead">Lead</option>
              <option value="Task">Tarea</option>
              <option value="MonthlyGoal">Meta</option>
              <option value="User">Usuario</option>
              <option value="Office">Oficina</option>
              <option value="Product">Producto</option>
              <option value="MessageTemplate">Plantilla</option>
              <option value="Company">Empresa</option>
            </select>
          </div>
          <div class="sf-field">
            <label>Desde</label>
            <input class="sf-input" type="date" [(ngModel)]="dateFrom" (ngModelChange)="load()" />
          </div>
          <div class="sf-field">
            <label>Hasta</label>
            <input class="sf-input" type="date" [(ngModel)]="dateTo" (ngModelChange)="load()" />
          </div>
          <div class="sf-field filter-actions">
            <p-button label="Buscar" icon="pi pi-search" size="small" (onClick)="load()" />
            <p-button label="Limpiar" icon="pi pi-times" size="small" severity="secondary" [text]="true" (onClick)="clearFilters()" />
          </div>
        </div>

        @if (loading()) {
          <app-loading />
        } @else if (error()) {
          <p-message severity="error" [text]="error()!" />
        } @else if (logs().length === 0) {
          <app-empty-state
            icon="pi pi-list"
            title="Sin eventos para este filtro"
            description="Ajusta los filtros para ver resultados."
          />
        } @else {
          <p class="results-count">{{ total() }} evento{{ total() !== 1 ? 's' : '' }}</p>
          <p-table
            [value]="logs()"
            [paginator]="true"
            [rows]="limit"
            [totalRecords]="total()"
            [lazy]="true"
            (onPage)="onPage($event)"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Fecha</th>
                <th>Empresa</th>
                <th>Actor</th>
                <th>Acción</th>
                <th>Tipo</th>
                <th>IP</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-log>
              <tr>
                <td class="text-xs text-muted mono nowrap">{{ log.createdAt | date:'dd/MM/yy HH:mm' }}</td>
                <td class="text-sm">
                  <span class="company-pill">{{ log.company?.name ?? '—' }}</span>
                </td>
                <td>
                  <div class="actor-cell">
                    <span>{{ log.actor?.name ?? '—' }}</span>
                    @if (log.actorRole) {
                      <span class="role-chip">{{ log.actorRole }}</span>
                    }
                  </div>
                </td>
                <td>
                  <span class="action-label">{{ actionLabel(log.action) }}</span>
                  <div class="text-xs text-muted mono">{{ log.action }}</div>
                </td>
                <td class="text-muted text-sm">{{ log.targetType ?? '—' }}</td>
                <td class="text-xs text-muted mono">{{ log.ip ?? '—' }}</td>
              </tr>
            </ng-template>
          </p-table>
        }
      </app-section-card>
    </div>
  `,
  styles: [`
    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1rem;
      margin-bottom: 1.25rem;
      align-items: flex-end;
    }
    .filters-bar .sf-field { min-width: 120px; flex: 1; }
    .filters-bar .grow { flex: 2; min-width: 160px; }
    .filter-actions { display: flex; gap: 0.4rem; align-items: flex-end; flex: 0 0 auto !important; min-width: unset !important; }
    .results-count { font-size: 0.8rem; color: var(--sf-text-muted); margin: 0 0 0.6rem; }
    .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .nowrap { white-space: nowrap; }
    .actor-cell { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .role-chip {
      font-size: 0.65rem; font-weight: 700;
      padding: 0.1rem 0.4rem; border-radius: 999px;
      background: var(--sf-surface-2); color: var(--sf-text-muted);
      letter-spacing: 0.04em;
    }
    .action-label { font-size: 0.85rem; font-weight: 500; }
    .company-pill {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      background: var(--sf-surface-2, #f1f5f9);
      color: var(--sf-text-muted);
    }
  `],
})
export class SuperadminAuditComponent implements OnInit {
  private readonly auditService     = inject(AuditService);
  private readonly companiesService = inject(CompaniesService);

  logs      = signal<AuditLog[]>([]);
  companies = signal<Company[]>([]);
  loading   = signal(false);
  error     = signal<string | null>(null);
  total     = signal(0);

  readonly limit = 25;
  page = 1;

  companyFilter = '';
  actionFilter  = '';
  typeFilter    = '';
  dateFrom      = '';
  dateTo        = '';

  ngOnInit(): void {
    this.load();
    this.companiesService.getAll(1, 200).subscribe({
      next: (res) => this.companies.set(res.items),
      error: () => {},
    });
  }

  load(): void {
    this.page = 1;
    this.fetch();
  }

  onPage(event: { first: number; rows: number }): void {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.fetch();
  }

  clearFilters(): void {
    this.companyFilter = '';
    this.actionFilter  = '';
    this.typeFilter    = '';
    this.dateFrom      = '';
    this.dateTo        = '';
    this.load();
  }

  actionLabel(action: string): string {
    return ACTION_LABELS[action] ?? action;
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auditService.getGlobal({
      companyId:  this.companyFilter || undefined,
      action:     this.actionFilter.trim() || undefined,
      targetType: this.typeFilter    || undefined,
      dateFrom:   this.dateFrom      || undefined,
      dateTo:     this.dateTo        || undefined,
      page:       this.page,
      limit:      this.limit,
    }).subscribe({
      next: (res) => {
        this.logs.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar el registro');
        this.loading.set(false);
      },
    });
  }
}
