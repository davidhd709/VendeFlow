import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { WebsiteSection } from '@core/models/website-builder.model';
import { SectionPreviewItemComponent } from './section-preview-item.component';

function makeSection(
  type: WebsiteSection['type'],
  data: Record<string, unknown> = {},
): WebsiteSection {
  const now = new Date().toISOString();
  return {
    id: `preview-${type.toLowerCase()}`,
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

describe('SectionPreviewItemComponent', () => {
  const create = async (section: WebsiteSection) => {
    await TestBed.configureTestingModule({
      imports: [SectionPreviewItemComponent],
      providers: [provideNoopAnimations(), provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(SectionPreviewItemComponent);
    fixture.componentInstance.section = section;
    fixture.detectChanges();
    return fixture;
  };

  it('no se rompe con data mínima en FEATURED_PRODUCTS', async () => {
    const fixture = await create(makeSection('FEATURED_PRODUCTS', {}));
    expect(fixture.nativeElement.textContent).toContain('Productos destacados');
  });

  it('no se rompe con data mínima en OFFICES', async () => {
    const fixture = await create(makeSection('OFFICES', {}));
    expect(fixture.nativeElement.textContent).toContain('Oficinas');
  });

  it('no se rompe con data mínima en CTA', async () => {
    const fixture = await create(makeSection('CTA', {}));
    expect(fixture.nativeElement.textContent).toContain('Acción principal');
  });

  it('no se rompe con data mínima en CONTACT', async () => {
    const fixture = await create(makeSection('CONTACT', {}));
    expect(fixture.nativeElement.textContent).toContain('Contáctanos');
  });

  it('no se rompe con data mínima en FOOTER', async () => {
    const fixture = await create(makeSection('FOOTER', {}));
    expect(fixture.nativeElement.textContent).toContain('Powered by SalesFlow');
  });

  it('usa variante por defecto cuando no viene variant', async () => {
    const fixture = await create(makeSection('HERO', { title: 'Hero sin variante' }));
    expect(fixture.componentInstance.heroVariant()).toBe('classic');
  });

  it('usa variant cuando llega en la sección', async () => {
    const fixture = await create(
      makeSection('HERO', { title: 'Hero promo', variant: 'promo' }),
    );
    expect(fixture.componentInstance.heroVariant()).toBe('promo');
  });
});
