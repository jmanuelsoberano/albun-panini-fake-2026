import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  tournamentGroups,
  tournamentMatches,
  tournamentResultsCutoffLabel,
} from '../../core/data/tournament-fixtures';
import { tournamentTeams } from '../../core/data/worldcup-facts';
import type { Team } from '../../core/models/album.models';
import type { TournamentMatch } from '../../core/models/tournament.models';
import { calculateGroupStandings } from '../../core/utils/tournament-domain';
import { TeamFlagComponent } from '../../shared/team-flag/team-flag.component';
import { TournamentSectionNavComponent } from './tournament-section-nav.component';

type StandingView = 'ranking' | 'table';

@Component({
  selector: 'app-tournament-groups-page',
  imports: [RouterLink, TeamFlagComponent, TournamentSectionNavComponent],
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
  protected readonly resultsCutoffLabel = tournamentResultsCutoffLabel;
  protected readonly standingView = signal<StandingView>('ranking');
  protected readonly selectedGroupId = signal(this.groupBoards[0]?.group.id ?? '');
  protected readonly showAllGroups = signal(false);

  protected teamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? teamId;
  }

  protected teamFor(teamId: string): Team | null {
    return this.teamMap.get(teamId) ?? null;
  }

  protected teamCode(teamId: string): string {
    return this.teamMap.get(teamId)?.code ?? teamId;
  }

  protected setStandingView(view: StandingView): void {
    this.standingView.set(view);
  }

  protected setSelectedGroup(groupId: string): void {
    this.selectedGroupId.set(groupId);
    this.showAllGroups.set(false);
  }

  protected toggleAllGroups(): void {
    this.showAllGroups.update((showAll) => !showAll);
  }

  protected selectPreviousGroup(): void {
    const previousIndex = Math.max(this.selectedGroupIndex() - 1, 0);
    this.setSelectedGroup(this.groupBoards[previousIndex]?.group.id ?? this.selectedGroupId());
  }

  protected selectNextGroup(): void {
    const nextIndex = Math.min(this.selectedGroupIndex() + 1, this.groupBoards.length - 1);
    this.setSelectedGroup(this.groupBoards[nextIndex]?.group.id ?? this.selectedGroupId());
  }

  protected isFirstGroup(): boolean {
    return this.selectedGroupIndex() === 0;
  }

  protected isLastGroup(): boolean {
    return this.selectedGroupIndex() === this.groupBoards.length - 1;
  }

  protected isGroupHiddenOnMobile(groupId: string): boolean {
    return !this.showAllGroups() && this.selectedGroupId() !== groupId;
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

  protected matchNote(match: TournamentMatch): string {
    const summary = this.eventsLabel(match);

    if (summary) {
      return summary;
    }

    return match.status === 'finished'
      ? 'Goleadores pendientes de confirmacion'
      : 'Pendiente de resultado';
  }

  private selectedGroupIndex(): number {
    const index = this.groupBoards.findIndex((board) => board.group.id === this.selectedGroupId());
    return Math.max(index, 0);
  }
}
