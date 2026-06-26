import { inject, Injectable } from '@angular/core';
import type { Unsubscribe } from 'firebase/firestore';
import { AlbumStore } from '../state/album-store.service';
import { FirebaseAppService } from './firebase-app.service';

@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly album = inject(AlbumStore);
  private readonly firebaseApp = inject(FirebaseAppService);

  async completeMission(missionId: string): Promise<void> {
    this.assertMissionComplete(missionId);
    await this.completeMissionInFirestore(missionId);
  }

  async listenToClaimedMissions(
    userId: string,
    callback: (missionIds: ReadonlySet<string>) => void,
    onError: (error: unknown) => void,
  ): Promise<Unsubscribe> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      callback(new Set());
      return () => undefined;
    }

    const firestore = await import('firebase/firestore');
    return firestore.onSnapshot(
      firestore.collection(services.db, 'users', userId, 'missions'),
      (snapshot) => {
        const claimed = new Set<string>();
        snapshot.forEach((item) => {
          if (item.data()['claimed']) {
            claimed.add(item.id);
          }
        });
        callback(claimed);
      },
      onError,
    );
  }

  private async completeMissionInFirestore(missionId: string): Promise<void> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      throw new Error('Firebase no esta configurado.');
    }

    const user = services.auth.currentUser;
    if (!user) {
      throw new Error('Inicia sesión para continuar.');
    }

    const firestore = await import('firebase/firestore');
    const userRef = firestore.doc(services.db, 'users', user.uid);
    const missionRef = firestore.doc(services.db, 'users', user.uid, 'missions', missionId);

    await firestore.runTransaction(services.db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const profile = userSnap.exists() ? userSnap.data() : {};
      const missionSnap = await transaction.get(missionRef);
      if (missionSnap.exists() && missionSnap.data()['claimed']) {
        throw new Error('La mision ya fue cobrada.');
      }

      transaction.set(
        missionRef,
        {
          claimed: true,
          claimedAt: firestore.serverTimestamp(),
          reward: { coins: 25, packsAvailable: 1 },
        },
        { merge: true },
      );
      transaction.set(
        userRef,
        {
          coins: Number(profile['coins'] ?? 0) + 25,
          packsAvailable: Number(profile['packsAvailable'] ?? 0) + 1,
          lastMissionRewardId: missionId,
          updatedAt: firestore.serverTimestamp(),
        },
        { merge: true },
      );
    });
  }

  private assertMissionComplete(missionId: string): void {
    const challenge = this.album.challenges().find((item) => item.id === missionId);
    if (!challenge) {
      throw new Error('Mision no reconocida.');
    }

    if (!challenge.complete) {
      throw new Error('Aun no completas esta mision.');
    }
  }
}
