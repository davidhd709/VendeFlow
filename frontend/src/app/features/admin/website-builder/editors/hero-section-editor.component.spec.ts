import { TestBed } from '@angular/core/testing';
import { HeroSectionEditorComponent } from './hero-section-editor.component';

describe('HeroSectionEditorComponent', () => {
  it('muestra selector de variante y emite variant en dataChange', async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSectionEditorComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeroSectionEditorComponent);
    const component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.dataChange, 'emit');
    component.data = { title: 'Hero principal', variant: 'classic' };
    fixture.detectChanges();

    const selects = fixture.nativeElement.querySelectorAll('select');
    const variantSelect = selects[0] as HTMLSelectElement;
    variantSelect.value = 'centered';
    variantSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'centered' }),
    );
  });
});
