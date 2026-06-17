import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { CollectionFilters, Rarity } from '../../../core/models/album.models';

@Component({
  selector: 'app-collection-filters',
  templateUrl: './collection-filters.component.html',
  styleUrl: './collection-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionFiltersComponent {
  readonly filters = input.required<CollectionFilters>();
  readonly confederations = input.required<readonly string[]>();
  readonly filtersChanged = output<Partial<CollectionFilters>>();

  protected readonly statusOptions: readonly CollectionFilters['status'][] = [
    'all',
    'owned',
    'missing',
    'duplicate',
  ];
  protected readonly rarityOptions: readonly ('all' | Rarity)[] = [
    'all',
    'base',
    'brillante',
    'holografico',
  ];

  protected updateQuery(event: Event): void {
    this.filtersChanged.emit({ query: this.inputValue(event) });
  }

  protected updateConfederation(event: Event): void {
    this.filtersChanged.emit({ confederation: this.inputValue(event) });
  }

  protected updateStatus(event: Event): void {
    this.filtersChanged.emit({ status: this.inputValue(event) as CollectionFilters['status'] });
  }

  protected updateRarity(event: Event): void {
    this.filtersChanged.emit({ rarity: this.inputValue(event) as CollectionFilters['rarity'] });
  }

  protected statusLabel(status: CollectionFilters['status']): string {
    const labels: Record<CollectionFilters['status'], string> = {
      all: 'Todos',
      owned: 'Pegados',
      missing: 'Faltantes',
      duplicate: 'Repetidos',
    };

    return labels[status];
  }

  protected rarityLabel(rarity: 'all' | Rarity): string {
    const labels: Record<'all' | Rarity, string> = {
      all: 'Todas',
      base: 'Base',
      brillante: 'Brillante',
      holografico: 'Holografico',
    };

    return labels[rarity];
  }

  private inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
