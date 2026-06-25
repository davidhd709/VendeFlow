import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicHeroComponent } from './public-hero.component';
import { WebsiteConfig } from '@core/models/website-config.model';

const BASE_CONFIG: Partial<WebsiteConfig> = {
  heroTitle: 'Celulares premium',
  heroSubtitle: 'Los mejores del mercado',
  address: 'Calle 10, Medellín',
  contactPhone: '3109876543',
  banners: [{ imageUrl: 'https://cdn.test/hero.jpg', alt: '' }],
  primaryColor: '#1e40af',
};

describe('PublicHeroComponent', () => {
  const setup = async (inputs: Partial<InstanceType<typeof PublicHeroComponent>> = {}) => {
    await TestBed.configureTestingModule({
      imports: [PublicHeroComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PublicHeroComponent);
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

    it('null → commercial (fallback)', async () => {
      const fixture = await setup({ theme: null });
      expect(fixture.componentInstance.resolvedTheme()).toBe('commercial');
    });
  });

  describe('computed signals', () => {
    it('title() devuelve heroTitle del config', async () => {
      const fixture = await setup({ config: BASE_CONFIG as WebsiteConfig });
      expect(fixture.componentInstance.title()).toBe('Celulares premium');
    });

    it('title() usa el default cuando config es null', async () => {
      const fixture = await setup({ config: null });
      expect(fixture.componentInstance.title()).toContain('Cotiza celulares');
    });

    it('subtitle() devuelve heroSubtitle del config', async () => {
      const fixture = await setup({ config: BASE_CONFIG as WebsiteConfig });
      expect(fixture.componentInstance.subtitle()).toBe('Los mejores del mercado');
    });

    it('subtitle() usa el default cuando config es null', async () => {
      const fixture = await setup({ config: null });
      expect(fixture.componentInstance.subtitle()).toContain('WhatsApp');
    });

    it('tagline() extrae la ciudad de la dirección', async () => {
      const fixture = await setup({ config: BASE_CONFIG as WebsiteConfig });
      expect(fixture.componentInstance.tagline()).toBe('Celulares en Medellín');
    });

    it("tagline() usa 'en tu ciudad' cuando config es null", async () => {
      const fixture = await setup({ config: null });
      expect(fixture.componentInstance.tagline()).toBe('Celulares en tu ciudad');
    });

    it('heroImage() retorna la URL del primer banner', async () => {
      const fixture = await setup({ config: BASE_CONFIG as WebsiteConfig });
      expect(fixture.componentInstance.heroImage()).toBe('https://cdn.test/hero.jpg');
    });

    it('heroImage() retorna null cuando no hay banners', async () => {
      const fixture = await setup({ config: { ...BASE_CONFIG, banners: [] } as WebsiteConfig });
      expect(fixture.componentInstance.heroImage()).toBeNull();
    });

    it('brandColor() usa primaryColor del config', async () => {
      const fixture = await setup({ config: BASE_CONFIG as WebsiteConfig });
      expect(fixture.componentInstance.brandColor()).toBe('#1e40af');
    });

    it('brandColor() usa fallback #2563eb cuando config es null', async () => {
      const fixture = await setup({ config: null });
      expect(fixture.componentInstance.brandColor()).toBe('#2563eb');
    });
  });
});
