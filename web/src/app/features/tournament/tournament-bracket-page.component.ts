import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { bracketRounds, tournamentMatches } from '../../core/data/tournament-fixtures';
import { tournamentTeams } from '../../core/data/worldcup-facts';
import type { Team } from '../../core/models/album.models';
import type { TournamentMatch } from '../../core/models/tournament.models';
import { TeamFlagComponent } from '../../shared/team-flag/team-flag.component';
import { TournamentSectionNavComponent } from './tournament-section-nav.component';

function isTournamentMatch(match: TournamentMatch | undefined): match is TournamentMatch {
  return Boolean(match);
}

@Component({
  selector: 'app-tournament-bracket-page',
  imports: [RouterLink, TeamFlagComponent, TournamentSectionNavComponent],
  templateUrl: './tournament-bracket-page.component.html',
  styleUrl: './tournament-bracket-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentBracketPageComponent {
  private readonly teamMap = new Map<string, Team>(tournamentTeams.map((team) => [team.id, team]));
  private readonly matchMap = new Map(tournamentMatches.map((match) => [match.id, match]));
  protected readonly rounds = bracketRounds.map((round) => ({
    round,
    matches: round.matchIds.map((matchId) => this.matchMap.get(matchId)).filter(isTournamentMatch),
  }));

  protected teamCode(teamId: string): string {
    return this.teamMap.get(teamId)?.code ?? 'TBD';
  }

  protected teamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? teamId;
  }

  protected teamFor(teamId: string): Team | null {
    return this.teamMap.get(teamId) ?? null;
  }

  protected isKnownTeam(teamId: string): boolean {
    return this.teamMap.has(teamId);
  }

  protected scoreLabel(score: number | null): string {
    if (score === null) {
      return '-';
    }

    return `${score}`;
  }
}
