import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { WebsitePage, WebsiteSection } from '@core/models/website-builder.model';
import { WebsiteBuilderService } from '@core/services/website-builder.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { ToastService } from '@core/services/toast.service';
import { WebsiteBuilderPageComponent } from './website-builder-page.component';

function makeSection(
  id: string,
  type: WebsiteSection['type'],
  order: number,
  visible = true,
  data: Record<string, unknown> = {},
): WebsiteSection {
  const now = new Date().toISOString();
  return {
    id,
    companyId: 'company-a',
    pageId: 'page-home',
    type,
    order,
    visible,
    data,
    createdAt: now,
    updatedAt: now,
  };
}

function makePage(overrides: Partial<WebsitePage> = {}): WebsitePage {
  const now = new Date().toISOString();
  return {
    id: 'page-home',
    companyId: 'company-a',
    slug: 'home',
    title: 'Inicio',
    status: 'DRAFT',
    publishedAt: null,
    publishedSnapshot: null,
    createdAt: now,
    updatedAt: now,
    sections: [],
    ...overrides,
  };
}

describe('WebsiteBuilderPageComponent', () => {
  let builder: {
    listPages: jest.Mock;
    getPage: jest.Mock;
    publish: jest.Mock;
    updateSection: jest.Mock;
    deleteSection: jest.Mock;
    reorder: jest.Mock;
    createSection: jest.Mock;
  };
  let websiteConfig: { getMine: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock; info: jest.Mock };
  let confirmation: { confirm: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [WebsiteBuilderPageComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: WebsiteBuilderService, useValue: builder },
        { provide: WebsiteConfigService, useValue: websiteConfig },
        { provide: ToastService, useValue: toast },
        { provide: ConfirmationService, useValue: confirmation },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WebsiteBuilderPageComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    builder = {
      listPages: jest.fn(),
      getPage: jest.fn(),
      publish: jest.fn(),
      updateSection: jest.fn(),
      deleteSection: jest.fn(),
      reorder: jest.fn(),
      createSection: jest.fn(),
    };
    websiteConfig = { getMine: jest.fn().mockReturnValue(of(null)) };
    toast = { success: jest.fn(), error: jest.fn(), info: jest.fn() };
    confirmation = { confirm: jest.fn() };
  });

  it('renderiza loading state', async () => {
    builder.listPages.mockReturnValue(new Subject<WebsitePage[]>());

    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('renderiza error state cuando falla la carga', async () => {
    builder.listPages.mockReturnValue(
      throwError(() => ({ userMessage: 'No se pudo cargar el editor' })),
    );

    const fixture = await create();
    expect(toast.error).toHaveBeenCalledWith('No se pudo cargar el editor');
    expect(fixture.nativeElement.textContent).toContain(
      'No se pudo cargar la página. Recarga la pestaña.',
    );
  });

  it('carga la página home y muestra sus secciones', async () => {
    const sections = [
      makeSection('s-1', 'HERO', 0, true, { title: 'Hero Draft' }),
      makeSection('s-2', 'SERVICES', 1, false, {
        title: 'SERVICIO OCULTO',
        items: [{ title: 'Oculto' }],
      }),
      makeSection('s-3', 'FAQ', 2, true, {
        title: 'FAQ Draft',
        items: [{ question: 'Q1', answer: 'A1' }],
      }),
    ];
    builder.listPages.mockReturnValue(
      of([
        makePage({ id: 'p-2', slug: 'landing', title: 'Landing' }),
        makePage({ id: 'page-home', slug: 'home', title: 'Inicio Home' }),
      ]),
    );
    builder.getPage.mockReturnValue(
      of(
        makePage({
          id: 'page-home',
          slug: 'home',
          title: 'Inicio Home',
          sections,
          publishedSnapshot: [{ type: 'HERO', visible: true, data: { title: 'Hero Publicado' } }],
        }),
      ),
    );

    const fixture = await create();
    const component = fixture.componentInstance;

    expect(builder.getPage).toHaveBeenCalledWith('page-home');
    expect(component.selectedId()).toBe('s-1');
    expect(fixture.nativeElement.textContent).toContain('Hero principal');
    expect(fixture.nativeElement.textContent).toContain('Servicios');
    expect(fixture.nativeElement.textContent).toContain('Hero Draft');
    expect(fixture.nativeElement.textContent).toContain('FAQ Draft');
    expect(fixture.nativeElement.textContent).not.toContain('SERVICIO OCULTO');
    expect(fixture.nativeElement.textContent).not.toContain('Hero Publicado');
  });

  it('muestra estado vacío del builder cuando no hay secciones visibles', async () => {
    builder.listPages.mockReturnValue(of([makePage({ slug: 'home' })]));
    builder.getPage.mockReturnValue(
      of(
        makePage({
          sections: [makeSection('s-1', 'HERO', 0, false)],
        }),
      ),
    );

    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain(
      'Agrega una sección para comenzar a construir tu página.',
    );
  });

  it('selecciona una sección al hacer click en la lista', async () => {
    builder.listPages.mockReturnValue(of([makePage({ slug: 'home' })]));
    builder.getPage.mockReturnValue(
      of(
        makePage({
          sections: [
            makeSection('s-1', 'HERO', 0),
            makeSection('s-2', 'FAQ', 1),
          ],
        }),
      ),
    );

    const fixture = await create();
    const component = fixture.componentInstance;
    const rows: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.row'),
    );
    rows[1].click();
    fixture.detectChanges();

    expect(component.selectedId()).toBe('s-2');
  });

  it('saveDraft conserva variant y la envía en updateSection', async () => {
    builder.listPages.mockReturnValue(of([makePage({ slug: 'home' })]));
    builder.getPage.mockReturnValue(
      of(
        makePage({
          sections: [
            makeSection('s-1', 'HERO', 0, true, {
              title: 'Hero principal',
              variant: 'centered',
            }),
          ],
        }),
      ),
    );
    builder.updateSection.mockReturnValue(
      of(
        makeSection('s-1', 'HERO', 0, true, {
          title: 'Hero principal',
          variant: 'centered',
        }),
      ),
    );

    const fixture = await create();
    const component = fixture.componentInstance;
    component.saveDraft();

    expect(builder.updateSection).toHaveBeenCalledWith(
      's-1',
      expect.objectContaining({
        data: expect.objectContaining({ variant: 'centered' }),
      }),
    );
  });

  it('permite elegir tema de página y lo guarda en HERO', async () => {
    builder.listPages.mockReturnValue(of([makePage({ slug: 'home' })]));
    builder.getPage.mockReturnValue(
      of(
        makePage({
          sections: [
            makeSection('s-1', 'HERO', 0, true, {
              title: 'Hero principal',
              theme: 'commercial',
            }),
          ],
        }),
      ),
    );
    builder.updateSection.mockReturnValue(
      of(
        makeSection('s-1', 'HERO', 0, true, {
          title: 'Hero principal',
          theme: 'premium',
        }),
      ),
    );

    const fixture = await create();
    const component = fixture.componentInstance;
    const select = fixture.nativeElement.querySelector(
      '#page-theme',
    ) as HTMLSelectElement;
    select.value = 'premium';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    component.saveDraft();

    expect(builder.updateSection).toHaveBeenCalledWith(
      's-1',
      expect.objectContaining({
        data: expect.objectContaining({ theme: 'premium' }),
      }),
    );
  });

  it('llama publish al presionar publicar y muestra éxito', async () => {
    confirmation.confirm.mockImplementation(({ accept }: { accept?: () => void }) =>
      accept?.(),
    );
    builder.listPages.mockReturnValue(of([makePage({ slug: 'home' })]));
    builder.getPage.mockReturnValue(
      of(makePage({ sections: [makeSection('s-1', 'HERO', 0)] })),
    );
    builder.publish.mockReturnValue(
      of(
        makePage({
          status: 'PUBLISHED',
          publishedAt: new Date().toISOString(),
          sections: undefined,
        }),
      ),
    );

    const fixture = await create();
    const publishButton = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((b) => (b as HTMLElement).textContent?.includes('Publicar')) as HTMLElement | undefined;

    publishButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(confirmation.confirm).toHaveBeenCalled();
    expect(builder.publish).toHaveBeenCalledWith('page-home');
    expect(toast.success).toHaveBeenCalledWith('Página publicada');
  });

  it('muestra error al fallar publish', async () => {
    confirmation.confirm.mockImplementation(({ accept }: { accept?: () => void }) =>
      accept?.(),
    );
    builder.listPages.mockReturnValue(of([makePage({ slug: 'home' })]));
    builder.getPage.mockReturnValue(
      of(makePage({ sections: [makeSection('s-1', 'HERO', 0)] })),
    );
    builder.publish.mockReturnValue(
      throwError(() => ({ userMessage: 'No se pudo publicar' })),
    );

    const fixture = await create();
    const publishButton = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((b) => (b as HTMLElement).textContent?.includes('Publicar')) as HTMLElement | undefined;

    publishButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(confirmation.confirm).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('No se pudo publicar');
  });
});
