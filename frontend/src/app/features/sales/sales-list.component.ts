import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@core/auth/auth.service';
import { Role } from '@core/constants/roles';
import { ApiError } from '@core/models/api-error.model';
import { Sale } from '@core/models/sale.model';
import { ManagedUser } from '@core/models/user.model';
import { SalesService } from '@core/services/sales.service';
import { UsersService } from '@core/services/users.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';
import { StatCardComponent } from '@shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FormsModule,
    ButtonModule,
    TableModule,
    MessageModule,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
    StatCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Ventas"
        subtitle="Registro de ventas cerradas dentro de tu alcance."
      >
        @if (sales().length > 0) {
          <p-button
            label="Exportar CSV"
            icon="pi pi-download"
            severity="secondary"
            size="small"
            [loading]="exportingCsv()"
            (onClick)="downloadCsv()"
          />
          <p-button
            label="Exportar Excel"
            icon="pi pi-file-excel"
            severity="secondary"
            size="small"
            (onClick)="exportExcel()"
          />
        }
      </app-page-header>

      <!-- Filtros -->
      <div class="filters-bar">
        <div class="sf-field">
          <label>Desde</label>
          <input class="sf-input" type="date" [(ngModel)]="dateFrom" (ngModelChange)="load()" />
        </div>
        <div class="sf-field">
          <label>Hasta</label>
          <input class="sf-input" type="date" [(ngModel)]="dateTo" (ngModelChange)="load()" />
        </div>
        @if (canFilterBySeller()) {
          <div class="sf-field">
            <label>Vendedor</label>
            <select class="sf-select" [(ngModel)]="sellerFilter" (ngModelChange)="load()">
              <option value="">Todos</option>
              @for (s of sellers(); track s.id) {
                <option [value]="s.id">{{ s.name }}</option>
              }
            </select>
          </div>
        }
        <div class="sf-field filter-actions">
          <p-button
            label="Limpiar"
            icon="pi pi-times"
            size="small"
            severity="secondary"
            [text]="true"
            (onClick)="clearFilters()"
          />
        </div>
      </div>

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else {
        <div class="sf-grid sf-grid--kpi mb-2">
          <app-stat-card
            label="Ingresos (filtro)"
            [value]="(pageAmount() | currency: 'COP' : 'symbol-narrow' : '1.0-0') || '$0'"
            [hint]="total() + ' venta' + (total() !== 1 ? 's' : '') + ' en total'"
            icon="pi pi-dollar"
            tone="success"
          />
          <app-stat-card
            label="Promedio por venta"
            [value]="(average() | currency: 'COP' : 'symbol-narrow' : '1.0-0') || '$0'"
            icon="pi pi-chart-line"
            tone="primary"
          />
          <app-stat-card
            label="Registradas"
            [value]="total()"
            icon="pi pi-shopping-cart"
            tone="neutral"
          />
        </div>

        @if (total() === 0) {
          <app-empty-state
            icon="pi pi-dollar"
            title="Sin ventas para este filtro"
            description="Ajusta el rango de fechas o limpia los filtros."
          />
        } @else {
          <app-section-card
            title="Historial"
            description="Las más recientes primero."
          >
            <p-table
              [value]="sales()"
              [paginator]="true"
              [rows]="limit"
              [totalRecords]="total()"
              [lazy]="true"
              (onPage)="onPage($event)"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Oficina</th>
                  <th>Notas</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-s>
                <tr>
                  <td class="text-sm">{{ s.saleDate | date: 'dd/MM/yy' }}</td>
                  <td class="price">
                    {{ +s.amount | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
                  </td>
                  <td>
                    <div class="lead-cell">
                      <span>{{ s.lead?.name ?? '—' }}</span>
                      @if (s.lead?.phone) {
                        <span class="text-muted text-xs mono">{{ s.lead!.phone }}</span>
                      }
                    </div>
                  </td>
                  <td class="text-muted text-sm">{{ s.seller?.name ?? '—' }}</td>
                  <td class="text-muted text-sm">{{ s.office?.name ?? '—' }}</td>
                  <td class="text-muted text-sm notes-col">{{ s.notes || '—' }}</td>
                </tr>
              </ng-template>
            </p-table>
          </app-section-card>
        }
      }
    </div>
  `,
  styles: [
    `
      .filters-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1rem;
        margin-bottom: 1.25rem;
        align-items: flex-end;
      }
      .filters-bar .sf-field { min-width: 130px; flex: 1; }
      .filter-actions { flex: 0 0 auto !important; min-width: unset !important; display: flex; align-items: flex-end; }
      .price { font-variant-numeric: tabular-nums; font-weight: 600; }
      .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      .lead-cell { display: flex; flex-direction: column; gap: 0.1rem; }
      .notes-col { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    `,
  ],
})
export class SalesListComponent implements OnInit {
  private readonly salesService = inject(SalesService);
  private readonly usersService = inject(UsersService);
  private readonly auth         = inject(AuthService);

  sales        = signal<Sale[]>([]);
  sellers      = signal<ManagedUser[]>([]);
  loading      = signal(false);
  exportingCsv = signal(false);
  error        = signal<string | null>(null);
  totalSignal  = signal(0);

  readonly limit = 20;
  page = 1;

  dateFrom     = '';
  dateTo       = '';
  sellerFilter = '';

  canFilterBySeller = computed(() => {
    const r = this.auth.role();
    return r === Role.ADMIN || r === Role.COORDINADOR;
  });

  total = computed(() => this.totalSignal());

  pageAmount = computed(() =>
    this.sales().reduce((acc, s) => acc + Number(s.amount), 0),
  );

  average = computed(() => {
    const t = this.total();
    return t ? this.pageAmount() / this.sales().length : 0;
  });

  ngOnInit(): void {
    this.load();
    if (this.canFilterBySeller()) {
      this.usersService.getSellers().subscribe({
        next: (res) => this.sellers.set(res.items),
        error: () => this.sellers.set([]),
      });
    }
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
    this.dateFrom     = '';
    this.dateTo       = '';
    this.sellerFilter = '';
    this.load();
  }

  downloadCsv(): void {
    this.exportingCsv.set(true);
    this.salesService.exportCsv({
      dateFrom:  this.dateFrom    || undefined,
      dateTo:    this.dateTo      || undefined,
      sellerId:  this.sellerFilter || undefined,
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `ventas-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportingCsv.set(false);
      },
      error: () => this.exportingCsv.set(false),
    });
  }

  exportExcel(): void {
    const rows = this.sales().map((s) => ({
      'Fecha':    s.saleDate ? new Date(s.saleDate).toLocaleDateString('es-CO') : '',
      'Monto':    Number(s.amount),
      'Cliente':  s.lead?.name ?? '',
      'Teléfono': s.lead?.phone ?? '',
      'Vendedor': s.seller?.name ?? '',
      'Oficina':  s.office?.name ?? '',
      'Notas':    s.notes ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    XLSX.writeFile(wb, `ventas-${new Date().toISOString().substring(0, 10)}.xlsx`);
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.salesService.getAll({
      dateFrom:  this.dateFrom   || undefined,
      dateTo:    this.dateTo     || undefined,
      sellerId:  this.sellerFilter || undefined,
      page:      this.page,
      limit:     this.limit,
    }).subscribe({
      next: (res) => {
        this.sales.set(res.items);
        this.totalSignal.set(res.total);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar ventas');
        this.loading.set(false);
      },
    });
  }
}
