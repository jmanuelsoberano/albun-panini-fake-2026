import { ChangeDetectionStrategy, Component } from '@angular/core';
import { tournamentStadiums } from '../../core/data/worldcup-facts';

@Component({
  selector: 'app-stadiums-page',
  templateUrl: './stadiums-page.component.html',
  styleUrl: './stadiums-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StadiumsPageComponent {
  protected readonly stadiums = tournamentStadiums;
}
