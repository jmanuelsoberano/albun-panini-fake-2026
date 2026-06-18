import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { tournamentMatches } from '../../core/data/tournament-fixtures';
import { tournamentTeams } from '../../core/data/worldcup-facts';
import type { Team } from '../../core/models/album.models';
import type { TournamentMatch } from '../../core/models/tournament.models';

@Component({
  selector: 'app-tournament-match-center-page',
  imports: [RouterLink],
  templateUrl: './tournament-match-center-page.component.html',
  styleUrl: './tournament-match-center-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentMatchCenterPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly teamMap = new Map<string, Team>(tournamentTeams.map((team) => [team.id, team]));
  protected readonly match = tournamentMatches.find(
    (item) => item.id === this.route.snapshot.paramMap.get('matchId'),
  );

  protected teamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? teamId;
  }

  protected teamCode(teamId: string): string {
    return this.teamMap.get(teamId)?.code ?? 'TBD';
  }

  protected teamLink(teamId: string): readonly string[] {
    return ['/torneo/equipos', teamId];
  }

  protected scoreLabel(match: TournamentMatch): string {
    if (match.homeScore === null || match.awayScore === null) {
      return 'vs';
    }

    return `${match.homeScore} - ${match.awayScore}`;
  }

  protected minuteLabel(minute: number | null): string {
    return minute === null ? 'Gol' : `${minute}'`;
  }

  protected statusLabel(match: TournamentMatch): string {
    if (match.status === 'finished') {
      return 'Finalizado';
    }

    if (match.status === 'live') {
      return 'En vivo';
    }

    return 'Programado';
  }
}
