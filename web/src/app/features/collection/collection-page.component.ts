import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { CollectionFilters, Sticker } from '../../core/models/album.models';
import { albumStickers, confederations } from '../../core/data/album-catalog';
import { AlbumStore } from '../../core/state/album-store.service';
import { CollectionFiltersComponent } from './collection-filters/collection-filters.component';
import { CollectionGridComponent } from './collection-grid/collection-grid.component';
import { CollectionStatsComponent } from './collection-stats/collection-stats.component';
import { PackDialogComponent } from './pack-dialog/pack-dialog.component';
import { PackStripComponent } from './pack-strip/pack-strip.component';
import { StickerDetailDialogComponent } from './sticker-detail-dialog/sticker-detail-dialog.component';
import { TeamPagesComponent } from './team-pages/team-pages.component';
import { SessionPanelComponent } from '../session/session-panel/session-panel.component';

@Component({
  selector: 'app-collection-page',
  imports: [
    CollectionFiltersComponent,
    CollectionGridComponent,
    CollectionStatsComponent,
    PackDialogComponent,
    PackStripComponent,
    SessionPanelComponent,
    StickerDetailDialogComponent,
    TeamPagesComponent,
  ],
  templateUrl: './collection-page.component.html',
  styleUrl: './collection-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPageComponent {
  protected readonly album = inject(AlbumStore);
  protected readonly stickers = albumStickers;
  protected readonly confederations = confederations;
  protected readonly lastPack = signal<readonly Sticker[]>([]);
  protected readonly lastPackSource = signal<'local' | 'firebase'>('local');
  protected readonly packDialogOpen = signal(false);
  protected readonly selectedSticker = signal<Sticker | null>(null);

  protected openLocalPack(): void {
    this.lastPackSource.set('local');
    this.lastPack.set(this.album.openLocalPack());
    this.packDialogOpen.set(true);
  }

  protected addRandomStickers(): void {
    this.lastPack.set(this.album.addRandomStickers(10));
    this.packDialogOpen.set(false);
  }

  protected showOpenedPack(stickers: readonly Sticker[]): void {
    this.lastPackSource.set('firebase');
    this.lastPack.set(stickers);
    this.packDialogOpen.set(true);
  }

  protected resetLocalAlbum(): void {
    this.album.resetLocalAlbum();
    this.lastPack.set([]);
    this.packDialogOpen.set(false);
    this.selectedSticker.set(null);
  }

  protected updateFilters(patch: Partial<CollectionFilters>): void {
    this.album.updateFilters(patch);
  }

  protected showGridView(): void {
    this.album.setActiveView('grid');
  }

  protected showTeamPages(): void {
    this.album.setActiveView('teams');
  }

  protected selectSticker(sticker: Sticker): void {
    this.selectedSticker.set(sticker);
  }

  protected closeStickerDetail(): void {
    this.selectedSticker.set(null);
  }

  protected closePackDialog(): void {
    this.packDialogOpen.set(false);
  }
}
