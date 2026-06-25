import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { ApiError } from '@core/models/api-error.model';
import {
  Campaign,
  CampaignRecipient,
  MessageTemplate,
} from '@core/models/campaign.model';
import { Lead } from '@core/models/lead.model';
import { CampaignsService } from '@core/services/campaigns.service';
import { LeadsService } from '@core/services/leads.service';
import { TemplatesService } from '@core/services/templates.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

const MAX = 10;

@Component({
  selector: 'app-vendedor-campaigns',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    TableModule,
    EmptyStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Campañas de WhatsApp"
        subtitle="Selecciona hasta 10 clientes y genera mensajes prellenados."
      />

      <div class="layout">
        <div class="col">
          <app-section-card
            title="Nueva campaña"
            description="Tope de 10 destinatarios por envío."
          >
            <div class="sf-stack">
              <div class="sf-field">
                <label>Nombre de la campaña</label>
                <input pInputText [(ngModel)]="name" placeholder="Promo Mayo" />
              </div>

              <div class="sf-field">
                <label>Plantilla <span class="text-muted">(opcional)</span></label>
                <select
                  class="sf-select"
                  [(ngModel)]="templateId"
                  (ngModelChange)="applyTemplate()"
                >
                  <option value="">— Mensaje libre —</option>
                  @for (t of templates(); track t.id) {
                    <option [value]="t.id">{{ t.name }}</option>
                  }
                </select>
              </div>

              <div class="sf-field">
                <label>Mensaje <span class="text-muted">(usa {{ '{' }}nombre{{ '}' }})</span></label>
                <textarea pTextarea rows="4" [(ngModel)]="message"></textarea>
              </div>

              <div class="sf-field">
                <label class="flex justify-between">
                  <span>Clientes</span>
                  <span
                    class="counter"
                    [class.warn]="selectedIds().length === max"
                  >
                    {{ selectedIds().length }} / {{ max }}
                  </span>
                </label>
                <div class="leads">
                  @for (l of leads(); track l.id) {
                    <label class="lead-row">
                      <input
                        type="checkbox"
                        [checked]="selected[l.id]"
                        [disabled]="!selected[l.id] && selectedIds().length >= max"
                        (change)="toggle(l.id)"
                      />
                      <span class="lead-name">{{ l.name }}</span>
                      <span class="text-muted text-xs mono">{{ l.phone }}</span>
                    </label>
                  }
                  @if (leads().length === 0) {
                    <p class="text-muted text-sm">No tienes clientes para enviar.</p>
                  }
                </div>
              </div>

              <p-button
                label="Generar campaña"
                icon="pi pi-whatsapp"
                [loading]="saving()"
                (onClick)="create()"
              />
            </div>
          </app-section-card>
        </div>

        <div class="col">
          @if (result(); as r) {
            <app-section-card
              title="Mensajes listos"
              description="Abre cada chat y envía el mensaje prellenado."
            >
              <ul class="rec-list">
                @for (rec of r; track rec.id) {
                  <li>
                    <div class="rec-info">
                      <div class="rec-name">{{ rec.name }}</div>
                      <div class="text-muted text-xs mono">{{ rec.phone }}</div>
                    </div>
                    <a
                      [href]="rec.waLink"
                      target="_blank"
                      rel="noopener"
                      class="wa-btn"
                    >
                      <i class="pi pi-whatsapp"></i> Abrir WhatsApp
                    </a>
                  </li>
                }
              </ul>
            </app-section-card>
          } @else {
            <app-section-card
              title="Vista previa"
              description="Al generar la campaña verás aquí los enlaces wa.me."
            >
              <p class="text-muted text-sm">
                Selecciona clientes y un mensaje para empezar.
              </p>
            </app-section-card>
          }
        </div>
      </div>

      <div class="mt-3">
        @if (history().length === 0) {
          <app-empty-state
            icon="pi pi-history"
            title="Sin historial"
            description="Aún no has enviado campañas. Aparecerán aquí cuando lo hagas."
          />
        } @else {
          <app-section-card
            title="Historial"
            description="Tus campañas anteriores."
          >
            <p-table [value]="history()" [paginator]="true" [rows]="10">
              <ng-template pTemplate="header">
                <tr>
                  <th>Campaña</th>
                  <th>Destinatarios</th>
                  <th>Enviada</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-c>
                <tr>
                  <td><strong>{{ c.name }}</strong></td>
                  <td>{{ c.recipientCount }}</td>
                  <td class="text-muted text-sm">
                    {{ c.sentAt ? (c.sentAt | date: 'short') : '—' }}
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </app-section-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.25rem; }
      @media (max-width: 920px) { .layout { grid-template-columns: 1fr; } }
      .col { display: flex; flex-direction: column; gap: 1rem; }

      .leads {
        max-height: 280px;
        overflow: auto;
        border: 1px solid var(--sf-border);
        border-radius: var(--sf-radius-sm);
        padding: 0.4rem;
        background: var(--sf-surface-2);
      }
      .lead-row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.5rem;
        align-items: center;
        padding: 0.35rem 0.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 400;
        margin: 0;
        transition: background 0.12s var(--sf-ease);
      }
      .lead-row:hover { background: var(--sf-surface); }
      .lead-name { font-weight: 500; }
      .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

      .counter { font-weight: 600; font-size: 0.78rem; color: var(--sf-text-muted); }
      .counter.warn { color: var(--sf-warn); }

      .rec-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .rec-list li {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.75rem;
        background: var(--sf-surface-2);
        border-radius: var(--sf-radius-sm);
      }
      .rec-info { flex: 1; min-width: 0; }
      .rec-name { font-weight: 600; }
      .wa-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: #25d366;
        color: #fff;
        padding: 0.4rem 0.7rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.8rem;
        text-decoration: none;
      }
      .wa-btn:hover { filter: brightness(0.95); text-decoration: none; }
    `,
  ],
})
export class VendedorCampaignsComponent implements OnInit {
  private readonly campaignsService = inject(CampaignsService);
  private readonly templatesService = inject(TemplatesService);
  private readonly leadsService = inject(LeadsService);
  private readonly toast = inject(ToastService);

  readonly max = MAX;

  templates = signal<MessageTemplate[]>([]);
  leads = signal<Lead[]>([]);
  history = signal<Campaign[]>([]);
  result = signal<CampaignRecipient[] | null>(null);
  saving = signal(false);

  name = '';
  templateId = '';
  message = '';
  selected: Record<string, boolean> = {};

  selectedIds = computed(() =>
    Object.keys(this.selectedSig()).filter((id) => this.selectedSig()[id]),
  );
  private selectedSig = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.templatesService.getAll().subscribe({
      next: (t) => this.templates.set(t),
      error: () => this.templates.set([]),
    });
    this.leadsService.getAll({ limit: 100 }).subscribe({
      next: (res) => this.leads.set(res.items),
      error: () => this.leads.set([]),
    });
    this.loadHistory();
  }

  loadHistory(): void {
    this.campaignsService.getAll().subscribe({
      next: (res) => this.history.set(res.items),
      error: () => this.history.set([]),
    });
  }

  applyTemplate(): void {
    const tpl = this.templates().find((t) => t.id === this.templateId);
    if (tpl) this.message = tpl.body;
  }

  toggle(id: string): void {
    this.selected[id] = !this.selected[id];
    this.selectedSig.set({ ...this.selected });
  }

  create(): void {
    const recipientLeadIds = this.selectedIds();
    if (!this.name || recipientLeadIds.length === 0) {
      this.toast.error('Indica un nombre y al menos un cliente');
      return;
    }
    this.saving.set(true);
    this.campaignsService
      .create({
        name: this.name,
        templateId: this.templateId || undefined,
        message: this.message || undefined,
        recipientLeadIds,
      })
      .subscribe({
        next: (campaign) => {
          this.result.set(campaign.recipients ?? []);
          this.toast.success('Campaña generada');
          this.saving.set(false);
          this.resetForm();
          this.loadHistory();
        },
        error: (e: ApiError) => {
          this.saving.set(false);
          this.toast.error(e.userMessage ?? 'No se pudo generar la campaña');
        },
      });
  }

  private resetForm(): void {
    this.name = '';
    this.templateId = '';
    this.message = '';
    this.selected = {};
    this.selectedSig.set({});
  }
}
