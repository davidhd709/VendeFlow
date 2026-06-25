import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductCardComponent } from './product-card.component';

describe('ProductCardComponent', () => {
  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('subdomain', 'empresa-a');
    fixture.componentRef.setInput('contactPhone', '+573001112233');
    fixture.componentRef.setInput('product', {
      id: 'p-1',
      companyId: 'company-a',
      name: 'iPhone 14 128GB',
      slug: 'iphone-14-128',
      description: null,
      brand: 'Apple',
      model: 'iPhone 14',
      ram: '6GB',
      storage: '128GB',
      color: 'Azul',
      condition: 'NUEVO',
      warranty: '12 meses de garantía',
      price: '3500000',
      imageUrl: null,
      images: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza nombre, precio, garantía y CTA de detalle', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent;
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ) as HTMLAnchorElement[];
    const detail = links.find((a) => a.textContent?.includes('Ver detalle'));

    expect(text).toContain('iPhone 14 128GB');
    expect(text).toContain('12 meses de garantía');
    expect(text).toContain('Ver detalle');
    expect(text).toContain('Cotizar');
    expect(text).toContain('WhatsApp');
    expect(detail!.getAttribute('href')).toContain('/catalogo/iphone-14-128');
  });
});
