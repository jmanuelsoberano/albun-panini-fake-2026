import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  expectedSquadSize as expectedRosterSize,
  fullSquads,
  tournamentTeams,
} from '../../core/data/worldcup-facts';
import type { Player } from '../../core/models/album.models';

@Component({
  selector: 'app-countries-page',
  templateUrl: './countries-page.component.html',
  styleUrl: './countries-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountriesPageComponent {
  protected readonly teams = tournamentTeams;
  protected readonly squads: Readonly<Record<string, readonly Player[]>> = fullSquads;
  protected readonly expectedSquadSize = expectedRosterSize;
  protected readonly totalPlayers = Object.values(fullSquads).reduce(
    (total, squad) => total + squad.length,
    0,
  );
  protected readonly totalPlayersLabel = new Intl.NumberFormat('en-US').format(this.totalPlayers);

  protected squadSize(teamId: string): number {
    return this.squads[teamId]?.length ?? 0;
  }

  protected squadFor(teamId: string): readonly Player[] {
    return this.squads[teamId] ?? [];
  }
}
