import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import {
  ContactData,
  CtaData,
  FeaturedProductsData,
  FaqData,
  FooterData,
  HeroData,
  NavbarData,
  OfficesData,
  SECTION_TYPE_LABELS,
  SectionStyle,
  ServicesData,
  WebsiteSection,
} from '@core/models/website-builder.model';
import { ContactSectionEditorComponent } from './editors/contact-section-editor.component';
import { CtaSectionEditorComponent } from './editors/cta-section-editor.component';
import { FaqSectionEditorComponent } from './editors/faq-section-editor.component';
import { FeaturedProductsSectionEditorComponent } from './editors/featured-products-section-editor.component';
import { FooterSectionEditorComponent } from './editors/footer-section-editor.component';
import { HeroSectionEditorComponent } from './editors/hero-section-editor.component';
import { NavbarSectionEditorComponent } from './editors/navbar-section-editor.component';
import { OfficesSectionEditorComponent } from './editors/offices-section-editor.component';
import { SectionStylePanelComponent } from './editors/section-style-panel.component';
import { ServicesSectionEditorComponent } from './editors/services-section-editor.component';

interface SectionEditorMeta {
  title: string;
  description: string;
}

const SECTION_EDITOR_META: Partial<Record<WebsiteSection['type'], SectionEditorMeta>> = {
  NAVBAR: {
    title: 'Menú / Header',
    description: 'Configura el logo, los enlaces de navegación y el botón de acción del header.',
  },
  HERO: {
    title: 'Hero principal',
    description: 'Define el mensaje principal y los botones de entrada de tu sitio.',
  },
  SERVICES: {
    title: 'Servicios',
    description: 'Muestra los servicios clave o beneficios que más te diferencian.',
  },
  BENEFITS: {
    title: 'Beneficios',
    description: 'Destaca ventajas comerciales que ayuden a cerrar más cotizaciones.',
  },
  FAQ: {
    title: 'Preguntas frecuentes',
    description: 'Resuelve dudas comunes para mejorar la confianza del visitante.',
  },
  FEATURED_PRODUCTS: {
    title: 'Productos destacados',
    description: 'Prioriza los productos con mayor rotación o margen comercial.',
  },
  OFFICES: {
    title: 'Oficinas',
    description: 'Presenta sedes activas para facilitar atención y cobertura local.',
  },
  CTA: {
    title: 'Llamado a la acción',
    description: 'Refuerza una acción concreta para generar más contactos.',
  },
  CONTACT: {
    title: 'Contacto',
    description: 'Muestra canales de contacto claros para acelerar la respuesta.',
  },
  FOOTER: {
    title: 'Pie de página',
    description: 'Incluye información final útil y enlaces de apoyo para el cliente.',
  },
};

/**
 * Panel derecho: dispatcher de editores por tipo de sección.
 *
 * Incluye el SectionStylePanelComponent encima de cada editor específico.
 * Intercepta `dataChange` de cada hijo y fusiona el estilo antes de emitir
 * al orquestador padre.
 */
