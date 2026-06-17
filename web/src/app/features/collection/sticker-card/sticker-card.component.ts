import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Sticker } from '../../../core/models/album.models';

@Component({
  selector: 'app-sticker-card',
  templateUrl: './sticker-card.component.html',
  styleUrl: './sticker-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickerCardComponent {
  readonly sticker = input.required<Sticker>();
  readonly copies = input(0);
  readonly stickerSelected = output<Sticker>();

  protected readonly missing = computed(() => this.copies() === 0);
  protected readonly duplicate = computed(() => this.copies() > 1);
  protected readonly initials = computed(() => this.sticker().name.slice(0, 2).toUpperCase());
  protected readonly accessibilityLabel = computed(() => {
    const status = this.missing()
      ? 'faltante'
      : this.duplicate()
        ? `repetido con ${this.copies()} copias`
        : 'pegado';
    const sticker = this.sticker();
    return `Ver detalle de ${sticker.name}, ${sticker.team}, ${sticker.position}, ${status}`;
  });

  protected selectSticker(): void {
    this.stickerSelected.emit(this.sticker());
  }

  protected selectStickerFromKeyboard(event: Event): void {
    event.preventDefault();
    this.selectSticker();
  }
}
