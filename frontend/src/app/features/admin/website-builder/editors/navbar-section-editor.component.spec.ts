import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NavbarSectionEditorComponent } from './navbar-section-editor.component';

describe('NavbarSectionEditorComponent', () => {
  const setup = async (data = {}) => {
    await TestBed.configureTestingModule({
      imports: [NavbarSectionEditorComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(NavbarSectionEditorComponent);
    fixture.componentInstance.data = data;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    return fixture;
  };

  it('carga valores iniciales correctamente desde @Input', async () => {
    const fixture = await setup({
      variant: 'centered',
      showLogo: false,
      ctaLabel: 'Cotizar',
      ctaHref: '#contacto',
      links: [{ label: 'Inicio', href: '#inicio' }],
    });
    const c = fixture.componentInstance;

    expect(c.variant).toBe('centered');
    expect(c.showLogo).toBe(false);
    expect(c.ctaLabel).toBe('Cotizar');
    expect(c.links).toHaveLength(1);
  });

  it('addLink() agrega un enlace vacío', async () => {
    const fixture = await setup();
    const c = fixture.componentInstance;

    c.addLink();

    expect(c.links).toHaveLength(1);
    expect(c.links[0]).toEqual({ label: '', href: '' });
  });

  it('addLink() no agrega más de 8 enlaces', async () => {
    const fixture = await setup();
    const c = fixture.componentInstance;

    for (let i = 0; i < 12; i++) c.addLink();

    expect(c.links).toHaveLength(8);
  });

  it('removeLink() elimina el enlace en el índice dado', async () => {
    const fixture = await setup({
      links: [{ label: 'Inicio' }, { label: 'Catálogo' }],
    });
    const c = fixture.componentInstance;

    c.removeLink(0);

    expect(c.links).toHaveLength(1);
    expect(c.links[0].label).toBe('Catálogo');
  });

  it('emit() filtra enlaces sin label y omite href vacío', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup();
    const c = fixture.componentInstance;
    c.dataChange.subscribe((v) => emitted.push(v));

    c.links = [
      { label: 'Inicio', href: '#inicio' },
      { label: '', href: '#nada' },
      { label: 'Blog', href: '' },
    ];
    c.emit();

    const out = emitted[0] as { links: { label: string; href?: string }[] };
    expect(out.links).toHaveLength(2);
    expect(out.links[0].href).toBe('#inicio');
    expect(out.links[1]).not.toHaveProperty('href');
  });

  it('emit() incluye cta cuando ctaLabel está presente', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup({ ctaLabel: 'Cotizar', ctaHref: '#cotizar' });
    const c = fixture.componentInstance;
    c.dataChange.subscribe((v) => emitted.push(v));

    c.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out.ctaLabel).toBe('Cotizar');
    expect(out.ctaHref).toBe('#cotizar');
  });

  it('emit() omite cta cuando ctaLabel está vacío', async () => {
    const emitted: unknown[] = [];
    const fixture = await setup({ ctaLabel: '' });
    const c = fixture.componentInstance;
    c.dataChange.subscribe((v) => emitted.push(v));

    c.emit();

    const out = emitted[0] as Record<string, unknown>;
    expect(out).not.toHaveProperty('ctaLabel');
  });
});
