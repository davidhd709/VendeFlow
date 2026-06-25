import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ServicesSectionEditorComponent } from './services-section-editor.component';

describe('ServicesSectionEditorComponent', () => {
  const setup = async (data = {}) => {
    await TestBed.configureTestingModule({
      imports: [ServicesSectionEditorComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(ServicesSectionEditorComponent);
    fixture.componentInstance.data = data;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    return fixture;
  };

  it('carga los datos iniciales desde @Input', async () => {
    const fixture = await setup({
      title: 'Nuestros servicios',
      variant: 'list',
      items: [{ title: 'Garantía', description: '12 meses', icon: 'pi-shield' }],
    });
    const c = fixture.componentInstance;

    expect(c.form.title).toBe('Nuestros servicios');
    expect(c.variant).toBe('list');
    expect(c.items).toHaveLength(1);
  });

  it('add() agrega un nuevo item con icono por defecto', async () => {
    const fixture = await setup();
    const c = fixture.componentInstance;

    c.add();

    expect(c.items).toHaveLength(1);
    expect(c.items[0].icon).toBe('pi-check');
    expect(c.items[0].title).toBe('');
  });

  it('add() no agrega más de 12 items', async () => {
    const fixture = await setup();
    const c = fixture.componentInstance;

    for (let i = 0; i < 15; i++) c.add();

    expect(c.items).toHaveLength(12);
  });

  it('remove() elimina el item en el índice indicado', async () => {
    const fixture = await setup({
      items: [
        { title: 'A', description: '', icon: 'pi-a' },
        { title: 'B', description: '', icon: 'pi-b' },
      ],
    });
    const c = fixture.componentInstance;

    c.remove(0);

    expect(c.items).toHaveLength(1);
    expect(c.items[0].title).toBe('B');
  });

  it('emit() filtra items sin título', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup();
    const c = fixture.componentInstance;
    c.dataChange.subscribe((v) => emitted.push(v));

    c.items = [
      { title: 'Garantía', description: '12 meses', icon: 'pi-shield' },
      { title: '', description: 'Sin título', icon: 'pi-x' },
    ];
    c.emit();

    const out = emitted[0] as { items: unknown[] };
    expect(out.items).toHaveLength(1);
  });

  it('emit() incluye variant, title y eyebrow cuando están presentes', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup({ title: 'Servicios', eyebrow: 'Lo que ofrecemos', variant: 'featured' });
    const c = fixture.componentInstance;
    c.dataChange.subscribe((v) => emitted.push(v));

    c.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out.variant).toBe('featured');
    expect(out.title).toBe('Servicios');
    expect(out.eyebrow).toBe('Lo que ofrecemos');
  });

  it('emit() omite description e icon cuando están vacíos', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup();
    const c = fixture.componentInstance;
    c.dataChange.subscribe((v) => emitted.push(v));

    c.items = [{ title: 'Solo título', description: '', icon: '' }];
    c.emit();

    const out = emitted[0] as { items: Record<string, unknown>[] };
    expect(out.items[0]).not.toHaveProperty('description');
    expect(out.items[0]).not.toHaveProperty('icon');
  });
});
