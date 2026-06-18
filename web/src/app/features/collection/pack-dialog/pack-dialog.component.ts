import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { InventoryCopies, Sticker } from '../../../core/models/album.models';
import { copiesOf } from '../../../core/utils/album-domain';
import { StickerCardComponent } from '../sticker-card/sticker-card.component';

@Component({
  selector: 'app-pack-dialog',
  imports: [A11yModule, StickerCardComponent],
  templateUrl: './pack-dialog.component.html',
  styleUrl: './pack-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackDialogComponent {
  readonly stickers = input.required<readonly Sticker[]>();
  readonly copies = input.required<InventoryCopies>();
  readonly sourceLabel = input('Sobre abierto');
  readonly canOpenAnother = input(true);
  readonly dialogClosed = output<void>();
  readonly openAnotherPack = output<void>();
  readonly stickerSelected = output<Sticker>();
  protected readonly newCount = computed(
    () => this.stickers().filter((sticker) => this.copyCount(sticker.id) <= 1).length,
  );
  protected readonly duplicateCount = computed(() => this.stickers().length - this.newCount());

  protected copyCount(stickerId: string): number {
    return copiesOf(this.copies(), stickerId);
  }

  protected closeDialog(): void {
    this.dialogClosed.emit();
  }

  protected openAnother(): void {
    this.openAnotherPack.emit();
  }

  protected selectSticker(sticker: Sticker): void {
    this.stickerSelected.emit(sticker);
  }
}
