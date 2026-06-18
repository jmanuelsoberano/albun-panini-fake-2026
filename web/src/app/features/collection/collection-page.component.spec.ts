import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { CollectionPageComponent } from './collection-page.component';

function clearStoredAlbum(): void {
  globalThis.localStorage?.clear();
}

describe('CollectionPageComponent', () => {
  beforeEach(() => {
    clearStoredAlbum();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    clearStoredAlbum();
  });

  it('prompts sign-in instead of opening a pack for public visitors', async () => {
    const fixture = TestBed.createComponent(CollectionPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = [...compiled.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Abrir sobre'),
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(compiled.querySelector('app-pack-dialog')).toBeNull();
    expect(compiled.querySelector('[role="dialog"]')).not.toBeNull();
    expect(compiled.textContent).toContain('Inicia sesión para jugar');
    expect(compiled.textContent).not.toContain('Abrir sobre local');
  });
});
