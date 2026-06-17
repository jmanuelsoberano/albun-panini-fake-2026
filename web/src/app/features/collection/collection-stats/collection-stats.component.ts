import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-collection-stats',
  templateUrl: './collection-stats.component.html',
  styleUrl: './collection-stats.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionStatsComponent {
  readonly ownedCount = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly progress = input.required<number>();
  readonly duplicateTotal = input.required<number>();
}
