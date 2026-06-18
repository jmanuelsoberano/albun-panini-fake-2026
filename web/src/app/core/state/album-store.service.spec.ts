import { TestBed } from '@angular/core/testing';
import { AlbumStore } from './album-store.service';

function clearStoredAlbum(): void {
  globalThis.localStorage?.clear();
}

describe('AlbumStore', () => {
  beforeEach(() => {
    clearStoredAlbum();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    clearStoredAlbum();
  });

  it('opens a local pack and updates inventory counters', () => {
    const store = TestBed.inject(AlbumStore);

    const pack = store.openLocalPack();

    expect(pack.length).toBe(5);
    expect(new Set(pack.map((sticker) => sticker.id)).size).toBe(5);
    expect(store.packsOpened()).toBe(1);
    expect(store.ownedCount()).toBe(5);
    expect(store.progress()).toBe(2);
  });

  it('filters stickers by owned status from signal state', () => {
    const store = TestBed.inject(AlbumStore);

    store.openLocalPack();
    store.updateFilters({ status: 'owned' });

    expect(store.filteredStickers().length).toBe(5);
  });

  it('recalculates challenges from local state', () => {
    const store = TestBed.inject(AlbumStore);

    expect(store.challenges().find((challenge) => challenge.id === 'firstPack')?.complete).toBe(
      false,
    );

    store.openLocalPack();

    const firstPack = store.challenges().find((challenge) => challenge.id === 'firstPack');
    expect(firstPack?.complete).toBe(true);
    expect(firstPack?.progressLabel).toBe('1/1');
  });

  it('resets local album state', () => {
    const store = TestBed.inject(AlbumStore);

    store.openLocalPack();
    store.resetLocalAlbum();

    expect(store.packsOpened()).toBe(0);
    expect(store.ownedCount()).toBe(0);
    expect(store.duplicateTotal()).toBe(0);
    expect(store.filters().status).toBe('all');
  });
});
