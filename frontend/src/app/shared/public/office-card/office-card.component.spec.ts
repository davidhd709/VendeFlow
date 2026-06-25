import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OfficeCardComponent } from './office-card.component';
import { PublicOffice } from '@core/models/catalog.model';

const BASE_OFFICE: PublicOffice = {
  id: 'o1',
  name: 'Oficina Centro',
  city: 'Bogotá',
  address: 'Calle 10 #5-20',
  phone: '3001234567',
  email: null,
};

describe('OfficeCardComponent', () => {
  const setup = async (office: PublicOffice = BASE_OFFICE, subdomain = 'tienda') => {
    await TestBed.configureTestingModule({
      imports: [OfficeCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(OfficeCardComponent);
    fixture.componentInstance.office = office;
    fixture.componentInstance.subdomain = subdomain;
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza el nombre de la oficina', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe('Oficina Centro');
  });

  it('renderiza la ciudad', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Bogotá');
  });

  it('renderiza la dirección', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Calle 10 #5-20');
  });

  it('muestra el teléfono cuando está presente', async () => {
    const fixture = await setup();
    const link = fixture.nativeElement.querySelector('a[href^="tel:"]');
    expect(link).toBeTruthy();
    expect(link.textContent.trim()).toBe('3001234567');
  });

  it('no muestra teléfono cuando es nulo', async () => {
    const fixture = await setup({ ...BASE_OFFICE, phone: null });
    expect(fixture.nativeElement.querySelector('a[href^="tel:"]')).toBeFalsy();
  });

  it('muestra el botón de WhatsApp cuando hay teléfono', async () => {
    const fixture = await setup();
    const waBtn = fixture.nativeElement.querySelector('a.btn-wa');
    expect(waBtn).toBeTruthy();
    expect(waBtn.textContent).toContain('WhatsApp');
  });

  it('oculta el botón de WhatsApp cuando no hay teléfono', async () => {
    const fixture = await setup({ ...BASE_OFFICE, phone: null });
    expect(fixture.nativeElement.querySelector('a.btn-wa')).toBeFalsy();
  });

  it('waLink incluye el teléfono en la URL', async () => {
    const fixture = await setup();
    const waHref = fixture.componentInstance.waLink();
    expect(waHref).toContain('3001234567');
  });
});
