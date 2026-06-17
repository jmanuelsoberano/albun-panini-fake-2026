import { inject, Injectable } from '@angular/core';
import type { Unsubscribe } from 'firebase/firestore';
import type { InventoryCopies } from '../models/album.models';
import { FirebaseAppService } from './firebase-app.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly firebaseApp = inject(FirebaseAppService);

  async listenToInventory(
    userId: string,
    callback: (copies: InventoryCopies) => void,
    onError: (error: unknown) => void,
  ): Promise<Unsubscribe> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      callback({});
      return () => undefined;
    }

    const firestore = await import('firebase/firestore');
    return firestore.onSnapshot(
      firestore.collection(services.db, 'users', userId, 'inventory'),
      (snapshot) => {
        const copies: Record<string, number> = {};
        snapshot.forEach((item) => {
          const data = item.data();
          copies[String(data['stickerId'] ?? item.id)] = Number(data['copies'] ?? 0);
        });
        callback(copies);
      },
      onError,
    );
  }
}
