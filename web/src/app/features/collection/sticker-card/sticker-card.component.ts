import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { Sticker } from '../../../core/models/album.models';
import { TeamFlagComponent } from '../../../shared/team-flag/team-flag.component';

@Component({
  selector: 'app-sticker-card',
  imports: [TeamFlagComponent],
  templateUrl: './sticker-card.component.html',
  styleUrl: './sticker-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickerCardComponent {
  readonly sticker = input.required<Sticker>();
  readonly copies = input(0);
  readonly stickerSelected = output<Sticker>();

  protected readonly portraitFailed = signal(false);
  protected readonly missing = computed(() => this.copies() === 0);
  protected readonly duplicate = computed(() => this.copies() > 1);
  protected readonly initials = computed(() => this.sticker().name.slice(0, 2).toUpperCase());
  protected readonly canShowPortrait = computed(
    () => !this.missing() && Boolean(this.sticker().portrait) && !this.portraitFailed(),
  );
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

  protected hideBrokenPortrait(): void {
    this.portraitFailed.set(true);
  }
}
