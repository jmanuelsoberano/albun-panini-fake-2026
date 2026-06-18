import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { albumStickers } from '../../core/data/album-catalog';
import { tournamentGroups, tournamentMatches } from '../../core/data/tournament-fixtures';
import { tournamentTeams } from '../../core/data/worldcup-facts';
import type { Team } from '../../core/models/album.models';
import { AlbumStore } from '../../core/state/album-store.service';
import { calculateGroupStandings } from '../../core/utils/tournament-domain';
import { TeamFlagComponent } from '../../shared/team-flag/team-flag.component';

@Component({
  selector: 'app-tournament-team-page',
  imports: [RouterLink, TeamFlagComponent],
  templateUrl: './tournament-team-page.component.html',
  styleUrl: './tournament-team-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentTeamPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly album = inject(AlbumStore);
  protected readonly teamId = this.route.snapshot.paramMap.get('teamId') ?? '';
  protected readonly team = tournamentTeams.find((item) => item.id === this.teamId);
  protected readonly group = tournamentGroups.find((item) => item.teamIds.includes(this.teamId));
  protected readonly teamMatches = tournamentMatches.filter(
    (match) => match.homeTeamId === this.teamId || match.awayTeamId === this.teamId,
  );
  protected readonly teamStickers = albumStickers.filter(
    (sticker) => sticker.teamId === this.teamId,
  );
  protected readonly ownedCount = computed(
    () => this.teamStickers.filter((sticker) => this.album.copyCount(sticker.id) > 0).length,
  );
  protected readonly duplicateCount = computed(
    () => this.teamStickers.filter((sticker) => this.album.copyCount(sticker.id) > 1).length,
  );
  protected readonly missingCount = computed(() => this.teamStickers.length - this.ownedCount());
  protected readonly progress = computed(() =>
    this.teamStickers.length > 0
      ? Math.round((this.ownedCount() / this.teamStickers.length) * 100)
      : 0,
  );
  protected readonly groupPosition = computed(() => {
    if (!this.group) {
      return null;
    }

    const standings = calculateGroupStandings(this.group, tournamentMatches);
    const index = standings.findIndex((row) => row.teamId === this.teamId);
    return index >= 0 ? index + 1 : null;
  });

  protected teamName(teamId: string): string {
    return tournamentTeams.find((team) => team.id === teamId)?.name ?? teamId;
  }

  protected teamFor(teamId: string): Team | null {
    return tournamentTeams.find((team) => team.id === teamId) ?? null;
  }

  protected teamCode(teamId: string): string {
    return tournamentTeams.find((team) => team.id === teamId)?.code ?? 'TBD';
  }

  protected scoreLabel(homeScore: number | null, awayScore: number | null): string {
    if (homeScore === null || awayScore === null) {
      return 'vs';
    }

    return `${homeScore} - ${awayScore}`;
  }
}
