import type { FirebaseOptions, FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { InventoryCopies, Sticker, UserProfile } from '../models/album.models';

export interface FirebaseRuntimeConfig {
  readonly firebaseConfig: FirebaseOptions;
  readonly useEmulators: boolean;
  readonly useCloudFunctions: boolean;
}

export interface FirebaseServices {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly db: Firestore;
}

export interface FirebaseSessionUser {
  readonly uid: string;
  readonly displayName: string | null;
  readonly email: string | null;
  readonly isAnonymous: boolean;
}

export interface FirebaseSessionSnapshot {
  readonly configured: boolean;
  readonly user: FirebaseSessionUser | null;
  readonly profile: UserProfile | null;
  readonly inventory: InventoryCopies;
  readonly busy: boolean;
  readonly message: string;
  readonly error: string;
  readonly canUseGuest: boolean;
  readonly useCloudFunctions: boolean;
}

export interface OpenPackResult {
  readonly stickers: readonly Sticker[];
}

export interface RoomSummary {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly ownerId: string;
  readonly memberIds: readonly string[];
}

export interface TradeSummary {
  readonly id: string;
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly roomId: string | null;
  readonly offered: readonly string[];
  readonly requested: readonly string[];
  readonly status: 'pending' | 'accepted' | 'declined' | 'cancelled';
}

export function toSessionUser(user: User | null): FirebaseSessionUser | null {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    isAnonymous: user.isAnonymous,
  };
}