@Component({
  selector: 'app-section-editor',
  standalone: true,
  imports: [
    NavbarSectionEditorComponent,
    HeroSectionEditorComponent,
    ServicesSectionEditorComponent,
    FaqSectionEditorComponent,
    FeaturedProductsSectionEditorComponent,
    OfficesSectionEditorComponent,
    CtaSectionEditorComponent,
    ContactSectionEditorComponent,
    FooterSectionEditorComponent,
    SectionStylePanelComponent,
  ],
  template: `
    @if (section) {
      <div class="head">
        <div>
          <div class="eyebrow">Propiedades de sección</div>
          <div class="title">{{ editorMeta().title }}</div>
          <p class="desc">{{ editorMeta().description }}</p>
          <div class="text-muted text-xs">
            {{ section.visible ? 'Sección visible' : 'Sección oculta' }}
          </div>
        </div>
      </div>

      <app-section-style-panel
        [style]="currentStyle"
        (styleChange)="onStyleChange($event)"
      />

      @switch (section.type) {
        @case ('NAVBAR') {
          <app-navbar-section-editor
            [data]="navbarData()"
            (dataChange)="onChildData($any($event))"
          />
        }
        @case ('HERO') {
          <app-hero-section-editor
            [data]="heroData()"
            (dataChange)="onChildData($any($event))"
          />
        }
        @case ('SERVICES') {
          <app-services-section-editor
            [data]="servicesData()"
            [section]="section!"
            (dataChange)="onChildData($any($event))"
          />
        }
        @case ('BENEFITS') {
          <app-services-section-editor
            [data]="servicesData()"
            [section]="section!"
            (dataChange)="onChildData($any($event))"
          />
        }
        @case ('FAQ') {
          <app-faq-section-editor
            [data]="faqData()"
            (dataChange)="onChildData($any($event))"
          />
        }
        @case ('FEATURED_PRODUCTS') {
          <app-featured-products-section-editor
            [data]="featuredProductsData()"
            (dataChange)="onChildData($any($event))"
          />
        }
        @case ('OFFICES') {
          <app-offices-section-editor
            [data]="officesData()"
            (dataChange)="onChildData($any($event))"
          />
        }
        @case ('CTA') {
          <app-cta-section-editor
            [data]="ctaData()"
            (dataChange)="onChildData($any($event))"
          />
        }
        @case ('CONTACT') {
          <app-contact-section-editor
            [data]="contactData()"
            (dataChange)="onChildData($any($event))"
          />
        }
        @case ('FOOTER') {
          <app-footer-section-editor
            [data]="footerData()"
            (dataChange)="onChildData($any($event))"
          />
        }
        @default {
          <div class="placeholder">
            <i class="pi pi-cog"></i>
            <h3>Configura esta sección desde el panel de propiedades</h3>
            <p>
              Selecciona un diseño para esta sección y agrega contenido para ver la vista previa.
            </p>
          </div>
        }
      }
    } @else {
      <div class="placeholder muted">
        <i class="pi pi-arrow-circle-left"></i>
        <h3>Selecciona una sección</h3>
        <p>Elige una sección en el panel izquierdo para editar su contenido.</p>
      </div>
    }
  `,
  styles: [
    `
      :host { display: block; }
      .head {
        display: block;
        margin-bottom: 1rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid var(--sf-border);
      }
      .eyebrow {
        display: inline-block;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--sf-primary);
        margin-bottom: 0.35rem;
      }
      .title {
        font-weight: 700;
        font-size: 1.05rem;
        letter-spacing: -0.01em;
        color: var(--sf-text);
      }
      .desc {
        margin: 0.25rem 0 0.5rem;
        font-size: 0.84rem;
        line-height: 1.45;
        color: var(--sf-text-muted);
      }
      .placeholder {
        padding: 1.5rem 1.25rem;
        background: var(--sf-surface-2);
        border: 1px dashed var(--sf-border-strong);
        border-radius: 12px;
        text-align: center;
        color: var(--sf-text-muted);
      }
      .placeholder.muted { color: var(--sf-text-muted); }
      .placeholder i {
        font-size: 1.6rem;
        color: var(--sf-primary);
        margin-bottom: 0.5rem;
      }
      .placeholder h3 {
        margin: 0.25rem 0 0.35rem;
        font-size: 1rem;
        color: var(--sf-text);
        font-weight: 700;
      }
      .placeholder p { margin: 0; font-size: 0.85rem; }
    `,
  ],
})
export class SectionEditorComponent implements OnChanges {
  @Input() section: WebsiteSection | null = null;
  @Output() dataChange = new EventEmitter<Record<string, unknown>>();

  currentStyle: SectionStyle = {};

  ngOnChanges(): void {
    const raw = (this.section?.data ?? {}) as { style?: SectionStyle } & Record<string, unknown>;
    this.currentStyle = raw.style ?? {};
  }

  label(): string {
    return this.section ? SECTION_TYPE_LABELS[this.section.type] : '';
  }

  editorMeta(): SectionEditorMeta {
    if (!this.section) {
      return {
        title: 'Selecciona una sección',
        description: 'Elige una sección para editar su contenido en este panel.',
      };
    }
    return (
      SECTION_EDITOR_META[this.section.type] ?? {
        title: this.label(),
        description: 'Actualiza el contenido de esta sección desde el panel de propiedades.',
      }
    );
  }

  onChildData(data: Record<string, unknown>): void {
    const merged: Record<string, unknown> = { ...data };
    if (this.currentStyle && Object.keys(this.currentStyle).length > 0) {
      merged['style'] = this.currentStyle;
    }
    this.dataChange.emit(merged);
  }

  onStyleChange(style: SectionStyle): void {
    this.currentStyle = style;
    const raw = (this.section?.data ?? {}) as Record<string, unknown>;
    const { style: _ignored, ...rest } = raw;
    const merged: Record<string, unknown> = { ...rest };
    if (style && Object.keys(style).length > 0) {
      merged['style'] = style;
    }
    this.dataChange.emit(merged);
  }

  navbarData(): NavbarData {
    return (this.section?.data ?? {}) as NavbarData;
  }

  heroData(): HeroData {
    return (this.section?.data ?? {}) as HeroData;
  }

  servicesData(): ServicesData {
    return (this.section?.data ?? {}) as ServicesData;
  }

  faqData(): FaqData {
    return (this.section?.data ?? {}) as FaqData;
  }

  featuredProductsData(): FeaturedProductsData {
    return (this.section?.data ?? {}) as FeaturedProductsData;
  }

  officesData(): OfficesData {
    return (this.section?.data ?? {}) as OfficesData;
  }

  ctaData(): CtaData {
    return (this.section?.data ?? {}) as CtaData;
  }

  contactData(): ContactData {
    return (this.section?.data ?? {}) as ContactData;
  }

  footerData(): FooterData {
    return (this.section?.data ?? {}) as FooterData;
  }
}
