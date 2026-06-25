import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { ApiError } from '@core/models/api-error.model';
import { GlobalMetrics } from '@core/models/company.model';
import { CompaniesService } from '@core/services/companies.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';
import { KpiCardComponent } from '@shared/components/dashboard/kpi-card.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    TableModule,
    MessageModule,
    ButtonModule,
    Tag,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
    KpiCardComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Panel SalesFlow"
        subtitle="Visión global de la plataforma — todas las empresas."
      />

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (metrics()) {
        @let m = metrics()!;

        <div class="sf-grid sf-grid--kpi">
          <app-kpi-card
            label="Empresas activas"
            [value]="m.activeCompanies"
            [context]="m.totalCompanies + ' en total'"
            icon="pi pi-building"
            tone="success"
          />
          <app-kpi-card
            label="Suspendidas"
            [value]="m.suspendedCompanies"
            context="Requieren atención"
            icon="pi pi-ban"
            tone="danger"
          />
          <app-kpi-card
            label="Leads (últimos 30 días)"
            [value]="(m.leadsLast30Days | number) ?? '0'"
            context="Plataforma global"
            icon="pi pi-users"
            tone="info"
          />
          <app-kpi-card
            label="Ingresos totales"
            [value]="(m.totalSalesAmount | currency: 'COP' : 'symbol-narrow' : '1.0-0') ?? '$0'"
            context="Todas las empresas"
            icon="pi pi-wallet"
            tone="success"
          />
        </div>

        <div class="sf-grid sf-grid--2 mt-3">
          <app-section-card
            title="Empresas más activas"
            description="Top 5 por leads creados en los últimos 30 días."
          >
            @if (m.topCompanies.length === 0) {
              <app-empty-state
                icon="pi pi-chart-bar"
                title="Sin actividad registrada"
                description="No hay leads en los últimos 30 días."
              />
            } @else {
              <div class="rank-list">
                @for (c of m.topCompanies; track c.id; let i = $index) {
                  <div class="rank-item">
                    <span class="rank-pos">{{ i + 1 }}</span>
                    <div class="rank-info">
                      <span class="rank-name">{{ c.name }}</span>
                      <span class="rank-sub mono text-muted">{{ c.subdomain }}</span>
                    </div>
                    <span class="rank-value">{{ c.leadsLast30Days }} leads</span>
                  </div>
                }
              </div>
            }
          </app-section-card>

          <app-section-card
            title="Empresas sin actividad"
            description="Activas pero sin eventos en los últimos 14 días — riesgo de churn."
          >
            @if (m.inactiveCompanies.length === 0) {
              <app-empty-state
                icon="pi pi-check-circle"
                title="Todas las empresas están activas"
                description="Ninguna empresa lleva más de 14 días sin actividad."
              />
            } @else {
              <div class="rank-list">
                @for (c of m.inactiveCompanies; track c.id) {
                  <div class="rank-item">
                    <div class="rank-info">
                      <span class="rank-name">{{ c.name }}</span>
                      <span class="rank-sub mono text-muted">{{ c.subdomain }}</span>
                    </div>
                    <p-tag
                      [value]="daysLabel(c.daysSinceLastActivity)"
                      [severity]="c.daysSinceLastActivity > 30 ? 'danger' : 'warn'"
                    />
                  </div>
                }
              </div>
            }
          </app-section-card>
        </div>

        <div class="mt-3">
          <app-section-card
            title="Accesos rápidos"
            description="Gestión de la plataforma."
          >
            <div class="quick-links">
              <a routerLink="/superadmin/empresas" class="quick-link">
                <i class="pi pi-building"></i>
                <span>Gestionar empresas</span>
              </a>
              <a routerLink="/superadmin/auditoria" class="quick-link">
                <i class="pi pi-list"></i>
                <span>Audit log global</span>
              </a>
            </div>
          </app-section-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .rank-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .rank-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      background: var(--sf-surface-2, #f8fafc);
      border-radius: 8px;
    }
    .rank-pos {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--sf-text-muted);
      min-width: 1.2rem;
      text-align: center;
    }
    .rank-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .rank-name { font-weight: 600; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rank-sub  { font-size: 0.75rem; }
    .rank-value { font-weight: 700; font-size: 0.85rem; color: var(--sf-primary); white-space: nowrap; }
    .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

    .quick-links { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .quick-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      background: var(--sf-surface-2, #f8fafc);
      border: 1px solid var(--sf-border, #e2e8f0);
      border-radius: 8px;
      color: var(--sf-primary);
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      transition: background 0.15s;
    }
    .quick-link:hover { background: var(--sf-primary-light, #eff6ff); }
  `],
})
export class SuperadminDashboardComponent implements OnInit {
  private readonly companiesService = inject(CompaniesService);

  metrics = signal<GlobalMetrics | null>(null);
  loading = signal(false);
  error   = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.companiesService.getGlobalMetrics().subscribe({
      next: (m) => {
        this.metrics.set(m);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar métricas globales');
        this.loading.set(false);
      },
    });
  }

  daysLabel(days: number): string {
    if (days >= 999) return 'Sin actividad';
    return `${days} día${days !== 1 ? 's' : ''} inactiva`;
  }
}
