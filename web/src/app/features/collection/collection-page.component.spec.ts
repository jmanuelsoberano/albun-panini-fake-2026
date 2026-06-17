import { TestBed } from '@angular/core/testing';
import { CollectionPageComponent } from './collection-page.component';

describe('CollectionPageComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('opens a local pack dialog from the hero action', () => {
    const fixture = TestBed.createComponent(CollectionPageComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = [...compiled.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Abrir sobre local'),
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(compiled.querySelector('app-pack-dialog')).not.toBeNull();
    expect(compiled.textContent).toContain('Tus nuevos cromos');
  });
});
