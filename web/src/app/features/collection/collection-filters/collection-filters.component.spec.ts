import type { CollectionFilters } from '../../../core/models/album.models';
import { CollectionFiltersComponent } from './collection-filters.component';
import { TestBed } from '@angular/core/testing';

describe('CollectionFiltersComponent', () => {
  const filters: CollectionFilters = {
    query: '',
    confederation: 'all',
    status: 'all',
    rarity: 'all',
  };

  it('emits filter patches from form controls', () => {
    const fixture = TestBed.createComponent(CollectionFiltersComponent);
    const emitted: Array<Partial<CollectionFilters>> = [];

    fixture.componentRef.setInput('filters', filters);
    fixture.componentRef.setInput('confederations', ['CAF', 'UEFA']);
    fixture.componentInstance.filtersChanged.subscribe((patch) => emitted.push(patch));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'mexico';
    input.dispatchEvent(new Event('input'));

    const selects = compiled.querySelectorAll('select');
    const statusSelect = selects[1] as HTMLSelectElement;
    statusSelect.value = 'owned';
    statusSelect.dispatchEvent(new Event('change'));

    expect(emitted).toContainEqual({ query: 'mexico' });
    expect(emitted).toContainEqual({ status: 'owned' });
  });
});
