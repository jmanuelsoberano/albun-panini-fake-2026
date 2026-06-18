import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { tournamentGroups, tournamentMatches } from '../../core/data/tournament-fixtures';
import { tournamentTeams } from '../../core/data/worldcup-facts';
import type { Team } from '../../core/models/album.models';
import type { TournamentMatch } from '../../core/models/tournament.models';
import { calculateGroupStandings } from '../../core/utils/tournament-domain';

@Component({
  selector: 'app-tournament-groups-page',
  imports: [RouterLink],
  templateUrl: './tournament-groups-page.component.html',
  styleUrl: './tournament-groups-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentGroupsPageComponent {
  private readonly teamMap = new Map<string, Team>(tournamentTeams.map((team) => [team.id, team]));
  protected readonly groupBoards = tournamentGroups.map((group) => ({
    group,
    standings: calculateGroupStandings(group, tournamentMatches),
    matches: tournamentMatches.filter((match) => match.groupId === group.id),
  }));

  protected teamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? teamId;
  }

  protected teamCode(teamId: string): string {
    return this.teamMap.get(teamId)?.code ?? teamId;
  }

  protected scoreLabel(match: TournamentMatch): string {
    if (match.homeScore === null || match.awayScore === null) {
      return 'vs';
    }

    return `${match.homeScore} - ${match.awayScore}`;
  }

  protected eventsLabel(match: TournamentMatch): string {
    return match.events
      .map((event) =>
        event.minute === null ? event.playerName : `${event.playerName} ${event.minute}'`,
      )
      .join(' · ');
  }
}
