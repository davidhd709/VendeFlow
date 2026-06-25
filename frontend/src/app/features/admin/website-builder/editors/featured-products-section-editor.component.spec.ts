import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FeaturedProductsSectionEditorComponent } from './featured-products-section-editor.component';

describe('FeaturedProductsSectionEditorComponent', () => {
  it('emite dataChange al modificar campos principales', async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedProductsSectionEditorComponent],
      providers: [provideHttpClient(), provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(FeaturedProductsSectionEditorComponent);
    const component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.dataChange, 'emit');
    component.data = { title: 'Productos destacados', limit: 6 };
    fixture.detectChanges();

    const title: HTMLInputElement | null = fixture.nativeElement.querySelector('input');
    if (title) {
      title.value = 'Top equipos';
      title.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(emitSpy).toHaveBeenCalled();
  });
});
