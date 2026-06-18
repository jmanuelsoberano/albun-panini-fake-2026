import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Sticker } from '../../../core/models/album.models';
import { TeamFlagComponent } from '../../../shared/team-flag/team-flag.component';

@Component({
  selector: 'app-sticker-detail-dialog',
  imports: [A11yModule, TeamFlagComponent],
  templateUrl: './sticker-detail-dialog.component.html',
  styleUrl: './sticker-detail-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickerDetailDialogComponent {
  readonly sticker = input.required<Sticker>();
  readonly copies = input(0);
  readonly dialogClosed = output<void>();

  protected readonly initials = computed(() => this.sticker().name.slice(0, 2).toUpperCase());
  protected readonly statusLabel = computed(() => {
    if (this.copies() === 0) {
      return 'Faltante';
    }

    if (this.copies() > 1) {
      return `Repetido x${this.copies()}`;
    }

    return 'Pegado';
  });

  protected closeDialog(): void {
    this.dialogClosed.emit();
  }
}
