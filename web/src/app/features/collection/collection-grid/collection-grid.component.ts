import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { InventoryCopies, Sticker } from '../../../core/models/album.models';
import { copiesOf } from '../../../core/utils/album-domain';
import { StickerCardComponent } from '../sticker-card/sticker-card.component';

@Component({
  selector: 'app-collection-grid',
  imports: [StickerCardComponent],
  templateUrl: './collection-grid.component.html',
  styleUrl: './collection-grid.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionGridComponent {
  readonly stickers = input.required<readonly Sticker[]>();
  readonly copies = input.required<InventoryCopies>();
  readonly stickerSelected = output<Sticker>();

  protected copyCount(stickerId: string): number {
    return copiesOf(this.copies(), stickerId);
  }

  protected selectSticker(sticker: Sticker): void {
    this.stickerSelected.emit(sticker);
  }
}
