import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import * as XLSX from 'xlsx';
import { AuthService } from '@core/auth/auth.service';
import { LEAD_STATUS_LABELS, LeadStatus } from '@core/constants/lead-statuses';
import { Lead, CreateLead, ImportLeadRow, ImportResult, DOCUMENT_TYPES } from '@core/models/lead.model';
import { ApiError } from '@core/models/api-error.model';
import { Office } from '@core/models/catalog.model';
import { ManagedUser } from '@core/models/user.model';
import { LeadsService } from '@core/services/leads.service';
import { OfficesService } from '@core/services/offices.service';
import { UsersService } from '@core/services/users.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

// Mapeo de nombres de columnas Excel → campo interno (case-insensitive)
const COL_MAP: Record<string, keyof ImportLeadRow> = {
  'nombre':                'name',
  'name':                  'name',
  'telefono':              'phone',
  'teléfono':              'phone',
  'celular':               'phone',
  'numero telefonico':     'phone',
  'número telefonico':     'phone',
  'número telefónico':     'phone',
  'phone':                 'phone',
  'tipo documento':        'documentType',
  'tipo de documento':     'documentType',
  'document type':         'documentType',
  'numero documento':      'documentNumber',
  'número documento':      'documentNumber',
  'num documento':         'documentNumber',
  'document number':       'documentNumber',
  'oficina':               'officeName',
  'office':                'officeName',
  'fecha activacion':      'activationDate',
  'fecha de activacion':   'activationDate',
  'fecha activación':      'activationDate',
  'fecha de activación':   'activationDate',
  'fecha compra':          'activationDate',
  'fecha de compra':       'activationDate',
  'activation date':       'activationDate',
};

function str(value: unknown): string {
  return String(value ?? '').trim();
}

function parseExcelDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${date.y}-${m}-${d}`;
    }
  }
  if (typeof value === 'string') {
    const cleaned = value.trim();
    if (!cleaned) return undefined;
    // dd/mm/yyyy o dd-mm-yyyy → yyyy-mm-dd
    const dmMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmMatch) return `${dmMatch[3]}-${dmMatch[2].padStart(2, '0')}-${dmMatch[1].padStart(2, '0')}`;
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().substring(0, 10);
  }
  return undefined;
}

@Component({
  selector: 'app-leads-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    TableModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Leads"
        subtitle="Clientes potenciales captados desde la web o cargados manualmente."
      >
        <div class="header-actions">
          @if (canImport()) {
            <p-button
              label="Importar Excel"
              icon="pi pi-file-excel"
              severity="secondary"
              (onClick)="openImport()"
            />
          }
          <p-button
            label="Nuevo lead"
            icon="pi pi-plus"
            (onClick)="openNew()"
          />
        </div>
      </app-page-header>

      <app-section-card
        title="Listado"
        description="Filtra y busca leads dentro de tu alcance."
      >
        <div slot="actions">
          <p-button
            label="Exportar Excel"
            icon="pi pi-download"
            severity="secondary"
            size="small"
            [text]="true"
            [disabled]="leads().length === 0"
            (onClick)="exportExcel()"
          />
        </div>

        <div class="filters-grid">
          <div class="sf-field">
            <label>Buscar</label>
            <input
              class="sf-input"
              [(ngModel)]="search"
              (keyup.enter)="load()"
              placeholder="Nombre, teléfono, documento… (Enter)"
            />
          </div>
          <div class="sf-field">
            <label>Estado</label>
            <select class="sf-select" [(ngModel)]="statusFilter" (ngModelChange)="load()">
              <option [ngValue]="null">Todos</option>
              @for (s of statuses; track s) {
                <option [ngValue]="s">{{ labels[s] }}</option>
              }
            </select>
          </div>
          @if (canImport()) {
            <div class="sf-field">
              <label>Oficina</label>
              <select class="sf-select" [(ngModel)]="officeFilter" (ngModelChange)="onOfficeFilterChange()">
                <option [ngValue]="null">Todas</option>
                @for (o of offices(); track o.id) {
                  <option [ngValue]="o.id">{{ o.name }}</option>
                }
              </select>
            </div>
          }
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
        } @else if (leads().length === 0) {
          <app-empty-state
            icon="pi pi-users"
            title="Sin leads"
            description="Aún no se han captado leads para este filtro."
          />
        } @else {
          <p class="results-count">{{ total() }} resultado{{ total() !== 1 ? 's' : '' }}</p>
          <p-table
            [value]="leads()"
            [paginator]="true"
            [rows]="limit"
            [totalRecords]="total()"
            [lazy]="true"
            (onPage)="onPage($event)"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Estado</th>
                @if (canImport()) {
                  <th>Oficina</th>
                  <th>Vendedor</th>
                }
                <th>Creado</th>
                <th class="actions-col"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-l>
              <tr>
                <td>
                  <div class="lead-name"><strong>{{ l.name }}</strong></div>
                  <div class="text-muted text-xs">
                    @if (l.documentType || l.documentNumber) {
                      {{ l.documentType }} {{ l.documentNumber }}
                    }
                  </div>
                </td>
                <td class="mono text-sm">{{ l.phone }}</td>
                <td><app-status-badge [status]="l.status" /></td>
                @if (canImport()) {
                  <td class="text-muted text-sm">{{ l.office?.name ?? '—' }}</td>
                  <td class="text-muted text-sm">{{ l.seller?.name ?? '—' }}</td>
                }
                <td class="text-muted text-xs">{{ l.createdAt | date:'dd/MM/yy' }}</td>
                <td class="actions-col">
                  <a [routerLink]="[basePath(), l.id]" class="row-link">
                    Ver <i class="pi pi-arrow-right"></i>
                  </a>
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </app-section-card>
    </div>

    <!-- ── Modal: nuevo lead manual ─────────────────────── -->
    <p-dialog
      header="Nuevo lead"
      [(visible)]="newDialog"
      [modal]="true"
      [style]="{ width: '480px' }"
    >
      <div class="sf-stack">
        <div class="form-grid-2">
          <div class="sf-field">
            <label>Nombre <span class="req">*</span></label>
            <input pInputText [(ngModel)]="newForm.name" placeholder="Juan Pérez" />
          </div>
          <div class="sf-field">
            <label>Teléfono <span class="req">*</span></label>
            <input pInputText [(ngModel)]="newForm.phone" placeholder="+57 300 000 0000" />
          </div>
        </div>

        <div class="form-grid-2">
          <div class="sf-field">
            <label>Tipo documento</label>
            <select class="sf-select" [(ngModel)]="newForm.documentType">
              <option [ngValue]="undefined">— Seleccionar —</option>
              @for (t of docTypes; track t) {
                <option [ngValue]="t">{{ t }}</option>
              }
            </select>
          </div>
          <div class="sf-field">
            <label>Número documento</label>
            <input pInputText [(ngModel)]="newForm.documentNumber" placeholder="1234567890" />
          </div>
        </div>

        <div class="form-grid-2">
          <div class="sf-field">
            <label>Fecha de activación <span class="text-muted text-xs">(compra)</span></label>
            <input type="date" class="sf-input" [(ngModel)]="newForm.activationDate" />
          </div>
          @if (canImport()) {
            <div class="sf-field">
              <label>Oficina <span class="req">*</span></label>
              <select class="sf-select" [(ngModel)]="newForm.officeId" (ngModelChange)="onOfficeChange()">
                <option [ngValue]="''">— Seleccionar —</option>
                @for (o of offices(); track o.id) {
                  <option [ngValue]="o.id">{{ o.name }}</option>
                }
              </select>
            </div>
          }
        </div>

        @if (canImport()) {
          <div class="sf-field">
            <label>Vendedor <span class="req">*</span></label>
            @if (!newForm.officeId) {
              <select class="sf-select" disabled>
                <option>— Selecciona una oficina primero —</option>
              </select>
            } @else if (loadingSellers()) {
              <select class="sf-select" disabled>
                <option>Cargando vendedores…</option>
              </select>
            } @else if (sellers().length === 0) {
              <select class="sf-select" disabled>
                <option>Sin vendedores en esta oficina</option>
              </select>
              <p class="field-hint warn">Esta oficina no tiene vendedores asignados.</p>
            } @else {
              <select class="sf-select" [(ngModel)]="newForm.sellerId">
                <option [ngValue]="undefined">— Seleccionar vendedor —</option>
                @for (s of sellers(); track s.id) {
                  <option [ngValue]="s.id">{{ s.name }}</option>
                }
              </select>
            }
          </div>
        }

        <div class="sf-field">
          <label>Notas <span class="text-muted text-xs">(opcional)</span></label>
          <input pInputText [(ngModel)]="newForm.notes" placeholder="Observaciones del lead..." />
        </div>
      </div>

      <div class="dialog-actions">
        <p-button label="Cancelar" severity="secondary" (onClick)="newDialog = false" />
        <p-button label="Crear lead" [loading]="saving()" (onClick)="saveNew()" />
      </div>
    </p-dialog>

    <!-- ── Modal: importar Excel ────────────────────────── -->
    <p-dialog
      [header]="importStep() === 'result' ? 'Resultado de importación' : 'Importar desde Excel'"
      [(visible)]="importDialog"
      [modal]="true"
      [style]="{ width: '720px', maxWidth: '95vw' }"
      (onHide)="resetImport()"
    >
      @if (importStep() === 'upload') {
        <div
          class="upload-zone"
          (dragover)="$event.preventDefault()"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
        >
          <i class="pi pi-file-excel upload-icon"></i>
          <p class="upload-title">Arrastra tu archivo Excel aquí</p>
          <p class="upload-hint">o haz clic para seleccionar</p>
          <p class="upload-hint">Formatos aceptados: .xlsx, .xls</p>
          <input
            #fileInput
            type="file"
            accept=".xlsx,.xls"
            class="hidden-input"
            (change)="onFileChange($event)"
          />
        </div>

        <div class="template-hint">
          <i class="pi pi-info-circle"></i>
          <span>
            El archivo debe tener la hoja <strong>PLANES</strong> y/o <strong>REPOSICIONES</strong>
            con sus columnas estándar. Se leerán:
            <strong>Nombre_Cliente</strong>, <strong>Numero_MIN</strong>,
            <strong>Nro_Cedula_Cliente</strong>, <strong>Oficina</strong>,
            <strong>Nombre_Vendedor</strong> y (en REPOSICIONES) <strong>Fecha_Reposicion</strong>.
          </span>
        </div>
      }

      @if (importStep() === 'preview') {
        <div class="preview-header">
          <div class="preview-meta">
            <strong>{{ previewRows().length }}</strong> registros encontrados
            @if (parseErrors().length) {
              · <span class="warn-text">{{ parseErrors().length }} filas con problemas</span>
            }
          </div>
          <p-button
            label="Cambiar archivo"
            severity="secondary"
            size="small"
            [text]="true"
            (onClick)="resetImport()"
          />
        </div>

        @if (sheetCounts().planes || sheetCounts().reposiciones) {
          <div class="sheet-badges">
            @if (sheetCounts().planes) {
              <span class="sheet-badge planes">PLANES: {{ sheetCounts().planes }}</span>
            }
            @if (sheetCounts().reposiciones) {
              <span class="sheet-badge repos">REPOSICIONES: {{ sheetCounts().reposiciones }}</span>
            }
          </div>
        }

        <div class="preview-table-wrap">
          <table class="preview-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Hoja</th>
                <th>Nombre</th>
                <th>MIN / Teléfono</th>
                <th>Cédula</th>
                <th>Oficina</th>
                <th>Vendedor</th>
                <th>Fecha activación</th>
              </tr>
            </thead>
            <tbody>
              @for (r of previewRows().slice(0, 15); track $index; let i = $index) {
                <tr [class.row-warn]="!r.name || !r.phone">
                  <td class="text-muted">{{ i + 1 }}</td>
                  <td>
                    <span class="sheet-badge-sm" [class.planes]="r.source === 'planes'" [class.repos]="r.source === 'reposiciones'">
                      {{ r.source === 'reposiciones' ? 'REPOS' : 'PLAN' }}
                    </span>
                  </td>
                  <td>{{ r.name || '—' }}</td>
                  <td class="mono">{{ r.phone || '—' }}</td>
                  <td>{{ r.documentNumber || '—' }}</td>
                  <td>{{ r.officeName || '—' }}</td>
                  <td class="text-muted">{{ r.sellerName || '—' }}</td>
                  <td>{{ r.activationDate || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
          @if (previewRows().length > 15) {
            <p class="text-muted text-sm preview-more">
              … y {{ previewRows().length - 15 }} registros más. Se importarán todos.
            </p>
          }
        </div>

        @if (parseErrors().length) {
          <div class="parse-errors">
            <strong>Filas ignoradas:</strong>
            @for (e of parseErrors(); track $index) {
              <p class="parse-error-row">Fila {{ e.row }}: {{ e.reason }}</p>
            }
          </div>
        }

        <div class="dialog-actions">
          <p-button label="Cancelar" severity="secondary" (onClick)="importDialog = false" />
          <p-button
            [label]="'Importar ' + previewRows().length + ' registros'"
            icon="pi pi-upload"
            [loading]="saving()"
            [disabled]="previewRows().length === 0"
            (onClick)="runImport()"
          />
        </div>
      }

      @if (importStep() === 'result') {
        <div class="result-summary">
          <div class="result-stat success">
            <i class="pi pi-check-circle"></i>
            <div>
              <strong>{{ importResult()?.created ?? 0 }}</strong>
              <span>leads creados</span>
            </div>
          </div>
          @if ((importResult()?.skipped ?? 0) > 0) {
            <div class="result-stat warn">
              <i class="pi pi-exclamation-triangle"></i>
              <div>
                <strong>{{ importResult()?.skipped ?? 0 }}</strong>
                <span>registros omitidos</span>
              </div>
            </div>
          }
        </div>

        @if (importResult()?.errors?.length) {
          <div class="parse-errors">
            <strong>Detalle de errores:</strong>
            @for (e of importResult()!.errors; track $index) {
              <p class="parse-error-row">Fila {{ e.row }}: {{ e.reason }}</p>
            }
          </div>
        }

        <div class="dialog-actions">
          <p-button label="Cerrar" severity="secondary" (onClick)="importDialog = false" />
          @if ((importResult()?.created ?? 0) > 0) {
            <p-button label="Ver leads" icon="pi pi-list" (onClick)="importDialog = false; load()" />
          }
        </div>
      }
    </p-dialog>
  `,
  styles: [`
    .header-actions { display: flex; gap: 0.5rem; }

    .filters-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1rem;
      margin-bottom: 1.25rem;
      align-items: flex-end;
    }
    .filters-grid .sf-field { min-width: 140px; flex: 1; }
    .filters-grid .sf-field:first-child { flex: 2; min-width: 200px; }
    .filter-actions { display: flex; gap: 0.4rem; align-items: flex-end; flex: 0 0 auto !important; min-width: unset !important; }
    .results-count { font-size: 0.8rem; color: var(--sf-text-muted); margin: 0 0 0.6rem; }
    @media (max-width: 640px) { .filters-grid { flex-direction: column; } }

    .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .actions-col { text-align: right; }
    .lead-name { font-size: 0.9rem; }
    .row-link {
      display: inline-flex; align-items: center; gap: 0.3rem;
      color: var(--sf-primary); font-weight: 600; font-size: 0.85rem;
    }
    .row-link:hover { text-decoration: underline; }

    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1rem; }
    @media (max-width: 500px) { .form-grid-2 { grid-template-columns: 1fr; } }
    .req { color: #dc2626; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }

    .upload-zone {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.4rem; padding: 2.5rem 1rem;
      border: 2px dashed var(--sf-border-strong); border-radius: 12px;
      background: var(--sf-surface-2);
      cursor: pointer; transition: border-color 0.15s, background 0.15s;
    }
    .upload-zone:hover { border-color: var(--sf-primary); background: var(--sf-primary-soft); }
    .upload-icon { font-size: 2.5rem; color: #16a34a; }
    .upload-title { font-weight: 700; font-size: 1rem; margin: 0; }
    .upload-hint { font-size: 0.82rem; color: var(--sf-text-muted); margin: 0; }
    .hidden-input { display: none; }

    .template-hint {
      margin-top: 1rem; padding: 0.75rem 1rem;
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
      font-size: 0.82rem; color: #1e40af;
      display: flex; gap: 0.5rem; align-items: flex-start;
    }
    .template-hint i { flex-shrink: 0; margin-top: 0.1rem; }

    .preview-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .warn-text { color: #b45309; }
    .preview-table-wrap {
      overflow-x: auto; max-height: 300px; overflow-y: auto;
      border: 1px solid var(--sf-border); border-radius: 8px;
    }
    .preview-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .preview-table th {
      background: var(--sf-surface-2); padding: 0.45rem 0.65rem;
      text-align: left; font-weight: 600; border-bottom: 1px solid var(--sf-border);
      position: sticky; top: 0;
    }
    .preview-table td { padding: 0.4rem 0.65rem; border-bottom: 1px solid var(--sf-border); }
    .preview-table tr.row-warn td { background: #fef9c3; }
    .preview-more { padding: 0.5rem 0.65rem; }

    .sheet-badges { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
    .sheet-badge {
      padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600;
    }
    .sheet-badge.planes  { background: #dbeafe; color: #1d4ed8; }
    .sheet-badge.repos   { background: #d1fae5; color: #065f46; }
    .sheet-badge-sm {
      display: inline-block; padding: 0.1rem 0.45rem; border-radius: 999px;
      font-size: 0.72rem; font-weight: 600;
    }
    .sheet-badge-sm.planes { background: #dbeafe; color: #1d4ed8; }
    .sheet-badge-sm.repos  { background: #d1fae5; color: #065f46; }

    .parse-errors {
      margin-top: 0.75rem; padding: 0.75rem 1rem;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
      font-size: 0.82rem;
    }
    .parse-error-row { margin: 0.25rem 0 0; color: #b91c1c; }

    .result-summary { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .result-stat {
      flex: 1; display: flex; align-items: center; gap: 0.75rem;
      padding: 1rem; border-radius: 10px;
    }
    .result-stat.success { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .result-stat.warn    { background: #fffbeb; border: 1px solid #fde68a; }
    .result-stat i { font-size: 1.5rem; }
    .result-stat.success i { color: #16a34a; }
    .result-stat.warn    i { color: #b45309; }
    .result-stat strong { display: block; font-size: 1.5rem; line-height: 1; }
    .result-stat span { font-size: 0.82rem; color: var(--sf-text-muted); }
  `],
})
export class LeadsListComponent implements OnInit {
  private readonly leadsService = inject(LeadsService);
  private readonly officesService = inject(OfficesService);
  private readonly usersService = inject(UsersService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  leads          = signal<Lead[]>([]);
  offices        = signal<Office[]>([]);
  sellers        = signal<ManagedUser[]>([]);
  loading        = signal(false);
  saving         = signal(false);
  loadingSellers = signal(false);
  error          = signal<string | null>(null);
  total          = signal(0);

  readonly limit = 25;
  page = 1;

  statusFilter: LeadStatus | null = null;
  officeFilter: string | null = null;
  search  = '';
  dateFrom = '';
  dateTo   = '';

  statuses = Object.values(LeadStatus);
  labels   = LEAD_STATUS_LABELS;
  docTypes = [...DOCUMENT_TYPES];

  basePath  = computed(() => `/${this.auth.role()?.toLowerCase()}/leads`);
  canImport = computed(() => {
    const r = this.auth.role();
    return r === 'ADMIN' || r === 'COORDINADOR';
  });


  // ── Modal: nuevo lead ──────────────────────────────────
  newDialog = false;
  newForm: CreateLead = this.emptyForm();

  // ── Modal: importar Excel ──────────────────────────────
  importDialog = false;
  importStep   = signal<'upload' | 'preview' | 'result'>('upload');
  previewRows  = signal<ImportLeadRow[]>([]);
  parseErrors  = signal<{ row: number; reason: string }[]>([]);
  importResult = signal<ImportResult | null>(null);

  sheetCounts = computed(() => ({
    planes:       this.previewRows().filter((r) => r.source === 'planes').length,
    reposiciones: this.previewRows().filter((r) => r.source === 'reposiciones').length,
  }));

  ngOnInit(): void {
    this.load();
    if (this.canImport()) {
      this.officesService.getAll().subscribe({
        next: (res) => this.offices.set(res.items),
        error: ()    => this.offices.set([]),
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

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.leadsService.getAll({
      status:   this.statusFilter,
      officeId: this.officeFilter,
      search:   this.search.trim() || undefined,
      dateFrom: this.dateFrom || undefined,
      dateTo:   this.dateTo   || undefined,
      page:     this.page,
      limit:    this.limit,
    }).subscribe({
      next:  (res) => {
        this.leads.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar leads');
        this.loading.set(false);
      },
    });
  }

  onOfficeFilterChange(): void {
    this.load();
  }

  clearFilters(): void {
    this.statusFilter = null;
    this.officeFilter = null;
    this.search  = '';
    this.dateFrom = '';
    this.dateTo   = '';
    this.load();
  }

  exportExcel(): void {
    this.leadsService.getAll({
      status:   this.statusFilter,
      officeId: this.officeFilter,
      search:   this.search.trim() || undefined,
      dateFrom: this.dateFrom || undefined,
      dateTo:   this.dateTo   || undefined,
      page:     1,
      limit:    5000,
    }).subscribe({
      next: (res) => {
        const rows = res.items.map((l) => ({
          'Nombre':            l.name,
          'Teléfono':          l.phone,
          'Tipo Doc':          l.documentType ?? '',
          'Num Doc':           l.documentNumber ?? '',
          'Estado':            l.status,
          'Oficina':           l.office?.name ?? '',
          'Vendedor':          l.seller?.name ?? '',
          'Fecha activación':  l.activationDate ?? '',
          'Fuente':            l.source ?? '',
          'Notas':             l.notes ?? '',
          'Creado':            l.createdAt.substring(0, 10),
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Leads');
        XLSX.writeFile(wb, `leads-${new Date().toISOString().substring(0, 10)}.xlsx`);
      },
      error: () => this.toast.error('No se pudo exportar'),
    });
  }

  // ── Nuevo lead manual ──────────────────────────────────
  openNew(): void {
    this.newForm = this.emptyForm();
    this.sellers.set([]);
    this.newDialog = true;
  }

  /** Al cambiar oficina recarga los vendedores de ese punto de venta. */
  onOfficeChange(): void {
    this.newForm.sellerId = undefined;
    this.sellers.set([]);
    if (this.canImport() && this.newForm.officeId) {
      this.loadSellers(this.newForm.officeId);
    }
  }

  private loadSellers(officeId: string): void {
    this.loadingSellers.set(true);
    this.usersService.getSellers(officeId).subscribe({
      next: (res) => { this.sellers.set(res.items); this.loadingSellers.set(false); },
      error: ()    => { this.sellers.set([]);        this.loadingSellers.set(false); },
    });
  }

  saveNew(): void {
    if (!this.newForm.name?.trim() || !this.newForm.phone?.trim()) {
      this.toast.error('Nombre y teléfono son obligatorios');
      return;
    }
    if (this.canImport()) {
      if (!this.newForm.officeId) {
        this.toast.error('Debes seleccionar una oficina');
        return;
      }
      if (!this.newForm.sellerId) {
        this.toast.error('Debes seleccionar un vendedor para este punto de venta');
        return;
      }
    }
    this.saving.set(true);
    const payload: CreateLead = {
      ...this.newForm,
      // Elimina espacios del teléfono antes de enviar (el regex del backend no los acepta)
      phone: this.newForm.phone.replace(/\s+/g, ''),
      source: 'manual',
      officeId: this.newForm.officeId || undefined,
      sellerId: this.newForm.sellerId || undefined,
    };
    this.leadsService.create(payload).subscribe({
      next: () => {
        this.toast.success('Lead creado');
        this.saving.set(false);
        this.newDialog = false;
        this.load();
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo crear el lead');
      },
    });
  }

  // ── Importar Excel ─────────────────────────────────────
  openImport(): void {
    this.resetImport();
    this.importDialog = true;
  }

  resetImport(): void {
    this.importStep.set('upload');
    this.previewRows.set([]);
    this.parseErrors.set([]);
    this.importResult.set(null);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  private processFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb   = XLSX.read(data, { type: 'array', cellDates: false });

      const rows: ImportLeadRow[] = [];
      const errs: { row: number; reason: string }[] = [];

      const sheetNames = wb.SheetNames.map((n) => n.toUpperCase().trim());
      const planesIdx  = sheetNames.findIndex((n) => n === 'PLANES');
      const reposIdx   = sheetNames.findIndex((n) => n === 'REPOSICIONES');

      // ── Hoja PLANES ────────────────────────────────────────────────────
      if (planesIdx >= 0) {
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          wb.Sheets[wb.SheetNames[planesIdx]], { defval: '' },
        );
        raw.forEach((r, idx) => {
          const name       = str(r['Nombre_Cliente']);
          const phone      = str(r['Numero_MIN']);
          const docNumber  = str(r['Nro_Cedula_Cliente']);
          const officeName = str(r['Oficina']);
          const sellerName = str(r['Nombre_Vendedor']);
          if (!name)  { errs.push({ row: idx + 2, reason: `[PLANES] Fila ${idx + 2}: falta Nombre_Cliente` }); return; }
          if (!phone) { errs.push({ row: idx + 2, reason: `[PLANES] Fila ${idx + 2}: falta Numero_MIN (${name})` }); return; }
          rows.push({
            name,
            phone,
            documentType:   docNumber ? 'CC' : undefined,
            documentNumber: docNumber || undefined,
            officeName:     officeName || undefined,
            sellerName:     sellerName || undefined,
            source:         'planes',
          });
        });
      }

      // ── Hoja REPOSICIONES ──────────────────────────────────────────────
      if (reposIdx >= 0) {
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          wb.Sheets[wb.SheetNames[reposIdx]], { defval: '' },
        );
        raw.forEach((r, idx) => {
          const name           = str(r['Nombre_Cliente']);
          const phone          = str(r['Numero_MIN']);
          const docNumber      = str(r['Nro_Cedula_Cliente']);
          const officeName     = str(r['Oficina']);
          const sellerName     = str(r['Nombre_Vendedor']);
          const activationDate = parseExcelDate(r['Fecha_Reposicion']);
          if (!name)  { errs.push({ row: idx + 2, reason: `[REPOSICIONES] Fila ${idx + 2}: falta Nombre_Cliente` }); return; }
          if (!phone) { errs.push({ row: idx + 2, reason: `[REPOSICIONES] Fila ${idx + 2}: falta Numero_MIN (${name})` }); return; }
          rows.push({
            name,
            phone,
            documentType:   docNumber ? 'CC' : undefined,
            documentNumber: docNumber || undefined,
            officeName:     officeName || undefined,
            sellerName:     sellerName || undefined,
            activationDate,
            source:         'reposiciones',
          });
        });
      }

      // ── Fallback: formato genérico (primera hoja) ──────────────────────
      if (planesIdx < 0 && reposIdx < 0) {
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          wb.Sheets[wb.SheetNames[0]], { defval: '' },
        );
        raw.forEach((rawRow, idx) => {
          const row: Partial<ImportLeadRow> = {};
          Object.entries(rawRow).forEach(([col, val]) => {
            const mapped = COL_MAP[col.toLowerCase().trim()];
            if (!mapped) return;
            row[mapped] = mapped === 'activationDate'
              ? parseExcelDate(val)
              : (String(val ?? '').trim() || undefined);
          });
          if (!row.name)  { errs.push({ row: idx + 2, reason: 'Falta el nombre' }); return; }
          if (!row.phone) { errs.push({ row: idx + 2, reason: `Falta el teléfono (${row.name})` }); return; }
          rows.push({ ...row, source: 'excel' } as ImportLeadRow);
        });
      }

      this.previewRows.set(rows);
      this.parseErrors.set(errs);
      this.importStep.set('preview');
    };
    reader.readAsArrayBuffer(file);
  }

  runImport(): void {
    this.saving.set(true);
    this.leadsService.importLeads(this.previewRows()).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.importResult.set(result);
        this.importStep.set('result');
        this.load();
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        this.toast.error(e.userMessage ?? 'Error al importar');
      },
    });
  }

  private emptyForm(): CreateLead {
    return { name: '', phone: '' };
  }
}
