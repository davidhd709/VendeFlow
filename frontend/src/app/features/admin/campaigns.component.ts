import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { ApiError } from '@core/models/api-error.model';
import {
  Campaign,
  CampaignRecipient,
  ReactivationResult,
  ReactivationSuggestion,
  ReactivationType,
} from '@core/models/campaign.model';
import { CampaignsService } from '@core/services/campaigns.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

interface CampaignType {
  key: ReactivationType;
  icon: string;
  label: string;
  description: string;
  detail: string;
}

const CAMPAIGN_TYPES: CampaignType[] = [
  {
    key: 'PLAN_RENEWAL',
    icon: 'pi-refresh',
    label: 'Renovación de plan',
    description: 'Clientes con plan activo próximo a cumplir un año.',
    detail: 'Detecta automáticamente a quienes activaron su plan hace 10-14 meses — el momento exacto en que los planes de telefonía se renuevan. Llega antes que la competencia.',
  },
  {
    key: 'EQUIPMENT_UPGRADE',
    icon: 'pi-mobile',
    label: 'Upgrade de equipo',
    description: 'Clientes cuyo equipo tiene 15-24 meses de uso.',
    detail: 'Los ciclos de cambio de celular en Colombia promedian 18 meses. Este tipo identifica a esos clientes con precisión para ofrecerles el salto tecnológico en el momento oportuno.',
  },
  {
    key: 'ANNIVERSARY',
    icon: 'pi-star',
    label: 'Aniversario del cliente',
    description: 'Clientes que compraron hace exactamente un año.',
    detail: 'Un mensaje en el aniversario de compra tiene tasas de respuesta 3x mayores que mensajes genéricos. Se siente personal porque lo es — llevas el dato exacto.',
  },
  {
    key: 'DORMANT_BUYER',
    icon: 'pi-clock',
    label: 'Compradores dormidos',
    description: 'Clientes que compraron pero llevan 60+ días sin contacto.',
    detail: 'El mejor cliente es el que ya confió en ti. Este tipo recupera relaciones que se enfriaron después de la venta, antes de que busquen a otra tienda.',
  },
];

const MAX = 10;

