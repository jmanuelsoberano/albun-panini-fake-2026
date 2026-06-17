import { TestBed } from '@angular/core/testing';
import { albumStickers } from '../../../core/data/album-catalog';
import { StickerCardComponent } from './sticker-card.component';

describe('StickerCardComponent', () => {
  it('renders missing and duplicate states from copy count', () => {
    const fixture = TestBed.createComponent(StickerCardComponent);
    fixture.componentRef.setInput('sticker', albumStickers[0]);
    fixture.componentRef.setInput('copies', 0);
    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sticker-card')?.classList).toContain('missing');
    expect(compiled.textContent).toContain('Falta');

    fixture.componentRef.setInput('copies', 2);
    fixture.detectChanges();

    compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('.sticker-card');
    expect(card?.classList).toContain('duplicate');
    expect(card?.getAttribute('aria-label')).toContain('repetido con 2 copias');
    expect(compiled.textContent).toContain('x2');
  });

  it('emits selection from keyboard space without default scroll behavior', () => {
    const fixture = TestBed.createComponent(StickerCardComponent);
    let selectedId = '';

    fixture.componentRef.setInput('sticker', albumStickers[0]);
    fixture.componentRef.setInput('copies', 1);
    fixture.componentInstance.stickerSelected.subscribe((sticker) => {
      selectedId = sticker.id;
    });
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.sticker-card') as HTMLElement;
    const event = new KeyboardEvent('keydown', { key: ' ' });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    card.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(selectedId).toBe(albumStickers[0].id);
  });
});
