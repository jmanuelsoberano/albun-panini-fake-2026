import type { CollectionFilters, InventoryCopies, Sticker } from '../models/album.models';

export function copiesOf(copies: InventoryCopies, stickerId: string): number {
  return copies[stickerId] ?? 0;
}

export function isOwned(copies: InventoryCopies, stickerId: string): boolean {
  return copiesOf(copies, stickerId) > 0;
}

export function isDuplicate(copies: InventoryCopies, stickerId: string): boolean {
  return copiesOf(copies, stickerId) > 1;
}

export function duplicateCount(copies: InventoryCopies): number {
  return Object.values(copies).reduce((total, count) => total + Math.max(0, count - 1), 0);
}

export function uniqueOwnedCount(stickers: readonly Sticker[], copies: InventoryCopies): number {
  return stickers.filter((sticker) => isOwned(copies, sticker.id)).length;
}

export function albumProgressPercent(total: number, owned: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((owned / total) * 100);
}

export function matchesStickerFilters(
  sticker: Sticker,
  filters: CollectionFilters,
  copies: InventoryCopies,
): boolean {
  const query = filters.query.trim().toLowerCase();
  const text = [
    sticker.id,
    sticker.name,
    sticker.team,
    sticker.role,
    sticker.position,
    sticker.shirt,
    sticker.confederation,
    sticker.rarity,
  ]
    .join(' ')
    .toLowerCase();

  if (query && !text.includes(query)) {
    return false;
  }

  if (filters.confederation !== 'all' && sticker.confederation !== filters.confederation) {
    return false;
  }

  if (filters.rarity !== 'all' && sticker.rarity !== filters.rarity) {
    return false;
  }

  if (filters.status === 'owned' && !isOwned(copies, sticker.id)) {
    return false;
  }

  if (filters.status === 'missing' && isOwned(copies, sticker.id)) {
    return false;
  }

  if (filters.status === 'duplicate' && !isDuplicate(copies, sticker.id)) {
    return false;
  }

  return true;
}

export function filterStickers(
  stickers: readonly Sticker[],
  filters: CollectionFilters,
  copies: InventoryCopies,
): readonly Sticker[] {
  return stickers.filter((sticker) => matchesStickerFilters(sticker, filters, copies));
}
