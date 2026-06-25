import { TestBed } from '@angular/core/testing';
import { CtaSectionEditorComponent } from './cta-section-editor.component';

describe('CtaSectionEditorComponent', () => {
  it('emite dataChange al modificar campos principales', async () => {
    await TestBed.configureTestingModule({
      imports: [CtaSectionEditorComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(CtaSectionEditorComponent);
    const component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.dataChange, 'emit');
    component.data = { title: 'CTA principal' };
    fixture.detectChanges();

    const title: HTMLInputElement | null = fixture.nativeElement.querySelector('input');
    if (title) {
      title.value = 'Nueva CTA';
      title.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(emitSpy).toHaveBeenCalled();
  });
});
