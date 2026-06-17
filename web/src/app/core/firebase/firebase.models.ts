import type { FirebaseOptions, FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Functions } from 'firebase/functions';
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
  readonly functions: Functions;
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
