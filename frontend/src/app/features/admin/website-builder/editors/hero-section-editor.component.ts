import { Component, EventEmitter, inject, Input, OnChanges, Output, signal, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { HeroData } from '@core/models/website-builder.model';
import { FilesService } from '@core/services/files.service';

@Component({
  selector: 'app-hero-section-editor',
  standalone: true,
  imports: [FormsModule, InputTextModule, TextareaModule],
  template: `
    <div class="sf-stack">
      <div class="sf-field">
        <label>Diseño de la sección</label>
        <div class="chip-group">
          @for (v of heroVariants; track v.value) {
            <button type="button" class="style-chip" [class.active]="variant === v.value" (click)="variant = v.value; emit()">
              {{ v.label }}
            </button>
          }
        </div>
      </div>

      @if (variant === 'classic') {
        <div class="sf-field">
          <label>Posición de la imagen</label>
          <div class="chip-group">
            <button type="button" class="style-chip" [class.active]="imagePosition === 'right'" (click)="imagePosition='right'; emit()">Derecha</button>
            <button type="button" class="style-chip" [class.active]="imagePosition === 'left'" (click)="imagePosition='left'; emit()">Izquierda</button>
          </div>
        </div>
      }

      <div class="sf-field">
        <label>Altura del hero</label>
        <div class="chip-group">
          <button type="button" class="style-chip" [class.active]="heroHeight === 'auto'" (click)="heroHeight='auto'; emit()">Auto</button>
          <button type="button" class="style-chip" [class.active]="heroHeight === 'medium'" (click)="heroHeight='medium'; emit()">Mediana</button>
          <button type="button" class="style-chip" [class.active]="heroHeight === 'large'" (click)="heroHeight='large'; emit()">Grande</button>
          <button type="button" class="style-chip" [class.active]="heroHeight === 'screen'" (click)="heroHeight='screen'; emit()">Pantalla completa</button>
        </div>
      </div>

      <div class="sf-field">
        <label>Alineación del texto</label>
        <div class="chip-group">
          <button type="button" class="style-chip" [class.active]="textAlign === 'left'" (click)="textAlign='left'; emit()">Izquierda</button>
          <button type="button" class="style-chip" [class.active]="textAlign === 'center'" (click)="textAlign='center'; emit()">Centro</button>
          <button type="button" class="style-chip" [class.active]="textAlign === 'right'" (click)="textAlign='right'; emit()">Derecha</button>
        </div>
      </div>
      <div class="sf-field">
        <label>Texto superior <span class="text-muted text-xs">(opcional)</span></label>
        <input pInputText [(ngModel)]="form.eyebrow" (ngModelChange)="emit()" maxlength="60" />
        <small class="sf-field-help">Se muestra sobre el título principal para dar contexto.</small>
      </div>
      <div class="sf-field">
        <label>Título principal</label>
        <input pInputText [(ngModel)]="form.title" (ngModelChange)="emit()" maxlength="120" />
        <small class="sf-field-help">Recomendado: una promesa clara en máximo 8-10 palabras.</small>
      </div>
      <div class="sf-field">
        <label>Descripción breve</label>
        <textarea
          pTextarea
          rows="3"
          [(ngModel)]="form.subtitle"
          (ngModelChange)="emit()"
          maxlength="280"
        ></textarea>
      </div>
      <div class="sf-field">
        <label>Imagen principal</label>
        <div class="img-upload-row">
          <input
            pInputText
            [(ngModel)]="form.imageUrl"
            (ngModelChange)="onImageUrlChange()"
            placeholder="https://... o sube un archivo"
            maxlength="500"
            class="img-url-input"
          />
          <button
            type="button"
            class="upload-btn"
            [class.uploading]="uploading()"
            [disabled]="uploading()"
            (click)="fileInput.click()"
            title="Subir imagen desde tu equipo"
          >
            @if (uploading()) {
              <i class="pi pi-spin pi-spinner"></i>
            } @else {
              <i class="pi pi-upload"></i>
            }
            <span>{{ uploading() ? 'Subiendo…' : 'Subir' }}</span>
          </button>
          <input
            #fileInput
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style="display:none"
            (change)="onFileSelected($event)"
          />
        </div>
        @if (uploadError()) {
          <small class="upload-error">{{ uploadError() }}</small>
        }
        @if (form.imageUrl?.trim()) {
          <div class="img-preview-wrap">
            @if (!imgError) {
              <img
                [src]="form.imageUrl"
                alt="Vista previa"
                class="img-preview"
                (load)="imgError = false"
                (error)="imgError = true"
              />
            } @else {
              <div class="img-error">
                <i class="pi pi-image"></i> URL inválida o imagen no disponible
              </div>
            }
          </div>
        }
        <small class="sf-field-help">
          Sube una imagen (JPG, PNG, WebP, GIF — máx. 5 MB) o pega una URL. Si lo dejas vacío usamos un placeholder automático.
        </small>
      </div>

      <div class="cta-block">
        <div class="block-title">Botón principal</div>
        <div class="grid-2">
          <div class="sf-field">
            <label>Texto del botón</label>
            <input pInputText [(ngModel)]="primaryLabel" (ngModelChange)="emit()" maxlength="40" />
          </div>
          <div class="sf-field">
            <label>Enlace <span class="text-muted text-xs">(opcional)</span></label>
            <input pInputText [(ngModel)]="primaryHref" (ngModelChange)="emit()" maxlength="500" />
          </div>
        </div>
      </div>

      <div class="cta-block">
        <div class="block-title">Botón secundario</div>
        <div class="grid-2">
          <div class="sf-field">
            <label>Texto del botón</label>
            <input pInputText [(ngModel)]="secondaryLabel" (ngModelChange)="emit()" maxlength="40" />
          </div>
          <div class="sf-field">
            <label>Enlace <span class="text-muted text-xs">(opcional)</span></label>
            <input pInputText [(ngModel)]="secondaryHref" (ngModelChange)="emit()" maxlength="500" />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .cta-block {
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        padding: 0.85rem;
        background: var(--sf-surface-2);
      }
      .block-title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--sf-text-muted);
        margin-bottom: 0.5rem;
      }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
      select {
        width: 100%;
        border: 1px solid var(--sf-border);
        border-radius: 8px;
        height: 2.35rem;
        padding: 0 0.65rem;
        color: var(--sf-text);
        background: #fff;
      }
      @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
      .chip-group { display: flex; flex-wrap: wrap; gap: 0.35rem; }
      .style-chip { padding: 0.28rem 0.65rem; border: 1.5px solid var(--sf-border); border-radius: 6px; background: #fff; font-size: 0.78rem; font-weight: 500; color: var(--sf-text); cursor: pointer; transition: all 0.12s; white-space: nowrap; }
      .style-chip:hover { border-color: var(--sf-primary); color: var(--sf-primary); }
      .style-chip.active { border-color: var(--sf-primary); background: var(--sf-primary); color: #fff; font-weight: 600; }
      .img-upload-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .img-url-input { flex: 1; min-width: 0; }
      .upload-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0 0.85rem;
        height: 2.35rem;
        background: var(--sf-primary, #2563eb);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: background 0.15s;
      }
      .upload-btn:hover:not(:disabled) { background: #1d4ed8; }
      .upload-btn:disabled { opacity: 0.65; cursor: not-allowed; }
      .upload-btn.uploading { background: #64748b; }
      .upload-error {
        color: #dc2626;
        font-size: 0.75rem;
        margin-top: 0.25rem;
        display: block;
      }
      .img-preview-wrap {
        margin-top: 0.5rem;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid var(--sf-border);
        background: var(--sf-surface-2);
        max-height: 160px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .img-preview {
        width: 100%;
        max-height: 160px;
        object-fit: cover;
        display: block;
      }
      .img-error {
        padding: 1rem;
        font-size: 0.8rem;
        color: var(--sf-text-muted);
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
    `,
  ],
})
export class HeroSectionEditorComponent implements OnChanges {
  private readonly filesService = inject(FilesService);

