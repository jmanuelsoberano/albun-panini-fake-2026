import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { albumStickers } from '../../core/data/album-catalog';
import { tournamentGroups, tournamentMatches } from '../../core/data/tournament-fixtures';
import { tournamentStadiums, tournamentTeams } from '../../core/data/worldcup-facts';
import { FirebaseSessionStore } from '../../core/firebase/firebase-session.store';
import type { Team } from '../../core/models/album.models';
import { AlbumStore } from '../../core/state/album-store.service';
import {
  featuredMatchStatusLabel,
  selectFeaturedMatches,
} from '../../core/utils/tournament-domain';
import { TeamFlagComponent } from '../../shared/team-flag/team-flag.component';

interface HomeMatchSummary {
  readonly id: string;
  readonly home: Team;
  readonly away: Team;
  readonly score: string;
  readonly status: string;
  readonly venue: string;
  readonly scorers: readonly string[];
}

interface HomeGroupSummary {
  readonly id: string;
  readonly name: string;
  readonly teamCodes: string;
}

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
  protected readonly featuredMatches = selectFeaturedMatches(tournamentMatches, 3).map((match) =>
    this.toMatchSummary(match),
  );
  protected readonly featuredScorers = this.featuredMatches
    .flatMap((match) =>
      match.scorers.map((scorer) => `${match.home.code}-${match.away.code}: ${scorer}`),
    )
    .slice(0, 6);
  protected readonly groupPreview: readonly HomeGroupSummary[] = tournamentGroups
    .slice(0, 4)
    .map((group) => ({
      id: group.id,
      name: group.name,
      teamCodes: group.teamIds
        .map((teamId) => this.teamMap.get(teamId)?.code)
        .filter(Boolean)
        .join(' · '),
    }));
  protected readonly groupCount = tournamentGroups.length;
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

  private toMatchSummary(match: (typeof tournamentMatches)[number]): HomeMatchSummary {
    const home = this.teamMap.get(match.homeTeamId) ?? tournamentTeams[0];
    const away = this.teamMap.get(match.awayTeamId) ?? tournamentTeams[1];

    return {
      id: match.id,
      home,
      away,
      score:
        match.homeScore === null || match.awayScore === null
          ? 'vs'
          : `${match.homeScore} - ${match.awayScore}`,
      status: featuredMatchStatusLabel(match),
      venue: match.venue ?? tournamentStadiums[0][0],
      scorers: match.events.map((event) =>
        event.minute === null ? event.playerName : `${event.playerName} ${event.minute}'`,
      ),
    };
  }
}
