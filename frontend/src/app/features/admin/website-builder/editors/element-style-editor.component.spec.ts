import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ElementStyleEditorComponent } from './element-style-editor.component';

describe('ElementStyleEditorComponent', () => {
  const setup = async (elementKey: string, extras: Record<string, unknown> = {}) => {
    await TestBed.configureTestingModule({
      imports: [ElementStyleEditorComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(ElementStyleEditorComponent);
    Object.assign(fixture.componentInstance, { elementKey, ...extras });
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    return fixture;
  };

  // ─── getters de tipo de elemento ─────────────────────────────────────

  it('isButton es true para primary-btn', async () => {
    const fixture = await setup('primary-btn');
    expect(fixture.componentInstance.isButton).toBe(true);
  });

  it('isButton es true para secondary-btn', async () => {
    const fixture = await setup('secondary-btn');
    expect(fixture.componentInstance.isButton).toBe(true);
  });

  it('isCard es true para card', async () => {
    const fixture = await setup('card');
    expect(fixture.componentInstance.isCard).toBe(true);
  });

  it('isImage es true para image', async () => {
    const fixture = await setup('image');
    expect(fixture.componentInstance.isImage).toBe(true);
  });

  it('elementLabel traduce claves conocidas', async () => {
    const fixture = await setup('primary-btn');
    expect(fixture.componentInstance.elementLabel).toBe('Botón principal');
  });

  // ─── rCss / sCss helpers ─────────────────────────────────────────────

  it('rCss convierte tokens de radio a px', async () => {
    const fixture = await setup('primary-btn');
    const c = fixture.componentInstance;

    expect(c.rCss('sm')).toBe('6px');
    expect(c.rCss('full')).toBe('999px');
    expect(c.rCss(undefined)).toBeNull();
  });

  it('sCss convierte tokens de sombra a CSS', async () => {
    const fixture = await setup('card');
    const c = fixture.componentInstance;

    expect(c.sCss('none')).toBe('none');
    expect(c.sCss('md')).toContain('rgba');
    expect(c.sCss(undefined)).toBeNull();
  });

  // ─── applyPreset / togglePropBtn ─────────────────────────────────────

  it('applyPreset para btn-bg emite buttonStyleChange', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup('primary-btn');
    fixture.componentInstance.buttonStyleChange.subscribe((v) => emitted.push(v));

    fixture.componentInstance.applyPreset('btn-bg', '#1d4ed8');

    expect(emitted).toHaveLength(1);
    expect((emitted[0] as Record<string, unknown>).bgColor).toBe('#1d4ed8');
  });

  it('togglePropBtn deselecciona si se selecciona el mismo valor', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup('primary-btn', { buttonStyle: { borderRadius: 'md' } });
    fixture.componentInstance.buttonStyleChange.subscribe((v) => emitted.push(v));

    fixture.componentInstance.togglePropBtn('borderRadius', 'md');

    const out = emitted[0] as Record<string, unknown>;
    expect(out).not.toHaveProperty('borderRadius');
  });

  // ─── reset ────────────────────────────────────────────────────────────

  it('resetBtn emite un objeto vacío', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup('primary-btn', { buttonStyle: { bgColor: '#ff0000' } });
    fixture.componentInstance.buttonStyleChange.subscribe((v) => emitted.push(v));

    fixture.componentInstance.resetBtn();

    expect(emitted[0]).toEqual({});
  });

  it('resetCard emite un objeto vacío', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup('card', { cardStyle: { bgColor: '#fff', shadow: 'md' } });
    fixture.componentInstance.cardStyleChange.subscribe((v) => emitted.push(v));

    fixture.componentInstance.resetCard();

    expect(emitted[0]).toEqual({});
  });

  it('resetImg emite un objeto vacío', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup('image', { imageStyle: { borderRadius: 'lg', aspectRatio: '16/9' } });
    fixture.componentInstance.imageStyleChange.subscribe((v) => emitted.push(v));

    fixture.componentInstance.resetImg();

    expect(emitted[0]).toEqual({});
  });
});
