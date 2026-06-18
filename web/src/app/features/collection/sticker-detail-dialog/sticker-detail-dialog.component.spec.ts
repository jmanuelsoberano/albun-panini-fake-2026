import { TestBed } from '@angular/core/testing';
import { albumStickers } from '../../../core/data/album-catalog';
import { StickerDetailDialogComponent } from './sticker-detail-dialog.component';

describe('StickerDetailDialogComponent', () => {
  it('renders sticker metadata and copy status', () => {
    const fixture = TestBed.createComponent(StickerDetailDialogComponent);
    fixture.componentRef.setInput('sticker', albumStickers[0]);
    fixture.componentRef.setInput('copies', 2);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dialog = compiled.querySelector('[role="dialog"]') as HTMLElement;
    const summaryId = `sticker-detail-summary-${albumStickers[0].id}`;

    expect(dialog.getAttribute('aria-describedby')).toBe(summaryId);
    expect(compiled.querySelector(`#${summaryId}`)?.textContent).toContain(albumStickers[0].note);
    expect(compiled.textContent).toContain(albumStickers[0].id);
    expect(compiled.textContent).toContain(albumStickers[0].team);
    expect(compiled.textContent).toContain(albumStickers[0].position);
    expect(compiled.textContent).toContain('Repetido x2');
  });

  it('shows portrait attribution for owned stickers with licensed images', () => {
    const fixture = TestBed.createComponent(StickerDetailDialogComponent);
    const stickerWithPortrait = albumStickers.find((sticker) => sticker.id === 'FG-006');

    expect(stickerWithPortrait).toBeTruthy();

    fixture.componentRef.setInput('sticker', stickerWithPortrait);
    fixture.componentRef.setInput('copies', 1);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const image = compiled.querySelector('.portrait > img') as HTMLImageElement | null;
    const sourceLink = compiled.querySelector('.portrait-source a') as HTMLAnchorElement | null;

    expect(image?.src).toContain('Lionel_Messi');
    expect(sourceLink?.textContent).toContain('The White House');
    expect(sourceLink?.textContent).toContain('Public domain');
    expect(sourceLink?.href).toContain('commons.wikimedia.org');
  });
});
