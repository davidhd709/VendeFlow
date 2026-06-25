import {
  Component,
  EventEmitter,
  Input,
  inject,
  OnChanges,
  Output,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
import {
  SECTION_TYPE_ICONS,
  SECTION_TYPE_LABELS,
  WebsiteSection,
  WebsiteSectionType,
} from '@core/models/website-builder.model';

type DragDir = -1 | 1;

/**
 * Panel izquierdo del editor: lista de secciones de la página
 * con orden, visibilidad, selección, y botón para agregar.
 *
 * Emite eventos imperativos (select, move, toggle, remove, add)
 * — el orquestador decide cómo persistir cada cambio.
 */
@Component({
  selector: 'app-section-list',
  standalone: true,
  imports: [ButtonModule, DialogModule],
  template: `
    <div class="head">
      <div>
        <div class="title">Secciones</div>
        <div class="sub text-muted text-xs">
          {{ sections.length }} bloque{{ sections.length === 1 ? '' : 's' }} configurado{{ sections.length === 1 ? '' : 's' }}
        </div>
      </div>
      <p-button
        label="Agregar sección"
        icon="pi pi-plus"
        size="small"
        (onClick)="openAdd()"
      />
    </div>

    <ul class="list">
      @for (s of sections; track s.id; let i = $index) {
        <li
          class="row"
          [class.selected]="s.id === selectedId"
          [class.hidden-section]="!s.visible"
          [class.is-dragging]="dragSrcIndex === i"
          [class.drag-over]="dragOverIndex === i && dragSrcIndex !== i"
          draggable="true"
          (dragstart)="onDragStart($event, i)"
          (dragover)="onDragOver($event, i)"
          (dragleave)="onDragLeave()"
          (drop)="onDrop($event, i)"
          (dragend)="onDragEnd()"
          (click)="select.emit(s.id)"
        >
          <div class="drag-handle" title="Arrastrar para reordenar" (click)="$event.stopPropagation()">
            <i class="pi pi-bars"></i>
          </div>
          <div class="ico" aria-hidden="true"><i class="pi {{ icon(s.type) }}"></i></div>
          <div class="meta">
            <div class="name">{{ label(s.type) }}</div>
          </div>

          <div class="actions" (click)="$event.stopPropagation()">
            <button
              type="button"
              class="icon-btn"
              [title]="s.visible ? 'Ocultar sección' : 'Mostrar sección'"
              [attr.aria-label]="s.visible ? 'Ocultar sección' : 'Mostrar sección'"
              (click)="toggle.emit(s.id)"
            >
              <i class="pi" [class.pi-eye]="s.visible" [class.pi-eye-slash]="!s.visible"></i>
            </button>
            <button
              type="button"
              class="icon-btn danger"
              title="Eliminar sección"
              aria-label="Eliminar sección"
              (click)="confirmRemove(s)"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </li>
      }
    </ul>

    @if (sections.length === 0) {
      <p class="text-muted text-sm empty">
        Agrega una sección para comenzar a construir tu página.
      </p>
    }

    <!-- Modal: agregar sección -->
    <p-dialog
      [(visible)]="addOpen"
      [modal]="true"
      [style]="{ width: '420px' }"
      header="Agregar sección"
      [closable]="true"
      [appendTo]="'body'"
      [baseZIndex]="13000"
      [blockScroll]="true"
      [dismissableMask]="true"
    >
      <p class="text-muted text-sm" style="margin-top:0">
        Elige un bloque para agregarlo al final de la página.
      </p>
      <div class="add-grid">
        @for (t of availableTypes; track t) {
          <button
            type="button"
            class="add-card"
            (click)="pick(t)"
          >
            <i class="pi {{ icon(t) }}"></i>
            <span>{{ label(t) }}</span>
          </button>
        }
      </div>
    </p-dialog>
  `,
  styles: [
    `
      :host { display: block; }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .title { font-weight: 700; font-size: 0.95rem; letter-spacing: -0.01em; }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .row {
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.6rem;
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
        cursor: pointer;
        transition: border-color 0.15s var(--sf-ease), box-shadow 0.15s var(--sf-ease), transform 0.12s var(--sf-ease);
        min-width: 0;
      }
      .row:hover { border-color: var(--sf-border-strong); transform: translateY(-1px); }
      .row:hover .actions { opacity: 1; pointer-events: auto; }
      .row.selected:hover .actions { opacity: 1; pointer-events: auto; }
      .row.is-dragging { opacity: 0.4; transform: scale(0.98); }
      .row.drag-over {
        border-color: var(--sf-primary);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
        transform: translateY(-2px);
      }
      .row.selected {
        border-color: var(--sf-primary);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }
      .row.hidden-section { opacity: 0.55; }
      .drag-handle {
        color: var(--sf-text-muted);
        opacity: 0;
        cursor: grab;
        padding: 0 0.1rem;
        font-size: 0.78rem;
        display: inline-flex;
        align-items: center;
        transition: opacity 0.12s;
        flex-shrink: 0;
      }
      .row:hover .drag-handle { opacity: 0.7; }
      .drag-handle:active { cursor: grabbing; }
      .ico {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--sf-primary-soft);
        color: var(--sf-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
      }
      .meta { min-width: 0; }
      .name {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--sf-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .actions {
        display: inline-flex;
        gap: 0.1rem;
        flex-shrink: 0;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s var(--sf-ease);
      }
      .icon-btn {
        background: transparent;
        border: 1px solid transparent;
        color: var(--sf-text-muted);
        width: 26px;
        height: 26px;
        border-radius: 6px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.78rem;
        transition: background 0.12s var(--sf-ease), color 0.12s var(--sf-ease);
      }
      .icon-btn.edit {
        color: var(--sf-primary);
      }
      .icon-btn:hover:not(:disabled) {
        background: var(--sf-surface);
        color: var(--sf-text);
      }
      .icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .icon-btn.danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }
      .empty {
        margin-top: 0.75rem;
        padding: 1rem;
        border: 1px dashed var(--sf-border-strong);
        border-radius: 10px;
        text-align: center;
        background: var(--sf-surface-2);
      }

      .add-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .add-card {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        padding: 0.85rem 0.5rem;
        background: var(--sf-surface-2);
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--sf-text);
        cursor: pointer;
        transition: border-color 0.15s var(--sf-ease), background 0.15s var(--sf-ease);
      }
      .add-card i { font-size: 1.1rem; color: var(--sf-primary); }
      .add-card:hover { border-color: var(--sf-primary); background: #fff; }
    `,
  ],
})
export class SectionListComponent implements OnChanges {
  private readonly confirmation = inject(ConfirmationService);

  @Input() sections: WebsiteSection[] = [];
  @Input() selectedId: string | null = null;

  @Output() select = new EventEmitter<string>();
  @Output() move = new EventEmitter<{ id: string; dir: DragDir }>();
  @Output() toggle = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
  @Output() add = new EventEmitter<WebsiteSectionType>();
  @Output() reorder = new EventEmitter<string[]>();

  addOpen = false;
  dragSrcIndex = -1;
  dragOverIndex = -1;

  readonly availableTypes: WebsiteSectionType[] = [
    'NAVBAR',
    'HERO',
    'FEATURED_PRODUCTS',
    'SERVICES',
    'BENEFITS',
    'OFFICES',
    'FAQ',
    'CTA',
    'CONTACT',
    'FOOTER',
  ];

  ngOnChanges(): void {
    // Nada por ahora — los inputs se reflejan directo en el template.
  }

  label(t: WebsiteSectionType): string {
    return SECTION_TYPE_LABELS[t];
  }

  icon(t: WebsiteSectionType): string {
    return SECTION_TYPE_ICONS[t];
  }

  openAdd(): void {
    this.addOpen = true;
  }

  pick(type: WebsiteSectionType): void {
    this.add.emit(type);
    this.addOpen = false;
  }

  onDragStart(event: DragEvent, index: number): void {
    this.dragSrcIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverIndex = index;
  }

  onDragLeave(): void {
    this.dragOverIndex = -1;
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    const src = this.dragSrcIndex;
    this.dragSrcIndex = -1;
    this.dragOverIndex = -1;
    if (src === -1 || src === targetIndex) return;
    const list = [...this.sections];
    const [moved] = list.splice(src, 1);
    list.splice(targetIndex, 0, moved);
    this.reorder.emit(list.map((s) => s.id));
  }

  onDragEnd(): void {
    this.dragSrcIndex = -1;
    this.dragOverIndex = -1;
  }

  confirmRemove(s: WebsiteSection): void {
    this.confirmation.confirm({
      header: 'Eliminar sección',
      message: `¿Eliminar la sección "${SECTION_TYPE_LABELS[s.type]}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => this.remove.emit(s.id),
    });
  }
}
