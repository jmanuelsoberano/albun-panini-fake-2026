import { computed, inject, Injectable, signal } from '@angular/core';
import type { Unsubscribe, User } from 'firebase/auth';
import type { InventoryCopies, Sticker, UserProfile } from '../models/album.models';
import { AlbumStore } from '../state/album-store.service';
import { AuthService } from './auth.service';
import { friendlyFirebaseError } from './firebase-errors';
import { FirebaseConfigService } from './firebase-config.service';
import type { FirebaseSessionUser } from './firebase.models';
import { toSessionUser } from './firebase.models';
import { InventoryService } from './inventory.service';
import { PackService } from './pack.service';
import { UserProfileService } from './user-profile.service';

@Injectable({ providedIn: 'root' })
export class FirebaseSessionStore {
  private readonly album = inject(AlbumStore);
  private readonly auth = inject(AuthService);
  private readonly config = inject(FirebaseConfigService);
  private readonly inventoryService = inject(InventoryService);
  private readonly packService = inject(PackService);
  private readonly profileService = inject(UserProfileService);
  private initialized = false;
  private sessionUnsubscribe: Unsubscribe = () => undefined;
  private profileUnsubscribe: Unsubscribe = () => undefined;
  private inventoryUnsubscribe: Unsubscribe = () => undefined;

  readonly configured = signal(false);
  readonly canUseGuest = signal(false);
  readonly useCloudFunctions = signal(false);
  readonly user = signal<FirebaseSessionUser | null>(null);
  readonly profile = signal<UserProfile | null>(null);
  readonly inventory = signal<InventoryCopies>({});
  readonly busy = signal(false);
  readonly message = signal('Modo local. Progreso guardado en este navegador.');
  readonly error = signal('');

  readonly onlineMode = computed(() => Boolean(this.user()));
  readonly coins = computed(() => this.profile()?.coins ?? 0);
  readonly packsAvailable = computed(() => this.profile()?.packsAvailable ?? 0);
  readonly starterPackClaimed = computed(() => Boolean(this.profile()?.starterPackClaimed));

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.configured.set(await this.config.isConfigured());
    this.canUseGuest.set(await this.config.canUseGuestSignIn());
    this.useCloudFunctions.set(await this.config.shouldUseCloudFunctions());

    if (!this.configured()) {
      this.album.useLocalMode();
      this.message.set('Modo local. Agrega web/public/firebase-config.js para activar Firebase.');
      return;
    }

    this.sessionUnsubscribe = await this.auth.listenToSession((user) => {
      void this.handleSessionUser(user);
    });
  }

  async signInWithGoogle(nickname: string): Promise<void> {
    await this.runAction(async () => {
      await this.auth.signInWithGoogle(nickname);
      this.message.set('Sesion iniciada con Google.');
    });
  }

  async signInGuest(nickname: string): Promise<void> {
    await this.runAction(async () => {
      await this.auth.signInGuest(nickname);
      this.message.set('Sesion invitada local iniciada.');
    });
  }

  async claimStarterPack(): Promise<void> {
    await this.runAction(async () => {
      await this.packService.claimStarterPack();
      this.message.set('Sobre inicial reclamado.');
    });
  }

  async openPack(): Promise<readonly Sticker[]> {
    let stickers: readonly Sticker[] = [];

    await this.runAction(async () => {
      stickers = (await this.packService.openPack()).stickers;
      this.message.set('Sobre abierto con Firebase.');
    });

    return stickers;
  }

  private async handleSessionUser(user: User | null): Promise<void> {
    this.unsubscribeOnlineListeners();
    this.user.set(toSessionUser(user));
    this.profile.set(null);
    this.inventory.set({});

    if (!user) {
      this.album.useLocalMode();
      this.message.set('Modo local. Inicia sesion para sincronizar inventario.');
      return;
    }

    this.message.set('Modo Firebase. Inventario sincronizado.');
    this.profileUnsubscribe = await this.profileService.listenToUserProfile(
      user.uid,
      (profile) => this.profile.set(profile),
      (error) => this.setError(error),
    );
    this.inventoryUnsubscribe = await this.inventoryService.listenToInventory(
      user.uid,
      (copies) => {
        this.inventory.set(copies);
        this.album.useFirebaseInventory(copies);
      },
      (error) => this.setError(error),
    );
  }

  private async runAction(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');

    try {
      await action();
    } catch (error) {
      this.setError(error);
    } finally {
      this.busy.set(false);
    }
  }

  private setError(error: unknown): void {
    this.error.set(friendlyFirebaseError(error));
  }

  private unsubscribeOnlineListeners(): void {
    this.profileUnsubscribe();
    this.inventoryUnsubscribe();
    this.profileUnsubscribe = () => undefined;
    this.inventoryUnsubscribe = () => undefined;
  }
}
