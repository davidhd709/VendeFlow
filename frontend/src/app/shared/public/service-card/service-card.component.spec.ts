import { TestBed } from '@angular/core/testing';
import { ServiceCardComponent } from './service-card.component';
import { ServiceItem } from '@core/models/website-config.model';

const ITEM: ServiceItem = { title: 'Garantía', description: '12 meses', icon: 'pi-shield' };

describe('ServiceCardComponent', () => {
  const setup = async (service: ServiceItem = ITEM) => {
    await TestBed.configureTestingModule({
      imports: [ServiceCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ServiceCardComponent);
    fixture.componentInstance.service = service;
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza el título del servicio', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe('Garantía');
  });

  it('renderiza la descripción cuando está presente', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('p.text-muted').textContent).toContain('12 meses');
  });

  it('no renderiza p cuando description es vacío', async () => {
    const fixture = await setup({ ...ITEM, description: '' });
    expect(fixture.nativeElement.querySelector('p.text-muted')).toBeFalsy();
  });

  describe('iconClass()', () => {
    it("'pi-shield' → 'pi pi-shield'", async () => {
      const fixture = await setup({ ...ITEM, icon: 'pi-shield' });
      expect(fixture.componentInstance.iconClass()).toBe('pi pi-shield');
    });

    it("'pi pi-check' elimina el prefijo duplicado → 'pi pi-check'", async () => {
      const fixture = await setup({ ...ITEM, icon: 'pi pi-check' });
      expect(fixture.componentInstance.iconClass()).toBe('pi pi-check');
    });

    it("'shield' sin prefijo pi- → 'pi pi-shield'", async () => {
      const fixture = await setup({ ...ITEM, icon: 'shield' });
      expect(fixture.componentInstance.iconClass()).toBe('pi pi-shield');
    });

    it('icon undefined → usa pi-check por defecto', async () => {
      const fixture = await setup({ ...ITEM, icon: undefined });
      expect(fixture.componentInstance.iconClass()).toBe('pi pi-check');
    });
  });
});
