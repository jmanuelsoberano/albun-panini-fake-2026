import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { InventoryCopies, Sticker, Team } from '../../../core/models/album.models';
import { tournamentTeams } from '../../../core/data/worldcup-facts';
import { copiesOf } from '../../../core/utils/album-domain';
import { StickerCardComponent } from '../sticker-card/sticker-card.component';

interface TeamPage {
  readonly team: Team;
  readonly stickers: readonly Sticker[];
  readonly ownedCount: number;
  readonly progress: number;
}

@Component({
  selector: 'app-team-pages',
  imports: [StickerCardComponent],
  templateUrl: './team-pages.component.html',
  styleUrl: './team-pages.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPagesComponent {
  readonly stickers = input.required<readonly Sticker[]>();
  readonly copies = input.required<InventoryCopies>();
  readonly stickerSelected = output<Sticker>();

  protected readonly pages = computed<readonly TeamPage[]>(() =>
    tournamentTeams.map((team) => {
      const stickers = this.stickers().filter((sticker) => sticker.teamId === team.id);
      const ownedCount = stickers.filter((sticker) => this.copyCount(sticker.id) > 0).length;

      return {
        team,
        stickers,
        ownedCount,
        progress: stickers.length > 0 ? Math.round((ownedCount / stickers.length) * 100) : 0,
      };
    }),
  );

  protected copyCount(stickerId: string): number {
    return copiesOf(this.copies(), stickerId);
  }

  protected selectSticker(sticker: Sticker): void {
    this.stickerSelected.emit(sticker);
  }
}
