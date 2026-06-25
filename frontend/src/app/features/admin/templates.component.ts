import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ApiError } from '@core/models/api-error.model';
import { CreateTemplate, MessageTemplate } from '@core/models/campaign.model';
import { TemplatesService } from '@core/services/templates.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

interface TemplateVar {
  token: string;
  label: string;
}

const VARS: TemplateVar[] = [
  { token: '{nombre}', label: 'Nombre del cliente' },
  { token: '{producto}', label: 'Producto consultado' },
  { token: '{empresa}', label: 'Nombre de la empresa' },
  { token: '{vendedor}', label: 'Nombre del vendedor' },
];

const MAX_LEN = 700;

@Component({
  selector: 'app-admin-templates',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    TableModule,
    Tag,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Plantillas de WhatsApp"
        subtitle="Mensajes reutilizables que tus vendedores usarán en campañas."
      >
        <p-button
          label="Nueva plantilla"
          icon="pi pi-plus"
          (onClick)="openNew()"
        />
      </app-page-header>

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (templates().length === 0) {
        <app-empty-state
          icon="pi pi-comment"
          title="Aún no tienes plantillas"
          description="Crea mensajes con variables como {nombre} para personalizarlos por cliente."
        >
          <p-button
            label="Crear la primera"
            icon="pi pi-plus"
            (onClick)="openNew()"
          />
        </app-empty-state>
      } @else {
        <app-section-card
          title="Catálogo"
          description="Solo las activas están disponibles para los vendedores."
        >
          <p-table [value]="templates()" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Mensaje</th>
                <th>Estado</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-t>
              <tr>
                <td><strong>{{ t.name }}</strong></td>
                <td class="msg-cell">{{ t.body }}</td>
                <td>
                  <p-tag
                    [value]="t.isActive ? 'Activa' : 'Inactiva'"
                    [severity]="t.isActive ? 'success' : 'secondary'"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </app-section-card>
      }
    </div>

    <p-dialog
      header="Nueva plantilla"
      [(visible)]="dialog"
      [modal]="true"
      [style]="{ width: '520px' }"
    >
      <div class="sf-stack">
        <div class="sf-field">
          <label>Nombre</label>
          <input
            pInputText
            [(ngModel)]="form.name"
            placeholder="Ej. Promo iPhone"
          />
          @if (touched && !form.name.trim()) {
            <small class="sf-field-error">El nombre es obligatorio.</small>
          }
        </div>

        <div class="vars-card">
          <div class="vars-head">
            <span class="vars-title">Variables disponibles</span>
            <span class="text-muted text-xs">Click para insertar</span>
          </div>
          <div class="vars-list">
            @for (v of vars; track v.token) {
              <button
                type="button"
                class="var-chip"
                (click)="insertVar(v.token)"
                [attr.aria-label]="'Insertar ' + v.token"
              >
                <code>{{ v.token }}</code>
                <span class="text-muted">{{ v.label }}</span>
              </button>
            }
          </div>
        </div>

        <div class="sf-field">
          <label>
            Mensaje
            <span
              class="counter"
              [class.warn]="length() > maxLen - 50"
              [class.over]="length() > maxLen"
            >
              {{ length() }}/{{ maxLen }}
            </span>
          </label>
          <textarea
            pTextarea
            rows="5"
            [(ngModel)]="form.body"
            [maxlength]="maxLen"
            placeholder="Hola {nombre}, te escribo de {empresa}. Tenemos una oferta en {producto}..."
          ></textarea>
          @if (touched && !form.body.trim()) {
            <small class="sf-field-error">El mensaje es obligatorio.</small>
          }
          <small class="sf-field-help">
            Las variables se reemplazan al enviar la campaña.
          </small>
        </div>
      </div>

      <div class="dialog-actions">
        <p-button
          label="Cancelar"
          severity="secondary"
          (onClick)="dialog = false"
        />
        <p-button
          label="Guardar plantilla"
          icon="pi pi-save"
          [loading]="saving()"
          (onClick)="save()"
        />
      </div>
    </p-dialog>
  `,
  styles: [
    `
      .msg-cell {
        max-width: 480px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--sf-text-muted);
      }
      .vars-card {
        background: var(--sf-surface-2);
        border: 1px solid var(--sf-border);
        border-radius: var(--sf-radius-sm);
        padding: 0.75rem;
      }
      .vars-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.5rem;
      }
      .vars-title {
        font-weight: 600;
        font-size: 0.85rem;
      }
      .vars-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .var-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.6rem;
        background: var(--sf-surface);
        border: 1px solid var(--sf-border);
        border-radius: 999px;
        cursor: pointer;
        font: inherit;
        font-size: 0.78rem;
        transition: background 0.12s var(--sf-ease), transform 0.04s ease;
      }
      .var-chip:hover {
        background: var(--sf-primary-soft);
        border-color: rgba(37, 99, 235, 0.25);
      }
      .var-chip:active { transform: translateY(1px); }
      .var-chip code {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        color: var(--sf-primary);
        font-weight: 700;
      }
      .counter {
        font-weight: 500;
        font-size: 0.72rem;
        color: var(--sf-text-muted);
        margin-left: 0.5rem;
      }
      .counter.warn { color: var(--sf-warn); }
      .counter.over { color: var(--sf-danger); }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.25rem;
      }
    `,
  ],
})
export class AdminTemplatesComponent implements OnInit {
  private readonly service = inject(TemplatesService);
  private readonly toast = inject(ToastService);

  templates = signal<MessageTemplate[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);
  dialog = false;
  touched = false;
  form: CreateTemplate = { name: '', body: '' };

  readonly vars = VARS;
  readonly maxLen = MAX_LEN;

  length = computed(() => this.form.body.length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (items) => {
        this.templates.set(items);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar plantillas');
        this.loading.set(false);
      },
    });
  }

  openNew(): void {
    this.form = { name: '', body: '' };
    this.touched = false;
    this.dialog = true;
  }

  insertVar(token: string): void {
    this.form.body = (this.form.body ?? '') + token;
  }

  save(): void {
    this.touched = true;
    if (!this.form.name.trim() || !this.form.body.trim()) return;
    this.saving.set(true);
    this.service.create(this.form).subscribe({
      next: () => {
        this.toast.success('Plantilla creada');
        this.saving.set(false);
        this.dialog = false;
        this.load();
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo crear la plantilla');
      },
    });
  }
}
