import { inject, Injectable } from '@angular/core';
import type {
  DocumentData,
  DocumentSnapshot,
  Firestore,
  QueryDocumentSnapshot,
  QuerySnapshot,
  Transaction,
  Unsubscribe,
} from 'firebase/firestore';
import { FirebaseAppService } from './firebase-app.service';
import type { RoomSummary, TradeSummary } from './firebase.models';

const MAX_ROOM_MEMBERS = 12;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly firebaseApp = inject(FirebaseAppService);

  async createRoom(name: string): Promise<{ roomId: string; code: string }> {
    const services = await this.requireServices();
    const userId = this.requireUserId(services.auth.currentUser?.uid);
    const firestore = await import('firebase/firestore');
    const code = this.createRoomCode();
    const roomRef = firestore.doc(services.db, 'rooms', code);
    const memberRef = firestore.doc(services.db, 'rooms', code, 'members', userId);

    await firestore.runTransaction(services.db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (roomSnap.exists()) {
        throw new Error('Intenta crear la sala de nuevo.');
      }

      transaction.set(roomRef, {
        code,
        name: this.safeRoomName(name),
        ownerId: userId,
        memberIds: [userId],
        createdAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp(),
      });
      transaction.set(memberRef, {
        userId,
        role: 'owner',
        joinedAt: firestore.serverTimestamp(),
      });
    });

    return { roomId: code, code };
  }

  async joinRoom(code: string): Promise<{ roomId: string; code: string }> {
    const services = await this.requireServices();
    const userId = this.requireUserId(services.auth.currentUser?.uid);
    const firestore = await import('firebase/firestore');
    const roomCode = this.normalizeRoomCode(code);
    const roomRef = firestore.doc(services.db, 'rooms', roomCode);
    const memberRef = firestore.doc(services.db, 'rooms', roomCode, 'members', userId);

    if (roomCode.length < 4) {
      throw new Error('Codigo de sala invalido.');
    }

    await firestore.runTransaction(services.db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('Sala no encontrada.');
      }

      const room = roomSnap.data();
      const memberIds = Array.isArray(room['memberIds']) ? room['memberIds'].map(String) : [];
      if (memberIds.length >= MAX_ROOM_MEMBERS && !memberIds.includes(userId)) {
        throw new Error('La sala ya esta llena.');
      }

      transaction.update(roomRef, {
        memberIds: [...new Set([...memberIds, userId])],
        updatedAt: firestore.serverTimestamp(),
      });
      transaction.set(
        memberRef,
        {
          userId,
          role: room['ownerId'] === userId ? 'owner' : 'member',
          joinedAt: firestore.serverTimestamp(),
        },
        { merge: true },
      );
    });

    return { roomId: roomCode, code: roomCode };
  }

  async createTrade(payload: {
    readonly toUserId: string;
    readonly roomId: string;
    readonly offered: readonly string[];
    readonly requested: readonly string[];
  }): Promise<{ tradeId: string }> {
    const services = await this.requireServices();
    const userId = this.requireUserId(services.auth.currentUser?.uid);
    const firestore = await import('firebase/firestore');
    const offered = this.normalizeStickerIds('oferta', payload.offered);
    const requested = this.normalizeStickerIds('solicitud', payload.requested);
    const tradeRef = firestore.doc(firestore.collection(services.db, 'trades'));
    const roomRef = firestore.doc(services.db, 'rooms', payload.roomId);

    if (!payload.toUserId || payload.toUserId === userId) {
      throw new Error('El intercambio necesita destinatario, oferta y solicitud.');
    }

    await firestore.runTransaction(services.db, async (transaction) => {
      const [roomSnap, offeredSnap] = await Promise.all([
        transaction.get(roomRef),
        transaction.get(firestore.doc(services.db, 'users', userId, 'inventory', offered[0])),
      ]);
      const memberIds =
        roomSnap.exists() && Array.isArray(roomSnap.data()['memberIds'])
          ? roomSnap.data()['memberIds'].map(String)
          : [];
      if (!memberIds.includes(userId) || !memberIds.includes(payload.toUserId)) {
        throw new Error('Ambos coleccionistas deben estar en la sala.');
      }

      if (!offeredSnap.exists() || Number(offeredSnap.data()['copies'] ?? 0) < 1) {
        throw new Error('Tu oferta no tiene copias disponibles para completar el cambio.');
      }

      transaction.set(tradeRef, {
        fromUserId: userId,
        toUserId: payload.toUserId,
        roomId: payload.roomId,
        offered,
        requested,
        status: 'pending',
        createdAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp(),
      });
    });

    return { tradeId: tradeRef.id };
  }

  async acceptTrade(tradeId: string): Promise<void> {
    const services = await this.requireServices();
    const userId = this.requireUserId(services.auth.currentUser?.uid);
    const firestore = await import('firebase/firestore');
    const tradeRef = firestore.doc(services.db, 'trades', tradeId);

    await firestore.runTransaction(services.db, async (transaction) => {
      const tradeSnap = await transaction.get(tradeRef);
      if (!tradeSnap.exists()) {
        throw new Error('Intercambio no encontrado.');
      }

      const trade = this.toTradeSummary(tradeSnap);
      if (trade.status !== 'pending') {
        throw new Error('El intercambio ya no esta pendiente.');
      }

      if (trade.toUserId !== userId) {
        throw new Error('No puedes aceptar este intercambio.');
      }

      const offered = this.normalizeStickerIds('oferta', trade.offered);
      const requested = this.normalizeStickerIds('solicitud', trade.requested);
      await this.applySingleStickerTrade(transaction, services.db, trade, offered[0], requested[0]);

      transaction.update(tradeRef, {
        status: 'accepted',
        acceptedAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp(),
      });
    });
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

  private async requireServices() {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      throw new Error('Firebase no esta configurado.');
    }

    return services;
  }

  private requireUserId(userId: string | undefined): string {
    if (!userId) {
      throw new Error('Inicia sesion para continuar.');
    }

    return userId;
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

  private async applySingleStickerTrade(
    transaction: Transaction,
    db: Firestore,
    trade: TradeSummary,
    offeredStickerId: string,
    requestedStickerId: string,
  ): Promise<void> {
    const firestore = await import('firebase/firestore');
    const fromOfferedRef = firestore.doc(
      db,
      'users',
      trade.fromUserId,
      'inventory',
      offeredStickerId,
    );
    const fromRequestedRef = firestore.doc(
      db,
      'users',
      trade.fromUserId,
      'inventory',
      requestedStickerId,
    );
    const toOfferedRef = firestore.doc(db, 'users', trade.toUserId, 'inventory', offeredStickerId);
    const toRequestedRef = firestore.doc(
      db,
      'users',
      trade.toUserId,
      'inventory',
      requestedStickerId,
    );
    const [fromOfferedSnap, fromRequestedSnap, toOfferedSnap, toRequestedSnap] = await Promise.all([
      transaction.get(fromOfferedRef),
      transaction.get(fromRequestedRef),
      transaction.get(toOfferedRef),
      transaction.get(toRequestedRef),
    ]);
    const fromOfferedCopies = this.snapshotCopies(fromOfferedSnap);
    const toRequestedCopies = this.snapshotCopies(toRequestedSnap);

    if (fromOfferedCopies < 1) {
      throw new Error('La oferta no tiene copias disponibles para completar el cambio.');
    }

    if (toRequestedCopies < 1) {
      throw new Error('Tu album no tiene copias disponibles para completar el cambio.');
    }

    transaction.update(fromOfferedRef, {
      copies: fromOfferedCopies - 1,
      lastTradeId: trade.id,
      updatedAt: firestore.serverTimestamp(),
    });
    transaction.set(
      fromRequestedRef,
      {
        stickerId: requestedStickerId,
        copies: this.snapshotCopies(fromRequestedSnap) + 1,
        lastTradeId: trade.id,
        updatedAt: firestore.serverTimestamp(),
      },
      { merge: true },
    );
    transaction.set(
      toOfferedRef,
      {
        stickerId: offeredStickerId,
        copies: this.snapshotCopies(toOfferedSnap) + 1,
        lastTradeId: trade.id,
        updatedAt: firestore.serverTimestamp(),
      },
      { merge: true },
    );
    transaction.update(toRequestedRef, {
      copies: toRequestedCopies - 1,
      lastTradeId: trade.id,
      updatedAt: firestore.serverTimestamp(),
    });
  }

  private snapshotCopies(snapshot: DocumentSnapshot<DocumentData>): number {
    return snapshot.exists() ? Number(snapshot.data()['copies'] ?? 0) : 0;
  }

  private normalizeStickerIds(fieldName: string, value: readonly string[]): readonly [string] {
    const ids = value.map((item) => String(item || '').trim()).filter(Boolean);
    if (ids.length !== 1) {
      throw new Error(`${fieldName} debe incluir exactamente 1 cromo.`);
    }

    return [ids[0]];
  }

  private normalizeRoomCode(value: string): string {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  private createRoomCode(): string {
    return Array.from(
      { length: 6 },
      () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)],
    ).join('');
  }

  private safeRoomName(value: string): string {
    const name = String(value || '').trim();
    return name.length > 0 ? name.slice(0, 42) : 'Sala de coleccionistas';
  }
}
