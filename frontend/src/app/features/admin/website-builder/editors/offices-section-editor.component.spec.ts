import { TestBed } from '@angular/core/testing';
import { OfficesSectionEditorComponent } from './offices-section-editor.component';

describe('OfficesSectionEditorComponent', () => {
  it('emite dataChange al modificar campos principales', async () => {
    await TestBed.configureTestingModule({
      imports: [OfficesSectionEditorComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(OfficesSectionEditorComponent);
    const component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.dataChange, 'emit');
    component.data = { title: 'Oficinas y puntos de atención' };
    fixture.detectChanges();

    const title: HTMLInputElement | null = fixture.nativeElement.querySelector('input');
    if (title) {
      title.value = 'Nuestras oficinas';
      title.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(emitSpy).toHaveBeenCalled();
  });
});
