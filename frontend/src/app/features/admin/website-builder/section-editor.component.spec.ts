import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { WebsiteSection } from '@core/models/website-builder.model';
import { SectionEditorComponent } from './section-editor.component';

function makeSection(
  type: WebsiteSection['type'],
  data: Record<string, unknown> = {},
): WebsiteSection {
  const now = new Date().toISOString();
  return {
    id: `sec-${type.toLowerCase()}`,
    companyId: 'company-a',
    pageId: 'page-home',
    type,
    order: 0,
    visible: true,
    data,
    createdAt: now,
    updatedAt: now,
  };
}

describe('SectionEditorComponent', () => {
  const create = async (section: WebsiteSection | null) => {
    await TestBed.configureTestingModule({
      imports: [SectionEditorComponent],
      providers: [provideHttpClient(), provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(SectionEditorComponent);
    fixture.componentInstance.section = section;
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza editor HERO cuando el tipo es HERO', async () => {
    const fixture = await create(
      makeSection('HERO', { title: 'Hero principal', subtitle: 'Sub' }),
    );
    expect(fixture.nativeElement.querySelector('app-hero-section-editor')).toBeTruthy();
  });

  it('renderiza editor SERVICES cuando el tipo es SERVICES', async () => {
    const fixture = await create(
      makeSection('SERVICES', { title: 'Servicios', items: [{ title: 'Reparacion' }] }),
    );
    expect(
      fixture.nativeElement.querySelector('app-services-section-editor'),
    ).toBeTruthy();
  });

  it('renderiza editor BENEFITS cuando el tipo es BENEFITS', async () => {
    const fixture = await create(
      makeSection('BENEFITS', { title: 'Beneficios', items: [{ title: 'Garantía' }] }),
    );
    expect(
      fixture.nativeElement.querySelector('app-services-section-editor'),
    ).toBeTruthy();
  });

  it('renderiza editor FAQ cuando el tipo es FAQ', async () => {
    const fixture = await create(
      makeSection('FAQ', { title: 'FAQ', items: [{ question: 'Q1', answer: 'A1' }] }),
    );
    expect(fixture.nativeElement.querySelector('app-faq-section-editor')).toBeTruthy();
  });

  it('renderiza editor FEATURED_PRODUCTS cuando el tipo es FEATURED_PRODUCTS', async () => {
    const fixture = await create(
      makeSection('FEATURED_PRODUCTS', { title: 'Productos destacados' }),
    );
    expect(
      fixture.nativeElement.querySelector('app-featured-products-section-editor'),
    ).toBeTruthy();
  });

  it('renderiza editor OFFICES cuando el tipo es OFFICES', async () => {
    const fixture = await create(
      makeSection('OFFICES', { title: 'Oficinas y puntos de atención' }),
    );
    expect(
      fixture.nativeElement.querySelector('app-offices-section-editor'),
    ).toBeTruthy();
  });

  it('renderiza editor CTA cuando el tipo es CTA', async () => {
    const fixture = await create(
      makeSection('CTA', { title: '¿No sabes qué celular elegir?' }),
    );
    expect(fixture.nativeElement.querySelector('app-cta-section-editor')).toBeTruthy();
  });

  it('renderiza editor CONTACT cuando el tipo es CONTACT', async () => {
    const fixture = await create(
      makeSection('CONTACT', { title: 'Contáctanos' }),
    );
    expect(
      fixture.nativeElement.querySelector('app-contact-section-editor'),
    ).toBeTruthy();
  });

  it('renderiza editor FOOTER cuando el tipo es FOOTER', async () => {
    const fixture = await create(
      makeSection('FOOTER', { description: 'Footer comercial' }),
    );
    expect(
      fixture.nativeElement.querySelector('app-footer-section-editor'),
    ).toBeTruthy();
  });

  it('maneja tipo desconocido con estado seguro', async () => {
    const unsafeSection = {
      ...makeSection('HERO'),
      type: 'UNKNOWN',
    } as unknown as WebsiteSection;
    const fixture = await create(unsafeSection);
    expect(fixture.nativeElement.textContent).toContain(
      'Configura esta sección desde el panel de propiedades',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Selecciona un diseño para esta sección',
    );
  });

  it('emite cambios del formulario a través de dataChange', async () => {
    const fixture = await create(
      makeSection('HERO', { title: 'Antes' }),
    );
    const component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.dataChange, 'emit');

    const input: HTMLInputElement | null =
      fixture.nativeElement.querySelector('app-hero-section-editor input');
    if (input) {
      input.value = 'Nuevo eyebrow';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(emitSpy).toHaveBeenCalled();
  });
});
