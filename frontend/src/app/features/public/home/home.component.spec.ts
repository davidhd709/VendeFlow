import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let routerMock: { navigate: jest.Mock };

  const setup = async () => {
    routerMock = { navigate: jest.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza el hero con el título principal', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Encuentra tu próximo celular');
  });

  it('renderiza el input de subdominio y los botones de acción', async () => {
    const fixture = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ver sitio');
    expect(text).toContain('Catálogo');
    expect(text).toContain('Cotizar');
  });

  it('go() no navega si el subdomain está vacío', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.subdomain = '';
    component.go('sitio');

    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('go("sitio") navega con el subdomain como query param', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.subdomain = 'motocel';
    component.go('sitio');

    expect(routerMock.navigate).toHaveBeenCalledWith(['sitio'], {
      queryParams: { sub: 'motocel' },
    });
  });

  it('go("catalogo") navega al catálogo con el subdomain', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.subdomain = 'tiendacelulares';
    component.go('catalogo');

    expect(routerMock.navigate).toHaveBeenCalledWith(['catalogo'], {
      queryParams: { sub: 'tiendacelulares' },
    });
  });

  it('go("cotizar") navega a cotización con el subdomain', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.subdomain = 'tiendacelulares';
    component.go('cotizar');

    expect(routerMock.navigate).toHaveBeenCalledWith(['cotizar'], {
      queryParams: { sub: 'tiendacelulares' },
    });
  });
});
