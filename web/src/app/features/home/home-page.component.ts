import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { albumStickers } from '../../core/data/album-catalog';
import { tournamentGroups, tournamentMatches } from '../../core/data/tournament-fixtures';
import { tournamentStadiums, tournamentTeams } from '../../core/data/worldcup-facts';
import { FirebaseSessionStore } from '../../core/firebase/firebase-session.store';
import type { Team } from '../../core/models/album.models';
import { AlbumStore } from '../../core/state/album-store.service';
import { TeamFlagComponent } from '../../shared/team-flag/team-flag.component';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, TeamFlagComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  protected readonly album = inject(AlbumStore);
  protected readonly session = inject(FirebaseSessionStore);

  private readonly teamMap = new Map<string, Team>(tournamentTeams.map((team) => [team.id, team]));
  private readonly openingMatch = tournamentMatches.find((match) => match.id === 'M01');
  protected readonly featuredMatch = {
    home: this.teamMap.get(this.openingMatch?.homeTeamId ?? '') ?? tournamentTeams[0],
    away: this.teamMap.get(this.openingMatch?.awayTeamId ?? '') ?? tournamentTeams[1],
    score:
      this.openingMatch?.homeScore === null || this.openingMatch?.awayScore === null
        ? 'vs'
        : `${this.openingMatch?.homeScore} - ${this.openingMatch?.awayScore}`,
    status: this.openingMatch?.status === 'finished' ? 'Finalizado' : 'Programado',
    venue: this.openingMatch?.venue ?? tournamentStadiums[0][0],
    scorers:
      this.openingMatch?.events.map((event) =>
        event.minute === null ? event.playerName : `${event.playerName} ${event.minute}'`,
      ) ?? [],
  } as const;
  protected readonly featuredGroup = (tournamentGroups[0]?.teamIds ?? [])
    .map((teamId) => this.teamMap.get(teamId))
    .filter((team): team is Team => Boolean(team));
  protected readonly missingPreview = computed(() =>
    albumStickers.filter((sticker) => this.album.copyCount(sticker.id) === 0).slice(0, 4),
  );
  protected readonly dailyChallenge = computed(() => this.album.challenges()[0]);
  protected readonly primaryAction = computed(() => {
    if (!this.session.isAuthenticated()) {
      return {
        label: 'Iniciar sesión para jugar',
        path: '/coleccion',
        fragment: 'play-panel',
      };
    }

    if ((this.session.profile()?.packsAvailable ?? 0) > 0) {
      return {
        label: 'Abrir sobre',
        path: '/coleccion',
        fragment: 'play-panel',
      };
    }

    return {
      label: 'Ver retos',
      path: '/retos',
      fragment: undefined,
    };
  });
}
