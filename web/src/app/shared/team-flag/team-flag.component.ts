import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type FlagSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-team-flag',
  templateUrl: './team-flag.component.html',
  styleUrl: './team-flag.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamFlagComponent {
  readonly flagCode = input.required<string>();
  readonly name = input.required<string>();
  readonly size = input<FlagSize>('md');

  protected readonly source = computed(
    () => `https://flagcdn.com/${this.flagCode().toLowerCase()}.svg`,
  );
  protected readonly label = computed(() => `Bandera de ${this.name()}`);
}
