import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import type { OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Unsubscribe } from 'firebase/firestore';
import { albumStickers } from '../../core/data/album-catalog';
import { friendlyFirebaseError } from '../../core/firebase/firebase-errors';
import type { RoomSummary, TradeSummary } from '../../core/firebase/firebase.models';
import { FirebaseSessionStore } from '../../core/firebase/firebase-session.store';
import { RoomService } from '../../core/firebase/room.service';
import type { Sticker } from '../../core/models/album.models';
import { AlbumStore } from '../../core/state/album-store.service';

interface TradePair {
  readonly offer: Sticker;
  readonly request: Sticker;
}

@Component({
  selector: 'app-room-page',
  imports: [RouterLink],
  templateUrl: './room-page.component.html',
  styleUrl: './room-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomPageComponent implements OnDestroy {
  private readonly roomService = inject(RoomService);
  protected readonly album = inject(AlbumStore);
  protected readonly session = inject(FirebaseSessionStore);
  protected readonly roomCode = signal('');
  protected readonly selectedRoomId = signal('');
  protected readonly rooms = signal<readonly RoomSummary[]>([]);
  protected readonly trades = signal<readonly TradeSummary[]>([]);
  protected readonly busy = signal(false);
  protected readonly status = signal('');
  protected readonly totalStickers = albumStickers.length;
  protected readonly duplicates = computed(() =>
    albumStickers.filter((sticker) => this.album.copyCount(sticker.id) > 1).slice(0, 6),
  );
  protected readonly missing = computed(() =>
    albumStickers.filter((sticker) => this.album.copyCount(sticker.id) === 0).slice(0, 6),
  );
  protected readonly activeRoom = computed(
    () => this.rooms().find((room) => room.id === this.selectedRoomId()) ?? this.rooms()[0] ?? null,
  );
  protected readonly activePeerId = computed(
    () =>
      this.activeRoom()?.memberIds.find((memberId) => memberId !== this.session.user()?.uid) ?? '',
  );
  protected readonly tradePairs = computed<readonly TradePair[]>(() =>
    this.duplicates()
      .slice(0, 3)
      .map((offer, index) => ({ offer, request: this.missing()[index] }))
      .filter((pair): pair is TradePair => Boolean(pair.request)),
  );
  protected readonly incomingTrades = computed(() =>
    this.trades().filter(
      (trade) => trade.toUserId === this.session.user()?.uid && trade.status === 'pending',
    ),
  );
  protected readonly outgoingTrades = computed(() =>
    this.trades().filter((trade) => trade.fromUserId === this.session.user()?.uid),
  );
  private roomsUnsubscribe: Unsubscribe = () => undefined;
  private tradesUnsubscribe: Unsubscribe = () => undefined;
  private readonly stickerMap = new Map(albumStickers.map((sticker) => [sticker.id, sticker]));
  private readonly syncOnlineData = effect(
    () => {
      const user = this.session.user();
      this.stopListeners();
      this.rooms.set([]);
      this.trades.set([]);
      this.selectedRoomId.set('');

      if (!user) {
        return;
      }

      void this.roomService
        .listenToRooms(
          user.uid,
          (rooms) => {
            this.rooms.set(rooms);
            if (!this.selectedRoomId() && rooms[0]) {
              this.selectedRoomId.set(rooms[0].id);
            }
          },
          (error) => this.status.set(friendlyFirebaseError(error)),
        )
        .then((unsubscribe) => {
          this.roomsUnsubscribe = unsubscribe;
        });
      void this.roomService
        .listenToTrades(
          user.uid,
          (trades) => this.trades.set(trades),
          (error) => this.status.set(friendlyFirebaseError(error)),
        )
        .then((unsubscribe) => {
          this.tradesUnsubscribe = unsubscribe;
        });
    },
    { allowSignalWrites: true },
  );

  ngOnDestroy(): void {
    this.stopListeners();
  }

  protected updateRoomCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.roomCode.set(input.value.toUpperCase());
  }

  protected selectRoom(roomId: string): void {
    this.selectedRoomId.set(roomId);
  }

  protected createRoom(): void {
    if (!this.session.isAuthenticated()) {
      return;
    }

    void this.runRoomAction(async () => {
      const room = await this.roomService.createRoom(
        `${this.session.profile()?.nickname || 'Coleccionista'} FC`,
      );
      this.selectedRoomId.set(room.roomId);
      this.roomCode.set(room.code);
      this.status.set(`Sala ${room.code} lista.`);
    });
  }

  protected joinRoom(): void {
    if (!this.session.isAuthenticated() || this.roomCode().trim().length < 4) {
      return;
    }

    void this.runRoomAction(async () => {
      const room = await this.roomService.joinRoom(this.roomCode());
      this.selectedRoomId.set(room.roomId);
      this.status.set(`Te uniste a ${room.code}.`);
    });
  }

  protected proposeTrade(pair: TradePair): void {
    const room = this.activeRoom();
    const peerId = this.activePeerId();
    if (!room || !peerId) {
      return;
    }

    void this.runRoomAction(async () => {
      await this.roomService.createTrade({
        roomId: room.id,
        toUserId: peerId,
        offered: [pair.offer.id],
        requested: [pair.request.id],
      });
      this.status.set('Propuesta enviada.');
    });
  }

  protected acceptTrade(trade: TradeSummary): void {
    void this.runRoomAction(async () => {
      await this.roomService.acceptTrade(trade.id);
      this.status.set('Cambio completado.');
    });
  }

  protected stickerName(stickerId: string): string {
    return this.stickerMap.get(stickerId)?.name ?? stickerId;
  }

  protected stickerMeta(stickerId: string): string {
    const sticker = this.stickerMap.get(stickerId);
    return sticker ? `${sticker.team} · ${sticker.id}` : stickerId;
  }

  protected memberLabel(memberId: string): string {
    const index = this.activeRoom()?.memberIds.indexOf(memberId) ?? -1;
    return index >= 0 ? `Coleccionista ${index + 1}` : 'Coleccionista';
  }

  protected tradeStatusLabel(trade: TradeSummary): string {
    if (trade.status === 'accepted') {
      return 'Aceptado';
    }

    if (trade.status === 'cancelled') {
      return 'Cancelado';
    }

    if (trade.status === 'declined') {
      return 'Rechazado';
    }

    return 'Pendiente';
  }

  private async runRoomAction(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.status.set('');

    try {
      await action();
    } catch (error) {
      this.status.set(friendlyFirebaseError(error));
    } finally {
      this.busy.set(false);
    }
  }

  private stopListeners(): void {
    this.roomsUnsubscribe();
    this.tradesUnsubscribe();
    this.roomsUnsubscribe = () => undefined;
    this.tradesUnsubscribe = () => undefined;
  }
}
