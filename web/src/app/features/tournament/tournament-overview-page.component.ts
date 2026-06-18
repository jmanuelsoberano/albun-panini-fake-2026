import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  bracketRounds,
  tournamentGroups,
  tournamentMatches,
} from '../../core/data/tournament-fixtures';
import { tournamentTeams } from '../../core/data/worldcup-facts';
import type { Team } from '../../core/models/album.models';
import { calculateTopScorers } from '../../core/utils/tournament-domain';
import { TeamFlagComponent } from '../../shared/team-flag/team-flag.component';
import { TournamentSectionNavComponent } from './tournament-section-nav.component';

@Component({
  selector: 'app-tournament-overview-page',
  imports: [RouterLink, TeamFlagComponent, TournamentSectionNavComponent],
  templateUrl: './tournament-overview-page.component.html',
  styleUrl: './tournament-overview-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentOverviewPageComponent {
  protected readonly groups = tournamentGroups;
  protected readonly matches = tournamentMatches;
  protected readonly rounds = bracketRounds;
  protected readonly topScorer = calculateTopScorers(tournamentMatches, 1)[0];
  protected readonly teamMap = new Map<string, Team>(
    tournamentTeams.map((team) => [team.id, team]),
  );

  protected teamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? teamId;
  }

  protected teamFor(teamId: string): Team | null {
    return this.teamMap.get(teamId) ?? null;
  }
}
