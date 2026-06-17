import type { CollectionFilters, Sticker } from '../models/album.models';
import {
  albumProgressPercent,
  duplicateCount,
  filterStickers,
  isDuplicate,
  isOwned,
  uniqueOwnedCount,
} from './album-domain';

const stickers: readonly Sticker[] = [
  {
    id: 'FG-001',
    number: 1,
    teamId: 'T01',
    team: 'Mexico',
    confederation: 'Concacaf',
    colors: ['#10233d', '#c8942e'],
    role: 'Portero',
    rarity: 'base',
    name: 'Jose Raul Rangel Aguilar',
    position: 'GK',
    shirt: '1',
    height: '1.90 m',
    portrait: '',
    privateSlot: 'private-assets/players/fg-001.webp',
    caption: 'Ficha 001',
    note: 'Nombre factual sin arte oficial.',
  },
  {
    id: 'FG-002',
    number: 2,
    teamId: 'T02',
    team: 'Argentina',
    confederation: 'CONMEBOL',
    colors: ['#0f62fe', '#7dd3fc'],
    role: 'Referente',
    rarity: 'holografico',
    name: 'Lionel Andres Messi',
    position: 'FW',
    shirt: '10',
    height: '1.70 m',
    portrait: '',
    privateSlot: 'private-assets/players/fg-002.webp',
    caption: 'Ficha 002',
    note: 'Nombre factual sin arte oficial.',
  },
];

const defaultFilters: CollectionFilters = {
  query: '',
  confederation: 'all',
  status: 'all',
  rarity: 'all',
};

describe('album-domain utilities', () => {
  it('calculates owned, duplicate, and progress counts', () => {
    const copies = { 'FG-001': 2 };

    expect(isOwned(copies, 'FG-001')).toBe(true);
    expect(isOwned(copies, 'FG-002')).toBe(false);
    expect(isDuplicate(copies, 'FG-001')).toBe(true);
    expect(duplicateCount(copies)).toBe(1);
    expect(uniqueOwnedCount(stickers, copies)).toBe(1);
    expect(albumProgressPercent(stickers.length, 1)).toBe(50);
  });

  it('filters stickers by query, confederation, status, and rarity', () => {
    const copies = { 'FG-001': 2 };

    expect(filterStickers(stickers, { ...defaultFilters, query: 'messi' }, copies)).toEqual([
      stickers[1],
    ]);
    expect(
      filterStickers(stickers, { ...defaultFilters, confederation: 'Concacaf' }, copies),
    ).toEqual([stickers[0]]);
    expect(filterStickers(stickers, { ...defaultFilters, status: 'duplicate' }, copies)).toEqual([
      stickers[0],
    ]);
    expect(filterStickers(stickers, { ...defaultFilters, rarity: 'holografico' }, copies)).toEqual([
      stickers[1],
    ]);
  });
});
