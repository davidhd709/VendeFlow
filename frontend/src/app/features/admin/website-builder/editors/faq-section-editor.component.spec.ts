import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FaqSectionEditorComponent } from './faq-section-editor.component';

describe('FaqSectionEditorComponent', () => {
  const setup = async (data = {}) => {
    await TestBed.configureTestingModule({
      imports: [FaqSectionEditorComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(FaqSectionEditorComponent);
    fixture.componentInstance.data = data;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    return fixture;
  };

  it('carga los datos iniciales desde @Input', async () => {
    const fixture = await setup({ title: '¿Tienes dudas?', variant: 'list', items: [{ question: 'P1', answer: 'R1' }] });
    const c = fixture.componentInstance;

    expect(c.form.title).toBe('¿Tienes dudas?');
    expect(c.variant).toBe('list');
    expect(c.items).toHaveLength(1);
  });

  it('add() agrega una nueva pregunta vacía', async () => {
    const fixture = await setup();
    const c = fixture.componentInstance;

    c.add();

    expect(c.items).toHaveLength(1);
    expect(c.items[0]).toEqual({ question: '', answer: '' });
  });

  it('add() no agrega más de 20 preguntas', async () => {
    const fixture = await setup();
    const c = fixture.componentInstance;

    for (let i = 0; i < 25; i++) c.add();

    expect(c.items).toHaveLength(20);
  });

  it('remove() elimina la pregunta en el índice indicado', async () => {
    const fixture = await setup({
      items: [
        { question: 'P1', answer: 'R1' },
        { question: 'P2', answer: 'R2' },
      ],
    });
    const c = fixture.componentInstance;

    c.remove(0);

    expect(c.items).toHaveLength(1);
    expect(c.items[0].question).toBe('P2');
  });

  it('emit() filtra preguntas con question o answer vacíos', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup();
    const c = fixture.componentInstance;
    c.dataChange.subscribe((v) => emitted.push(v));

    c.items = [
      { question: 'P1', answer: 'R1' },
      { question: '', answer: 'R2' },
      { question: 'P3', answer: '' },
    ];
    c.emit();

    const out = emitted[0] as { items: unknown[] };
    expect(out.items).toHaveLength(1);
  });

  it('emit() incluye variant y campos opcionales si están presentes', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup({ title: 'FAQ', eyebrow: 'Preguntas', variant: 'twoColumns' });
    const c = fixture.componentInstance;
    c.dataChange.subscribe((v) => emitted.push(v));

    c.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out.variant).toBe('twoColumns');
    expect(out.title).toBe('FAQ');
    expect(out.eyebrow).toBe('Preguntas');
  });

  it('emit() no incluye eyebrow cuando está vacío', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup({ eyebrow: '' });
    const c = fixture.componentInstance;
    c.dataChange.subscribe((v) => emitted.push(v));

    c.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out).not.toHaveProperty('eyebrow');
  });
});
