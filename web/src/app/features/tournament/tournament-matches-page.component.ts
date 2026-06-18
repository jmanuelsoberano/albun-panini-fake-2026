import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { tournamentGroups, tournamentMatches } from '../../core/data/tournament-fixtures';
import { tournamentTeams } from '../../core/data/worldcup-facts';
import type { Team } from '../../core/models/album.models';
import type { MatchPhase, TournamentMatch } from '../../core/models/tournament.models';
import { calculateTopScorers } from '../../core/utils/tournament-domain';
import { TeamFlagComponent } from '../../shared/team-flag/team-flag.component';

type PhaseFilter = 'all' | MatchPhase;

@Component({
  selector: 'app-tournament-matches-page',
  imports: [RouterLink, TeamFlagComponent],
  templateUrl: './tournament-matches-page.component.html',
  styleUrl: './tournament-matches-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentMatchesPageComponent {
  private readonly teamMap = new Map<string, Team>(tournamentTeams.map((team) => [team.id, team]));
  protected readonly phaseFilters: readonly { value: PhaseFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'group', label: 'Grupos' },
    { value: 'round-of-32', label: 'Ronda de 32' },
    { value: 'round-of-16', label: 'Octavos' },
    { value: 'quarterfinal', label: 'Cuartos' },
    { value: 'semifinal', label: 'Semifinal' },
    { value: 'third-place', label: 'Tercer lugar' },
    { value: 'final', label: 'Final' },
  ];
  protected readonly groups = tournamentGroups;
  protected readonly phase = signal<PhaseFilter>('all');
  protected readonly groupId = signal('all');
  protected readonly topScorers = calculateTopScorers(tournamentMatches, 8);
  protected readonly filteredMatches = computed(() =>
    tournamentMatches.filter((match) => {
      const matchesPhase = this.phase() === 'all' || match.phase === this.phase();
      const matchesGroup = this.groupId() === 'all' || match.groupId === this.groupId();
      return matchesPhase && matchesGroup;
    }),
  );

  protected setPhase(value: PhaseFilter): void {
    this.phase.set(value);
  }

  protected updateGroup(event: Event): void {
    this.groupId.set((event.target as HTMLSelectElement).value);
  }

  protected teamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? teamId;
  }

  protected teamFor(teamId: string): Team | null {
    return this.teamMap.get(teamId) ?? null;
  }

  protected teamCode(teamId: string): string {
    return this.teamMap.get(teamId)?.code ?? 'TBD';
  }

  protected scoreLabel(match: TournamentMatch): string {
    if (match.homeScore === null || match.awayScore === null) {
      return 'vs';
    }

    return `${match.homeScore} - ${match.awayScore}`;
  }

  protected eventSummary(match: TournamentMatch): string {
    return match.events
      .map((event) =>
        event.minute === null ? event.playerName : `${event.playerName} ${event.minute}'`,
      )
      .join(' · ');
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
