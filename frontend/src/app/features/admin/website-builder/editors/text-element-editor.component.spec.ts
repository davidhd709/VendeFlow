import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TextElementEditorComponent } from './text-element-editor.component';

describe('TextElementEditorComponent', () => {
  const setup = async (textKey: string, textStyle = {}) => {
    await TestBed.configureTestingModule({
      imports: [TextElementEditorComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(TextElementEditorComponent);
    Object.assign(fixture.componentInstance, { textKey, textStyle });
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    return fixture;
  };

  // ─── inicialización ───────────────────────────────────────────────────

  it('elementLabel traduce claves conocidas', async () => {
    const fixture = await setup('title');
    expect(fixture.componentInstance.elementLabel).toBe('Título');
  });

  it('elementLabel devuelve la clave original para claves desconocidas', async () => {
    const fixture = await setup('unknown-key');
    expect(fixture.componentInstance.elementLabel).toBe('unknown-key');
  });

  it('ngOnChanges carga textStyle en localStyle', async () => {
    const fixture = await setup('title', { color: '#1d4ed8', fontWeight: '700' });
    const c = fixture.componentInstance;

    expect(c.localStyle.color).toBe('#1d4ed8');
    expect(c.localStyle.fontWeight).toBe('700');
  });

  it('ngOnChanges parsea fontSize en px a customPx', async () => {
    const fixture = await setup('title', { fontSize: '24px' });
    expect(fixture.componentInstance.customPx).toBe(24);
  });

  // ─── toggleProp ───────────────────────────────────────────────────────

  it('toggleProp selecciona un valor nuevo', async () => {
    const fixture = await setup('title');
    const c = fixture.componentInstance;

    c.toggleProp('textAlign', 'center');

    expect(c.localStyle.textAlign).toBe('center');
  });

  it('toggleProp deselecciona cuando el valor ya está activo', async () => {
    const fixture = await setup('title', { textAlign: 'center' });
    const c = fixture.componentInstance;

    c.toggleProp('textAlign', 'center');

    expect(c.localStyle.textAlign).toBeUndefined();
  });

  // ─── onCustomSize ─────────────────────────────────────────────────────

  it('onCustomSize aplica el tamaño en px y lo clampea entre 8 y 200', async () => {
    const fixture = await setup('title');
    const c = fixture.componentInstance;

    c.customPx = 500;
    c.onCustomSize();
    expect(c.localStyle.fontSize).toBe('200px');

    c.customPx = 2;
    c.onCustomSize();
    expect(c.localStyle.fontSize).toBe('8px');
  });

  // ─── resetStyle ───────────────────────────────────────────────────────

  it('resetStyle limpia localStyle y emite objeto vacío', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup('title', { color: '#ff0000', fontWeight: '700' });
    fixture.componentInstance.textStyleChange.subscribe((v) => emitted.push(v));

    fixture.componentInstance.resetStyle();

    expect(fixture.componentInstance.localStyle).toEqual({});
    expect(emitted[0]).toEqual({});
  });

  // ─── emit() — omisión de valores por defecto ─────────────────────────

  it('emit() omite fontStyle "normal" del output', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup('title', { fontStyle: 'normal' });
    fixture.componentInstance.textStyleChange.subscribe((v) => emitted.push(v));

    fixture.componentInstance.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out).not.toHaveProperty('fontStyle');
  });

  it('emit() omite textTransform "none" del output', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup('title', { textTransform: 'none' });
    fixture.componentInstance.textStyleChange.subscribe((v) => emitted.push(v));

    fixture.componentInstance.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out).not.toHaveProperty('textTransform');
  });

  it('emit() omite letterSpacing "0em" del output', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup('title', { letterSpacing: '0em' });
    fixture.componentInstance.textStyleChange.subscribe((v) => emitted.push(v));

    fixture.componentInstance.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out).not.toHaveProperty('letterSpacing');
  });
});
