import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicCtaComponent } from './public-cta.component';

describe('PublicCtaComponent', () => {
  const setup = async (inputs: Partial<InstanceType<typeof PublicCtaComponent>> = {}) => {
    await TestBed.configureTestingModule({
      imports: [PublicCtaComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PublicCtaComponent);
    Object.assign(fixture.componentInstance, inputs);
    fixture.detectChanges();
    return fixture;
  };

  describe('resolvedTheme()', () => {
    it("'comercial' → 'commercial'", async () => {
      const fixture = await setup({ theme: 'comercial' });
      expect(fixture.componentInstance.resolvedTheme()).toBe('commercial');
    });

    it("'minimal' → 'premium'", async () => {
      const fixture = await setup({ theme: 'minimal' });
      expect(fixture.componentInstance.resolvedTheme()).toBe('premium');
    });

    it("'vibrante' → 'vibrant'", async () => {
      const fixture = await setup({ theme: 'vibrante' });
      expect(fixture.componentInstance.resolvedTheme()).toBe('vibrant');
    });

    it("'commercial' se devuelve tal cual", async () => {
      const fixture = await setup({ theme: 'commercial' });
      expect(fixture.componentInstance.resolvedTheme()).toBe('commercial');
    });

    it("'premium' se devuelve tal cual", async () => {
      const fixture = await setup({ theme: 'premium' });
      expect(fixture.componentInstance.resolvedTheme()).toBe('premium');
    });

    it("'vibrant' se devuelve tal cual", async () => {
      const fixture = await setup({ theme: 'vibrant' });
      expect(fixture.componentInstance.resolvedTheme()).toBe('vibrant');
    });

    it('null → commercial (fallback)', async () => {
      const fixture = await setup({ theme: null });
      expect(fixture.componentInstance.resolvedTheme()).toBe('commercial');
    });

    it('desconocido → commercial (fallback)', async () => {
      const fixture = await setup({ theme: 'otro' });
      expect(fixture.componentInstance.resolvedTheme()).toBe('commercial');
    });
  });

  it('aplica data-theme en el elemento section', async () => {
    const fixture = await setup({ theme: 'premium' });
    const section = fixture.nativeElement.querySelector('section.cta');
    expect(section.getAttribute('data-theme')).toBe('premium');
  });

  it('renderiza variante premium cuando theme es premium', async () => {
    const fixture = await setup({ theme: 'premium' });
    expect(fixture.nativeElement.querySelector('.cta-premium')).toBeTruthy();
  });

  it('renderiza variante vibrant cuando theme es vibrante', async () => {
    const fixture = await setup({ theme: 'vibrante' });
    expect(fixture.nativeElement.querySelector('.cta-vibrant')).toBeTruthy();
  });

  it('renderiza variante commercial por defecto', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('.cta-commercial')).toBeTruthy();
  });
});
