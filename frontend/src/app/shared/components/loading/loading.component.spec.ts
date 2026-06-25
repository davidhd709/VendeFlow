import { TestBed } from '@angular/core/testing';
import { LoadingComponent } from './loading.component';

describe('LoadingComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoadingComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza el contenedor .loading', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('.loading')).toBeTruthy();
  });

  it('muestra el spinner', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('.pi-spin')).toBeTruthy();
  });

  it('muestra el texto Cargando', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Cargando');
  });
});
