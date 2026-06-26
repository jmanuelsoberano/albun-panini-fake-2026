import { inject, Injectable } from '@angular/core';
import { albumStickers } from '../data/album-catalog';
import type { Sticker } from '../models/album.models';
import { FirebaseAppService } from './firebase-app.service';
import type { OpenPackResult } from './firebase.models';

@Injectable({ providedIn: 'root' })
export class PackService {
  private readonly firebaseApp = inject(FirebaseAppService);
  private readonly stickers = albumStickers;

  async claimStarterPack(): Promise<void> {
    await this.claimStarterPackInFirestore();
  }

  async openPack(packType = 'normal'): Promise<OpenPackResult> {
    return { stickers: await this.openPackInFirestore(packType) };
  }

  private async claimStarterPackInFirestore(): Promise<void> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      throw new Error('Firebase no esta configurado.');
    }

    if (!services.auth.currentUser) {
      throw new Error('Inicia sesión para continuar.');
    }

    const firestore = await import('firebase/firestore');
    const userRef = firestore.doc(services.db, 'users', services.auth.currentUser.uid);

    await firestore.runTransaction(services.db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const user = userSnap.exists() ? userSnap.data() : {};

      if (user['starterPackClaimed']) {
        throw new Error('El sobre inicial ya fue reclamado.');
      }

      transaction.set(
        userRef,
        {
          starterPackClaimed: true,
          packsAvailable: Number(user['packsAvailable'] ?? 0) + 1,
          updatedAt: firestore.serverTimestamp(),
        },
        { merge: true },
      );
    });
  }

  private async openPackInFirestore(packType: string): Promise<readonly Sticker[]> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      throw new Error('Firebase no esta configurado.');
    }

    const user = services.auth.currentUser;
    if (!user) {
      throw new Error('Inicia sesión para continuar.');
    }

    const firestore = await import('firebase/firestore');
    const stickers = this.randomUniquePack(5);
    const userRef = firestore.doc(services.db, 'users', user.uid);
    const openingRef = firestore.doc(firestore.collection(services.db, 'packOpenings'));
    const inventoryRefs = stickers.map((sticker) =>
      firestore.doc(services.db, 'users', user.uid, 'inventory', sticker.id),
    );

    await firestore.runTransaction(services.db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const profile = userSnap.exists() ? userSnap.data() : {};
      const available = Number(profile['packsAvailable'] ?? 0);

      if (available <= 0) {
        throw new Error('No tienes sobres disponibles.');
      }

      transaction.update(userRef, {
        packsAvailable: available - 1,
        packsOpened: Number(profile['packsOpened'] ?? 0) + 1,
        updatedAt: firestore.serverTimestamp(),
      });

      transaction.set(openingRef, {
        userId: user.uid,
        packType,
        stickerIds: stickers.map((sticker) => sticker.id),
        source: 'firestore-client',
        createdAt: firestore.serverTimestamp(),
      });

      inventoryRefs.forEach((ref, index) => {
        transaction.set(
          ref,
          {
            stickerId: stickers[index].id,
            copies: firestore.increment(1),
            lastOpeningId: openingRef.id,
            updatedAt: firestore.serverTimestamp(),
          },
          { merge: true },
        );
      });
    });

    return stickers;
  }

  private randomUniquePack(size: number): readonly Sticker[] {
    const selected = new Map<string, Sticker>();

    while (selected.size < size) {
      const sticker = this.randomSticker();
      selected.set(sticker.id, sticker);
    }

    return [...selected.values()];
  }

  private randomSticker(): Sticker {
    const roll = Math.random();
    const rarity = roll < 0.05 ? 'holografico' : roll < 0.3 ? 'brillante' : 'base';
    const pool = this.stickers.filter((sticker) => sticker.rarity === rarity);
    const source = pool.length > 0 ? pool : this.stickers;
    return source[Math.floor(Math.random() * source.length)];
  }
}
