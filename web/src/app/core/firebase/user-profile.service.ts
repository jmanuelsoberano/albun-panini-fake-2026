import { inject, Injectable } from '@angular/core';
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import type { UserProfile } from '../models/album.models';
import { FirebaseAppService } from './firebase-app.service';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly firebaseApp = inject(FirebaseAppService);

  async upsertUserProfile(user: User, nickname: string): Promise<string> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      throw new Error('Firebase no esta configurado.');
    }

    const firestore = await import('firebase/firestore');
    const safeNickname = this.normalizeNickname(nickname);
    const userRef = firestore.doc(services.db, 'users', user.uid);
    const userSnap = await firestore.getDoc(userRef);

    if (userSnap.exists()) {
      await firestore.setDoc(
        userRef,
        {
          nickname: safeNickname,
          avatarId: userSnap.data()['avatarId'] || 'avatar-01',
          updatedAt: firestore.serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await firestore.setDoc(userRef, {
        nickname: safeNickname,
        avatarId: 'avatar-01',
        coins: 0,
        packsAvailable: 0,
        packsOpened: 0,
        starterPackClaimed: false,
        updatedAt: firestore.serverTimestamp(),
        createdAt: firestore.serverTimestamp(),
      });
    }

    return safeNickname;
  }

  async listenToUserProfile(
    userId: string,
    callback: (profile: UserProfile | null) => void,
    onError: (error: unknown) => void,
  ): Promise<Unsubscribe> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      callback(null);
      return () => undefined;
    }

    const firestore = await import('firebase/firestore');
    return firestore.onSnapshot(
      firestore.doc(services.db, 'users', userId),
      (snapshot) => {
        callback(snapshot.exists() ? this.toProfile(snapshot.id, snapshot.data()) : null);
      },
      onError,
    );
  }

  private toProfile(uid: string, data: Record<string, unknown>): UserProfile {
    return {
      uid,
      nickname: String(data['nickname'] ?? 'Coleccionista'),
      coins: Number(data['coins'] ?? 0),
      packsAvailable: Number(data['packsAvailable'] ?? 0),
      packsOpened: Number(data['packsOpened'] ?? 0),
      starterPackClaimed: Boolean(data['starterPackClaimed']),
    };
  }

  private normalizeNickname(nickname: string): string {
    const value = String(nickname || '').trim();
    return value.slice(0, 28) || 'Coleccionista';
  }
}
