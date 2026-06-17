import { computed, effect, Injectable, signal } from '@angular/core';
import type {
  AlbumChallenge,
  CollectionFilters,
  InventoryCopies,
  Rarity,
  Sticker,
} from '../models/album.models';
import { albumStickers } from '../data/album-catalog';
import {
  albumProgressPercent,
  copiesOf,
  duplicateCount,
  filterStickers,
  uniqueOwnedCount,
} from '../utils/album-domain';

interface LocalAlbumState {
  readonly copies: InventoryCopies;
  readonly packsOpened: number;
  readonly theme: 'dark' | 'light';
}

const STORE_KEY = 'fan-global-2026-angular-state-v1';
const INITIAL_FILTERS: CollectionFilters = {
  query: '',
  confederation: 'all',
  status: 'all',
  rarity: 'all',
};

@Injectable({ providedIn: 'root' })
export class AlbumStore {
  private readonly stickers = albumStickers;
  private readonly initialState = this.readLocalState();

  readonly mode = signal<'local' | 'firebase'>('local');
  readonly copies = signal<InventoryCopies>(this.initialState.copies);
  readonly packsOpened = signal(this.initialState.packsOpened);
  readonly theme = signal<'dark' | 'light'>(this.initialState.theme);
  readonly activeView = signal<'grid' | 'teams'>('grid');
  readonly filters = signal<CollectionFilters>(INITIAL_FILTERS);

  readonly filteredStickers = computed(() =>
    filterStickers(this.stickers, this.filters(), this.copies()),
  );
  readonly ownedCount = computed(() => uniqueOwnedCount(this.stickers, this.copies()));
  readonly duplicateTotal = computed(() => duplicateCount(this.copies()));
  readonly progress = computed(() => albumProgressPercent(this.stickers.length, this.ownedCount()));
  readonly challenges = computed(() => this.calculateChallenges());

  private readonly persistLocalState = effect(() => {
    if (this.mode() !== 'local') {
      return;
    }

    this.writeLocalState({
      copies: this.copies(),
      packsOpened: this.packsOpened(),
      theme: this.theme(),
    });
  });

  copyCount(stickerId: string): number {
    return copiesOf(this.copies(), stickerId);
  }

  updateFilters(patch: Partial<CollectionFilters>): void {
    this.filters.update((filters) => ({ ...filters, ...patch }));
  }

  setActiveView(view: 'grid' | 'teams'): void {
    this.activeView.set(view);
  }

  useLocalMode(): void {
    const state = this.readLocalState();
    this.mode.set('local');
    this.copies.set(state.copies);
    this.packsOpened.set(state.packsOpened);
  }

  useFirebaseInventory(copies: InventoryCopies): void {
    this.mode.set('firebase');
    this.copies.set(copies);
  }

  openLocalPack(size = 5): readonly Sticker[] {
    this.mode.set('local');
    const pack = this.randomUniquePack(size);
    this.addCopies(pack);
    this.packsOpened.update((count) => count + 1);
    return pack;
  }

  addRandomStickers(count = 10): readonly Sticker[] {
    const stickers = Array.from({ length: count }, () => this.randomSticker());
    this.addCopies(stickers);
    return stickers;
  }

  resetLocalAlbum(): void {
    this.copies.set({});
    this.packsOpened.set(0);
    this.filters.set(INITIAL_FILTERS);
  }

  private addCopies(stickers: readonly Sticker[]): void {
    this.copies.update((current) => {
      const next: Record<string, number> = { ...current };

      for (const sticker of stickers) {
        next[sticker.id] = (next[sticker.id] ?? 0) + 1;
      }

      return next;
    });
  }

  private randomUniquePack(size: number): readonly Sticker[] {
    const targetSize = Math.min(size, this.stickers.length);
    const selected = new Map<string, Sticker>();

    while (selected.size < targetSize) {
      const sticker = this.randomSticker();
      selected.set(sticker.id, sticker);
    }

    return [...selected.values()];
  }

  private randomSticker(): Sticker {
    const roll = Math.random();
    const rarity: Rarity = roll < 0.05 ? 'holografico' : roll < 0.3 ? 'brillante' : 'base';
    const pool = this.stickers.filter((sticker) => sticker.rarity === rarity);
    const source = pool.length > 0 ? pool : this.stickers;

    return source[Math.floor(Math.random() * source.length)];
  }

  private calculateChallenges(): readonly AlbumChallenge[] {
    const copies = this.copies();
    const opened = this.packsOpened();
    const progress = this.progress();
    const holoCount = this.stickers.filter(
      (sticker) => sticker.rarity === 'holografico' && copiesOf(copies, sticker.id) > 0,
    ).length;
    const hasFullTeam = [...new Set(this.stickers.map((sticker) => sticker.teamId))].some(
      (teamId) =>
        this.stickers
          .filter((sticker) => sticker.teamId === teamId)
          .every((sticker) => copiesOf(copies, sticker.id) > 0),
    );

    return [
      {
        id: 'firstPack',
        index: '01',
        title: 'Primer sobre',
        copy: 'Abre tu primer sobre local y pega los primeros cromos.',
        progressLabel: `${Math.min(opened, 1)}/1`,
        complete: opened >= 1,
      },
      {
        id: 'tenPercent',
        index: '02',
        title: 'Arranque fuerte',
        copy: 'Completa al menos el 10% del album.',
        progressLabel: `${Math.min(progress, 10)}/10%`,
        complete: progress >= 10,
      },
      {
        id: 'holoHunter',
        index: '03',
        title: 'Cazador holo',
        copy: 'Consigue 5 cromos holograficos.',
        progressLabel: `${Math.min(holoCount, 5)}/5`,
        complete: holoCount >= 5,
      },
      {
        id: 'fullTeam',
        index: '04',
        title: 'Pais completo',
        copy: 'Completa los 5 cromos jugables de un pais participante.',
        progressLabel: `${hasFullTeam ? 1 : 0}/1`,
        complete: hasFullTeam,
      },
    ];
  }

  private readLocalState(): LocalAlbumState {
    if (!this.canUseLocalStorage()) {
      return { copies: {}, packsOpened: 0, theme: 'dark' };
    }

    try {
      const saved = JSON.parse(
        localStorage.getItem(STORE_KEY) ?? 'null',
      ) as Partial<LocalAlbumState> | null;

      return {
        copies: saved?.copies ?? {},
        packsOpened: saved?.packsOpened ?? 0,
        theme: saved?.theme === 'light' ? 'light' : 'dark',
      };
    } catch {
      return { copies: {}, packsOpened: 0, theme: 'dark' };
    }
  }

  private writeLocalState(state: LocalAlbumState): void {
    if (!this.canUseLocalStorage()) {
      return;
    }

    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  private canUseLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
