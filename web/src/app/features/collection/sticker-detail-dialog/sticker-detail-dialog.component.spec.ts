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
});
