import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

type TournamentSection = 'resumen' | 'grupos' | 'partidos' | 'llaves';

@Component({
  selector: 'app-tournament-section-nav',
  imports: [RouterLink],
  templateUrl: './tournament-section-nav.component.html',
  styleUrl: './tournament-section-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentSectionNavComponent {
  @Input() activeSection: TournamentSection = 'resumen';

  protected readonly links: readonly {
    id: TournamentSection;
    label: string;
    path: string;
  }[] = [
    { id: 'resumen', label: 'Resumen', path: '/torneo' },
    { id: 'grupos', label: 'Grupos', path: '/torneo/grupos' },
    { id: 'partidos', label: 'Partidos', path: '/torneo/partidos' },
    { id: 'llaves', label: 'Llaves', path: '/torneo/llaves' },
  ];
}