  @Input() data: HeroData = {};
  @Output() dataChange = new EventEmitter<HeroData>();
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly heroVariants = [
    { value: 'classic',  label: 'Clásico (2 col.)' },
    { value: 'centered', label: 'Centrado' },
    { value: 'promo',    label: 'Promocional' },
  ] as const;

  form: HeroData = {};
  variant: NonNullable<HeroData['variant']> = 'classic';
  imagePosition: NonNullable<HeroData['imagePosition']> = 'right';
  heroHeight: NonNullable<HeroData['heroHeight']> = 'auto';
  textAlign: NonNullable<HeroData['textAlign']> = 'left';
  primaryLabel = '';
  primaryHref = '';
  secondaryLabel = '';
  secondaryHref = '';
  imgError = false;
  uploading  = signal(false);
  uploadError = signal<string | null>(null);

  ngOnChanges(): void {
    this.imgError = false;
    this.form = {
      eyebrow: this.data?.eyebrow ?? '',
      title: this.data?.title ?? '',
      subtitle: this.data?.subtitle ?? '',
      imageUrl: this.data?.imageUrl ?? '',
    };
    this.variant       = this.data?.variant       ?? 'classic';
    this.imagePosition = this.data?.imagePosition ?? 'right';
    this.heroHeight    = this.data?.heroHeight    ?? 'auto';
    this.textAlign     = this.data?.textAlign     ?? 'left';
    this.primaryLabel   = this.data?.ctaPrimary?.label  ?? '';
    this.primaryHref    = this.data?.ctaPrimary?.href   ?? '';
    this.secondaryLabel = this.data?.ctaSecondary?.label ?? '';
    this.secondaryHref  = this.data?.ctaSecondary?.href  ?? '';
  }

  onImageUrlChange(): void {
    this.imgError = false;
    this.emit();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadError.set(null);
    this.uploading.set(true);
    this.filesService.upload(file).subscribe({
      next: (res) => {
        this.form = { ...this.form, imageUrl: res.url };
        this.imgError = false;
        this.uploading.set(false);
        this.emit();
      },
      error: (e: { userMessage?: string }) => {
        this.uploadError.set(e.userMessage ?? 'No se pudo subir la imagen');
        this.uploading.set(false);
        // Limpia el input para que el mismo archivo pueda reintentarse
        if (this.fileInputRef?.nativeElement) this.fileInputRef.nativeElement.value = '';
      },
    });
  }

  emit(): void {
    const out: HeroData = { variant: this.variant };
    if (this.form.eyebrow)  out.eyebrow  = this.form.eyebrow;
    if (this.form.title)    out.title    = this.form.title;
    if (this.form.subtitle) out.subtitle = this.form.subtitle;
    if (this.form.imageUrl) out.imageUrl = this.form.imageUrl;
    if (this.imagePosition !== 'right') out.imagePosition = this.imagePosition;
    if (this.heroHeight    !== 'auto')  out.heroHeight    = this.heroHeight;
    if (this.textAlign     !== 'left')  out.textAlign     = this.textAlign;
    if (this.primaryLabel) {
      out.ctaPrimary = { label: this.primaryLabel };
      if (this.primaryHref) out.ctaPrimary.href = this.primaryHref;
    }
    if (this.secondaryLabel) {
      out.ctaSecondary = { label: this.secondaryLabel };
      if (this.secondaryHref) out.ctaSecondary.href = this.secondaryHref;
    }
    this.dataChange.emit(out);
  }
}
