import { inject, Injectable } from '@angular/core';
import type {
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { FirebaseAppService } from './firebase-app.service';
import type { RoomSummary, TradeSummary } from './firebase.models';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly firebaseApp = inject(FirebaseAppService);

  async createRoom(name: string): Promise<{ roomId: string; code: string }> {
    return this.callFunction<{ roomId: string; code: string }>('createRoom', { name });
  }

  async joinRoom(code: string): Promise<{ roomId: string; code: string }> {
    return this.callFunction<{ roomId: string; code: string }>('joinRoom', { code });
  }

  async createTrade(payload: {
    readonly toUserId: string;
    readonly roomId: string;
    readonly offered: readonly string[];
    readonly requested: readonly string[];
  }): Promise<{ tradeId: string }> {
    return this.callFunction<{ tradeId: string }>('createTrade', payload);
  }

  async acceptTrade(tradeId: string): Promise<void> {
    await this.callFunction('acceptTrade', { tradeId });
  }

  async listenToRooms(
    userId: string,
    callback: (rooms: readonly RoomSummary[]) => void,
    onError: (error: unknown) => void,
  ): Promise<Unsubscribe> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      callback([]);
      return () => undefined;
    }

    const firestore = await import('firebase/firestore');
    const roomsQuery = firestore.query(
      firestore.collection(services.db, 'rooms'),
      firestore.where('memberIds', 'array-contains', userId),
    );

    return firestore.onSnapshot(
      roomsQuery,
      (snapshot) => {
        callback(
          snapshot.docs.map((document) => {
            const data = document.data();
            return {
              id: document.id,
              code: String(data['code'] ?? document.id),
              name: String(data['name'] ?? 'Sala de coleccionistas'),
              ownerId: String(data['ownerId'] ?? ''),
              memberIds: Array.isArray(data['memberIds']) ? data['memberIds'].map(String) : [],
            };
          }),
        );
      },
      onError,
    );
  }

  async listenToTrades(
    userId: string,
    callback: (trades: readonly TradeSummary[]) => void,
    onError: (error: unknown) => void,
  ): Promise<Unsubscribe> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      callback([]);
      return () => undefined;
    }

    const firestore = await import('firebase/firestore');
    const outgoing = new Map<string, TradeSummary>();
    const incoming = new Map<string, TradeSummary>();
    const emit = () => callback(this.mergeTrades(outgoing, incoming));
    const sync = (target: Map<string, TradeSummary>) => (snapshot: QuerySnapshot<DocumentData>) => {
      target.clear();
      snapshot.forEach((document) => target.set(document.id, this.toTradeSummary(document)));
      emit();
    };
    const outgoingQuery = firestore.query(
      firestore.collection(services.db, 'trades'),
      firestore.where('fromUserId', '==', userId),
    );
    const incomingQuery = firestore.query(
      firestore.collection(services.db, 'trades'),
      firestore.where('toUserId', '==', userId),
    );

    const unsubscribeOutgoing = firestore.onSnapshot(outgoingQuery, sync(outgoing), onError);
    const unsubscribeIncoming = firestore.onSnapshot(incomingQuery, sync(incoming), onError);

    return () => {
      unsubscribeOutgoing();
      unsubscribeIncoming();
    };
  }

  private async callFunction<T>(
    name: string,
    payload: Record<string, unknown>,
  ): Promise<T & Record<string, unknown>> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      throw new Error('Firebase no esta configurado.');
    }

    const functions = await import('firebase/functions');
    const callable = functions.httpsCallable<Record<string, unknown>, T & Record<string, unknown>>(
      services.functions,
      name,
    );
    const result = await callable(payload);
    return result.data;
  }

  private mergeTrades(
    outgoing: ReadonlyMap<string, TradeSummary>,
    incoming: ReadonlyMap<string, TradeSummary>,
  ): readonly TradeSummary[] {
    return [...new Map([...outgoing, ...incoming]).values()].sort((a, b) =>
      a.status === b.status ? a.id.localeCompare(b.id) : a.status === 'pending' ? -1 : 1,
    );
  }

  private toTradeSummary(document: QueryDocumentSnapshot<DocumentData>) {
    const data = document.data();

    return {
      id: document.id,
      fromUserId: String(data['fromUserId'] ?? ''),
      toUserId: String(data['toUserId'] ?? ''),
      roomId: data['roomId'] ? String(data['roomId']) : null,
      offered: Array.isArray(data['offered']) ? data['offered'].map(String) : [],
      requested: Array.isArray(data['requested']) ? data['requested'].map(String) : [],
      status: this.toTradeStatus(data['status']),
    };
  }

  private toTradeStatus(value: unknown): TradeSummary['status'] {
    return value === 'accepted' || value === 'declined' || value === 'cancelled'
      ? value
      : 'pending';
  }
}
