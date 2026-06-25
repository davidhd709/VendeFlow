import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SectionStylePanelComponent } from './section-style-panel.component';

describe('SectionStylePanelComponent', () => {
  const setup = async (style = {}) => {
    await TestBed.configureTestingModule({
      imports: [SectionStylePanelComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(SectionStylePanelComponent);
    fixture.componentInstance.style = style;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    return fixture;
  };

  it('carga los valores iniciales desde @Input style', async () => {
    const fixture = await setup({ bgColor: '#0f172a', fontFamily: 'serif', paddingY: 'lg' });
    const c = fixture.componentInstance;

    expect(c.bgColor).toBe('#0f172a');
    expect(c.fontFamily).toBe('serif');
    expect(c.paddingY).toBe('lg');
  });

  it('inicializa con valores vacíos cuando el style es {}', async () => {
    const fixture = await setup();
    const c = fixture.componentInstance;

    expect(c.bgColor).toBe('');
    expect(c.fontFamily).toBe('');
    expect(c.paddingY).toBe('');
  });

  it('emit() incluye bgColor solo si es un hex válido', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup();
    const c = fixture.componentInstance;
    c.styleChange.subscribe((v) => emitted.push(v));

    c.bgColor = '#1d4ed8';
    c.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out.bgColor).toBe('#1d4ed8');
  });

  it('emit() omite bgColor si el hex no es válido', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup();
    const c = fixture.componentInstance;
    c.styleChange.subscribe((v) => emitted.push(v));

    c.bgColor = 'azul-no-valido';
    c.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out).not.toHaveProperty('bgColor');
  });

  it('emit() incluye fontFamily y paddingY cuando están presentes', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup({ fontFamily: 'sans', paddingY: 'xl' });
    const c = fixture.componentInstance;
    c.styleChange.subscribe((v) => emitted.push(v));

    c.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out.fontFamily).toBe('sans');
    expect(out.paddingY).toBe('xl');
  });

  it('emit() produce un objeto vacío cuando todos los campos están limpios', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup();
    const c = fixture.componentInstance;
    c.styleChange.subscribe((v) => emitted.push(v));

    c.emit();

    expect(emitted[0]).toEqual({});
  });

  it('onHexBg() emite cuando el valor es vacío (limpiar fondo)', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup({ bgColor: '#ff0000' });
    const c = fixture.componentInstance;
    c.styleChange.subscribe((v) => emitted.push(v));

    c.bgColor = '';
    c.onHexBg();

    expect(emitted).toHaveLength(1);
  });

  it('el panel está expandido por defecto', async () => {
    const fixture = await setup();
    expect(fixture.componentInstance.expanded).toBe(true);
  });
});
