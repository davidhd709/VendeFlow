import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService } from 'primeng/api';
import { WebsiteSection } from '@core/models/website-builder.model';
import { SectionListComponent } from './section-list.component';

function makeSection(
  id: string,
  type: WebsiteSection['type'],
  order: number,
  visible = true,
): WebsiteSection {
  const now = new Date().toISOString();
  return {
    id,
    companyId: 'company-a',
    pageId: 'page-home',
    type,
    order,
    visible,
    data: {},
    createdAt: now,
    updatedAt: now,
  };
}

describe('SectionListComponent', () => {
  let confirmation: { confirm: jest.Mock };

  const create = async (sections: WebsiteSection[]) => {
    await TestBed.configureTestingModule({
      imports: [SectionListComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ConfirmationService, useValue: confirmation },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SectionListComponent);
    fixture.componentInstance.sections = sections;
    fixture.componentInstance.selectedId = sections[0]?.id ?? null;
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    confirmation = { confirm: jest.fn() };
  });

  it('renderiza lista de secciones y respeta orden visual', async () => {
    const fixture = await create([
      makeSection('s-faq', 'FAQ', 0),
      makeSection('s-hero', 'HERO', 1),
      makeSection('s-services', 'SERVICES', 2),
    ]);

    const names = Array.from(
      fixture.nativeElement.querySelectorAll('.row .name'),
    ).map((n) => (n as Element).textContent?.trim());

    expect(names).toEqual(['Preguntas frecuentes', 'Hero principal', 'Servicios']);
  });

  it('muestra nombres amigables por tipo de sección', async () => {
    const fixture = await create([
      makeSection('s-hero', 'HERO', 0),
      makeSection('s-products', 'FEATURED_PRODUCTS', 1),
      makeSection('s-cta', 'CTA', 2),
      makeSection('s-contact', 'CONTACT', 3),
    ]);

    const names = fixture.nativeElement.textContent;
    expect(names).toContain('Hero principal');
    expect(names).toContain('Productos destacados');
    expect(names).toContain('Llamado a la acción');
    expect(names).toContain('Contacto');
  });

  it('ya no muestra secciones eliminadas cuando cambia el input', async () => {
    const fixture = await create([
      makeSection('s-hero', 'HERO', 0),
      makeSection('s-faq', 'FAQ', 1),
    ]);

    fixture.componentInstance.sections = [makeSection('s-hero', 'HERO', 0)];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Hero principal');
    expect(fixture.nativeElement.textContent).not.toContain('Preguntas frecuentes');
  });

  it('emite select al seleccionar sección', async () => {
    const fixture = await create([
      makeSection('s-hero', 'HERO', 0),
      makeSection('s-faq', 'FAQ', 1),
    ]);
    const component = fixture.componentInstance;
    const selectSpy = jest.spyOn(component.select, 'emit');

    const rows: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.row'),
    );
    rows[1].click();

    expect(selectSpy).toHaveBeenCalledWith('s-faq');
  });

  it('emite toggle al activar/desactivar sección', async () => {
    const fixture = await create([makeSection('s-hero', 'HERO', 0, true)]);
    const component = fixture.componentInstance;
    const toggleSpy = jest.spyOn(component.toggle, 'emit');

    const toggleBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('button[title="Ocultar sección"]');
    toggleBtn?.click();

    expect(toggleSpy).toHaveBeenCalledWith('s-hero');
  });

  it('reordena internamente al soltar una sección arrastrada', async () => {
    const fixture = await create([
      makeSection('s-hero', 'HERO', 0),
      makeSection('s-faq', 'FAQ', 1),
    ]);
    const component = fixture.componentInstance;
    const reorderSpy = jest.spyOn(component.reorder, 'emit');

    // Simula arrastre: el src está en índice 0
    component['dragSrcIndex'] = 0;

    // Invoca onDrop con un evento mock (jsdom no tiene DragEvent nativo)
    const fakeEvent = { preventDefault: jest.fn() } as unknown as DragEvent;
    component.onDrop(fakeEvent, 1);

    expect(reorderSpy).toHaveBeenCalledWith(['s-faq', 's-hero']);
  });

  it('usa confirm dialog al eliminar y emite remove al aceptar', async () => {
    confirmation.confirm.mockImplementation(({ accept }: { accept?: () => void }) =>
      accept?.(),
    );
    const fixture = await create([makeSection('s-hero', 'HERO', 0, true)]);
    const component = fixture.componentInstance;
    const removeSpy = jest.spyOn(component.remove, 'emit');

    const deleteBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('button[title="Eliminar sección"]');
    deleteBtn?.click();

    expect(confirmation.confirm).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith('s-hero');
  });

  it('abre el modal de agregar por encima del preview', async () => {
    const fixture = await create([makeSection('s-hero', 'HERO', 0, true)]);
    const addBtn: HTMLButtonElement | undefined = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((btn) => (btn as HTMLButtonElement).textContent?.includes('Agregar sección')) as HTMLButtonElement | undefined;

    addBtn?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.addOpen).toBe(true);
    const dialogInBody = document.body.querySelector('.p-dialog');
    expect(dialogInBody).toBeTruthy();
    expect(document.body.textContent).toContain('Agregar sección');
  });
});
