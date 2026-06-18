export type Rarity = 'base' | 'brillante' | 'holografico';

export interface Team {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly flagCode: string;
  readonly confederation: string;
  readonly colors: readonly [string, string];
}

export interface Player {
  readonly shirt: string;
  readonly position: string;
  readonly role: string;
  readonly name: string;
  readonly nameOnShirt?: string;
  readonly club?: string;
  readonly height?: string;
  readonly caps?: number;
  readonly goals?: number;
}

export interface Sticker {
  readonly id: string;
  readonly number: number;
  readonly teamId: string;
  readonly team: string;
  readonly flagCode: string;
  readonly confederation: string;
  readonly colors: readonly [string, string];
  readonly role: string;
  readonly rarity: Rarity;
  readonly name: string;
  readonly position: string;
  readonly shirt: string;
  readonly height: string;
  readonly portrait: string;
  readonly privateSlot: string;
  readonly caption: string;
  readonly note: string;
}

export type Stadium = readonly [name: string, location: string, note: string];

export type InventoryCopies = Readonly<Record<string, number>>;

export interface UserProfile {
  readonly uid: string;
  readonly nickname: string;
  readonly coins: number;
  readonly packsAvailable: number;
  readonly packsOpened: number;
  readonly starterPackClaimed: boolean;
}

export interface CollectionFilters {
  readonly query: string;
  readonly confederation: string;
  readonly status: 'all' | 'owned' | 'missing' | 'duplicate';
  readonly rarity: 'all' | Rarity;
}

export interface AlbumChallenge {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly copy: string;
  readonly progressLabel: string;
  readonly complete: boolean;
}
