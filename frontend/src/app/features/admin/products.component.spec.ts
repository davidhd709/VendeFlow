import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ProductsService } from '@core/services/products.service';
import { ToastService } from '@core/services/toast.service';
import { AdminProductsComponent } from './products.component';

const makeProduct = (id: string, isActive = true) => ({
  id,
  companyId: 'c-a',
  name: `iPhone ${id}`,
  slug: `iphone-${id}`,
  description: 'Descripción del producto',
  brand: 'Apple',
  model: `${id} Pro`,
  ram: '8GB',
  storage: '256GB',
  color: 'Negro',
  condition: 'NUEVO' as const,
  warranty: '12 meses',
  price: '3500000',
  imageUrl: null,
  isActive,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('AdminProductsComponent', () => {
  let productsService: { getAll: jest.Mock; create: jest.Mock; update: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProductsComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        MessageService,
        ToastService,
        { provide: ProductsService, useValue: productsService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminProductsComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    productsService = {
      getAll:  jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      create:  jest.fn().mockReturnValue(of(makeProduct('new'))),
      update:  jest.fn().mockReturnValue(of(makeProduct('p-1'))),
    };
    toast = { success: jest.fn(), error: jest.fn() };
  });

  it('muestra estado de carga mientras espera respuesta', async () => {
    productsService.getAll.mockReturnValue(new Subject());
    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('muestra empty state cuando no hay productos', async () => {
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Sin productos en catálogo');
  });

  it('muestra error state cuando el servicio falla', async () => {
    productsService.getAll.mockReturnValue(throwError(() => ({ userMessage: 'Error al cargar productos' })));
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Error al cargar productos');
  });

  it('renderiza tabla con productos y condición visual', async () => {
    productsService.getAll.mockReturnValue(of({
      items: [makeProduct('p-1', true), makeProduct('p-2', false)],
      total: 2,
    }));
    const fixture = await create();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('iPhone p-1');
    expect(text).toContain('iPhone p-2');
    expect(text).toContain('Nuevo');
    expect(text).toContain('Activo');
    expect(text).toContain('Inactivo');
  });

  it('autoSlug genera slug a partir del nombre al crear', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.form.name = 'iPhone 15 Azul';
    component.autoSlug();

    expect(component.form.slug).toBe('iphone-15-azul');
  });

  it('autoSlug no sobreescribe el slug al editar', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.editId = 'p-existing';
    component.form.name = 'Nuevo nombre';
    component.form.slug = 'slug-manual';
    component.autoSlug();

    expect(component.form.slug).toBe('slug-manual');
  });

  it('valida nombre y precio antes de guardar', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.form.name = '';
    component.form.slug = '';
    component.save();

    expect(toast.error).toHaveBeenCalledWith('Nombre y slug son obligatorios');
    expect(productsService.create).not.toHaveBeenCalled();
  });

  it('valida precio mayor a cero', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.form.name = 'Samsung';
    component.form.slug = 'samsung';
    component.form.price = 0;
    component.save();

    expect(toast.error).toHaveBeenCalledWith('Ingresa un precio válido');
    expect(productsService.create).not.toHaveBeenCalled();
  });

  it('llama create al guardar un producto nuevo', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.form = { name: 'Samsung S24', slug: 'samsung-s24', price: 2_500_000, condition: 'NUEVO' } as never;
    component.save();

    expect(productsService.create).toHaveBeenCalled();
  });

  it('llama update al guardar un producto existente', async () => {
    productsService.getAll.mockReturnValue(of({ items: [makeProduct('p-1')], total: 1 }));
    const fixture = await create();
    const component = fixture.componentInstance;

    component.openEdit(makeProduct('p-1'));
    component.save();

    expect(productsService.update).toHaveBeenCalledWith('p-1', expect.any(Object));
  });

  it('llama update al hacer toggle de activación', async () => {
    productsService.getAll.mockReturnValue(of({ items: [makeProduct('p-1', true)], total: 1 }));
    const fixture = await create();
    const component = fixture.componentInstance;

    component.toggleActive(makeProduct('p-1', true));

    expect(productsService.update).toHaveBeenCalledWith('p-1', { isActive: false });
  });
});