@Component({
  selector: 'app-admin-campaigns',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    TextareaModule,
    MessageModule,
    EmptyStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Campañas de reactivación"
        subtitle="Identifica el momento exacto para contactar a cada cliente. El sistema selecciona a quienes más probabilidad tienen de volver a comprar."
      />

      @if (!activeType()) {
        <!-- Vista de selección de tipo -->
        <div class="types-grid">
          @for (t of types; track t.key) {
            <button class="type-card" (click)="selectType(t.key)">
              <div class="type-icon">
                <i class="pi {{ t.icon }}"></i>
              </div>
              <div class="type-body">
                <div class="type-label">{{ t.label }}</div>
                <div class="type-desc">{{ t.description }}</div>
                <div class="type-detail">{{ t.detail }}</div>
              </div>
              <div class="type-arrow">
                <i class="pi pi-chevron-right"></i>
              </div>
            </button>
          }
        </div>

        @if (history().length > 0) {
          <div class="mt-3">
            <app-section-card
              title="Historial de campañas"
              description="Campañas enviadas desde esta empresa."
            >
              <div class="history-list">
                @for (c of history(); track c.id) {
                  <div class="history-row">
                    <div class="history-info">
                      <div class="history-name">{{ c.name }}</div>
                      <div class="text-muted text-xs">
                        {{ c.recipientCount }} destinatario{{ c.recipientCount !== 1 ? 's' : '' }}
                        · {{ c.sentAt ? formatDate(c.sentAt) : '—' }}
                      </div>
                    </div>
                    <span class="badge-sent">Enviada</span>
                  </div>
                }
              </div>
            </app-section-card>
          </div>
        }

      } @else {
        <!-- Vista de configuración de campaña -->
        <div class="campaign-layout">
          <div class="campaign-left">
            <app-section-card
              [title]="currentTypeInfo()!.label"
              [description]="currentTypeInfo()!.detail"
            >
              <button class="back-btn" (click)="goBack()">
                <i class="pi pi-arrow-left"></i> Cambiar tipo
              </button>
            </app-section-card>

            <app-section-card
              title="Configurar mensaje"
              [description]="'Personaliza el texto. Usa ' + '{' + 'nombre' + '}' + ' para insertar el nombre del cliente.'"
            >
              <div class="sf-stack">
                <div class="sf-field">
                  <label>Nombre de la campaña <span class="text-danger">*</span></label>
                  <input
                    class="sf-input"
                    [(ngModel)]="campaignName"
                    [placeholder]="'Reactivación — ' + currentTypeInfo()!.label"
                  />
                </div>
                <div class="sf-field">
                  <label>Mensaje <span class="text-muted text-xs">(usa {{ '{' }}nombre{{ '}' }})</span></label>
                  <textarea
                    pTextarea
                    rows="5"
                    [(ngModel)]="message"
                    class="w-full"
                  ></textarea>
                </div>
                <p-button
                  label="Generar links de WhatsApp"
                  icon="pi pi-whatsapp"
                  [loading]="sending()"
                  [disabled]="selectedIds().length === 0"
                  (onClick)="send()"
                />
                @if (selectedIds().length === 0) {
                  <p-message severity="info" text="Selecciona al menos un cliente de la lista." styleClass="w-full" />
                }
              </div>
            </app-section-card>
          </div>

          <div class="campaign-right">
            @if (loadingLeads()) {
              <app-section-card title="Clientes elegibles" description="Cargando...">
                <div class="loading-pulse">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="pulse-row"></div>
                  }
                </div>
              </app-section-card>
            } @else if (suggestions().length === 0) {
              <app-empty-state
                icon="pi pi-users"
                title="Sin clientes elegibles ahora"
                description="No hay clientes que coincidan con este criterio en este momento. Prueba otro tipo de campaña."
              />
            } @else {
              <app-section-card
                title="Clientes elegibles"
                [description]="suggestions().length + ' clientes encontrados. Selecciona hasta ' + max + '.'"
              >
                <ul class="leads-list">
                  @for (s of suggestions(); track s.leadId) {
                    <li
                      class="lead-item"
                      [class.selected]="isSelected(s.leadId)"
                      [class.disabled]="!isSelected(s.leadId) && selectedIds().length >= max"
                      (click)="toggleLead(s)"
                    >
                      <div class="lead-check">
                        <i class="pi" [class.pi-check-circle]="isSelected(s.leadId)" [class.pi-circle]="!isSelected(s.leadId)"></i>
                      </div>
                      <div class="lead-info">
                        <div class="lead-name">{{ s.name }}</div>
                        <div class="lead-context">
                          <i class="pi pi-info-circle"></i> {{ s.context }}
                        </div>
                        <div class="lead-phone mono text-xs">{{ s.phone }}</div>
                      </div>
                    </li>
                  }
                </ul>
                <div class="selection-bar">
                  <span>{{ selectedIds().length }} / {{ max }} seleccionados</span>
                  @if (selectedIds().length > 0) {
                    <button class="clear-btn" (click)="clearSelection()">Limpiar</button>
                  }
                </div>
              </app-section-card>
            }

            @if (result(); as r) {
              <app-section-card
                title="Links listos"
                description="Haz clic en cada botón para abrir WhatsApp con el mensaje prellenado."
              >
                <ul class="result-list">
                  @for (rec of r; track rec.id) {
                    <li class="result-item">
                      <div class="result-info">
                        <div class="result-name">{{ rec.name }}</div>
                        <div class="text-muted text-xs mono">{{ rec.phone }}</div>
                      </div>
                      <a
                        [href]="rec.waLink"
                        target="_blank"
                        rel="noopener"
                        class="wa-btn"
                      >
                        <i class="pi pi-whatsapp"></i> Enviar
                      </a>
                    </li>
                  }
                </ul>
                <div class="result-tip">
                  <i class="pi pi-lightbulb"></i>
                  Cada link abre WhatsApp con el mensaje personalizado para ese cliente.
                </div>
              </app-section-card>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .types-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    @media (max-width: 768px) { .types-grid { grid-template-columns: 1fr; } }

    .type-card {
      all: unset;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--sf-surface);
      border: 1.5px solid var(--sf-border);
      border-radius: var(--sf-radius);
      cursor: pointer;
      transition: border-color 0.15s var(--sf-ease), box-shadow 0.15s var(--sf-ease), transform 0.1s var(--sf-ease);
      text-align: left;
      width: 100%;
      box-sizing: border-box;
    }
    .type-card:hover {
      border-color: var(--sf-primary);
      box-shadow: 0 4px 20px rgba(37,99,235,.1);
      transform: translateY(-1px);
    }
    .type-icon {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--sf-primary-soft), rgba(37,99,235,.15));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .type-icon i { font-size: 1.25rem; color: var(--sf-primary); }
    .type-body { flex: 1; min-width: 0; }
    .type-label { font-weight: 700; font-size: 1rem; color: var(--sf-text); margin-bottom: 0.2rem; }
    .type-desc { font-size: 0.82rem; color: var(--sf-text-muted); margin-bottom: 0.5rem; }
    .type-detail { font-size: 0.78rem; color: var(--sf-text-muted); line-height: 1.5; }
    .type-arrow { flex-shrink: 0; color: var(--sf-text-muted); margin-top: 0.15rem; }

    .campaign-layout {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 1.25rem;
      align-items: start;
    }
    @media (max-width: 920px) { .campaign-layout { grid-template-columns: 1fr; } }
    .campaign-left, .campaign-right { display: flex; flex-direction: column; gap: 1rem; }

    .back-btn {
      all: unset;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--sf-text-muted);
      padding: 0.35rem 0.6rem;
      border-radius: 8px;
      transition: background 0.12s var(--sf-ease), color 0.12s;
      margin-bottom: 0.5rem;
    }
    .back-btn:hover { background: var(--sf-surface-2); color: var(--sf-primary); }

    .leads-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.35rem; }
    .lead-item {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 0.6rem;
      align-items: center;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: background 0.12s var(--sf-ease), border-color 0.12s;
      background: var(--sf-surface-2);
    }
    .lead-item:hover:not(.disabled) { background: var(--sf-surface); border-color: var(--sf-primary-soft); }
    .lead-item.selected { background: var(--sf-primary-soft); border-color: var(--sf-primary); }
    .lead-item.disabled { opacity: 0.45; cursor: not-allowed; }
    .lead-check i { font-size: 1.1rem; }
    .lead-item.selected .lead-check i { color: var(--sf-primary); }
    .lead-item:not(.selected) .lead-check i { color: var(--sf-border); }
    .lead-name { font-weight: 600; font-size: 0.88rem; }
    .lead-context { font-size: 0.72rem; color: var(--sf-primary); margin-top: 0.1rem; display: flex; align-items: center; gap: 0.25rem; }
    .lead-phone { margin-top: 0.05rem; color: var(--sf-text-muted); }
    .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

    .selection-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--sf-text-muted);
    }
    .clear-btn { all: unset; cursor: pointer; color: var(--sf-danger); font-size: 0.78rem; }
    .clear-btn:hover { text-decoration: underline; }

    .loading-pulse { display: flex; flex-direction: column; gap: 0.5rem; }
    .pulse-row {
      height: 52px;
      background: linear-gradient(90deg, var(--sf-surface-2) 25%, var(--sf-surface) 50%, var(--sf-surface-2) 75%);
      background-size: 200% 100%;
      animation: pulse 1.4s infinite;
      border-radius: 10px;
    }
    @keyframes pulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .result-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .result-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      background: var(--sf-surface-2);
      border-radius: 10px;
    }
    .result-info { flex: 1; min-width: 0; }
    .result-name { font-weight: 600; font-size: 0.88rem; }
    .wa-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #25d366;
      color: #fff;
      padding: 0.4rem 0.8rem;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.78rem;
      text-decoration: none;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .wa-btn:hover { filter: brightness(0.92); text-decoration: none; }
    .result-tip {
      margin-top: 0.75rem;
      font-size: 0.75rem;
      color: var(--sf-text-muted);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .history-list { display: flex; flex-direction: column; gap: 0.4rem; }
    .history-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.75rem;
      background: var(--sf-surface-2);
      border-radius: 8px;
    }
    .history-name { font-weight: 600; font-size: 0.88rem; }
    .badge-sent {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--sf-success);
      background: var(--sf-success-soft);
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
    }
    .mt-3 { margin-top: 1.5rem; }
    .w-full { width: 100%; }
  `],
})
export class AdminCampaignsComponent implements OnInit {
  private readonly campaignsService = inject(CampaignsService);
  private readonly toast = inject(ToastService);

  readonly types = CAMPAIGN_TYPES;
  readonly max = MAX;

  activeType   = signal<ReactivationType | null>(null);
  suggestions  = signal<ReactivationSuggestion[]>([]);
  loadingLeads = signal(false);
  sending      = signal(false);
  result       = signal<CampaignRecipient[] | null>(null);
  history      = signal<Campaign[]>([]);

  campaignName = '';
  message      = '';

  private _selected = signal<Set<string>>(new Set());

  selectedIds = () => [...this._selected()];
  isSelected  = (id: string) => this._selected().has(id);

  currentTypeInfo = () => this.types.find((t) => t.key === this.activeType()) ?? null;

  ngOnInit(): void {
    this.loadHistory();
  }

  selectType(type: ReactivationType): void {
    this.activeType.set(type);
    this.result.set(null);
    this._selected.set(new Set());
    this.campaignName = this.types.find((t) => t.key === type)!.label + ' — ' + new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    this.loadLeads(type);
  }

  goBack(): void {
    this.activeType.set(null);
    this.suggestions.set([]);
    this.result.set(null);
    this._selected.set(new Set());
  }

  toggleLead(s: ReactivationSuggestion): void {
    const set = new Set(this._selected());
    if (set.has(s.leadId)) {
      set.delete(s.leadId);
    } else if (set.size < MAX) {
      set.add(s.leadId);
    }
    this._selected.set(set);
  }

  clearSelection(): void {
    this._selected.set(new Set());
  }

  send(): void {
    const ids = this.selectedIds();
    if (!this.campaignName.trim() || ids.length === 0) {
      this.toast.error('Indica un nombre y selecciona al menos un cliente');
      return;
    }
    if (!this.message.trim()) {
      this.toast.error('El mensaje no puede estar vacío');
      return;
    }
    this.sending.set(true);
    this.campaignsService.create({
      name: this.campaignName,
      message: this.message,
      recipientLeadIds: ids,
    }).subscribe({
      next: (campaign) => {
        this.result.set(campaign.recipients ?? []);
        this.sending.set(false);
        this._selected.set(new Set());
        this.toast.success('¡Campaña generada! Abre los links de WhatsApp.');
        this.loadHistory();
      },
      error: (e: ApiError) => {
        this.sending.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo generar la campaña');
      },
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private loadLeads(type: ReactivationType): void {
    this.loadingLeads.set(true);
    this.campaignsService.getReactivation(type).subscribe({
      next: (res) => {
        this.suggestions.set(res.leads);
        this.message = res.suggestedMessage;
        this.loadingLeads.set(false);
      },
      error: () => {
        this.suggestions.set([]);
        this.loadingLeads.set(false);
      },
    });
  }

  private loadHistory(): void {
    this.campaignsService.getAll().subscribe({
      next: (res) => this.history.set(res.items),
      error: () => {},
    });
  }
}
