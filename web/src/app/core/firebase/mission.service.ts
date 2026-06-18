import { inject, Injectable } from '@angular/core';
import type { Unsubscribe } from 'firebase/firestore';
import { FirebaseAppService } from './firebase-app.service';
import { FirebaseConfigService } from './firebase-config.service';

@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly firebaseApp = inject(FirebaseAppService);
  private readonly config = inject(FirebaseConfigService);

  async completeMission(missionId: string): Promise<void> {
    if (await this.config.shouldUseCloudFunctions()) {
      await this.callFunction('completeMission', { missionId });
      return;
    }

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

  private async callFunction(
    name: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      throw new Error('Firebase no esta configurado.');
    }

    const functions = await import('firebase/functions');
    const callable = functions.httpsCallable<Record<string, unknown>, Record<string, unknown>>(
      services.functions,
      name,
    );
    const result = await callable(payload);
    return result.data;
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
      const missionSnap = await transaction.get(missionRef);
      if (missionSnap.exists() && missionSnap.data()['claimed']) {
        throw new Error('La mision ya fue cobrada.');
      }

      transaction.set(
        missionRef,
        {
          claimed: true,
          claimedAt: firestore.serverTimestamp(),
          reward: { coins: 25 },
        },
        { merge: true },
      );
      transaction.set(
        userRef,
        {
          coins: firestore.increment(25),
          updatedAt: firestore.serverTimestamp(),
        },
        { merge: true },
      );
    });
  }
}
