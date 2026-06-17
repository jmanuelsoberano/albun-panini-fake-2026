import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { Sticker } from '../../../core/models/album.models';
import { FirebaseSessionStore } from '../../../core/firebase/firebase-session.store';

@Component({
  selector: 'app-session-panel',
  templateUrl: './session-panel.component.html',
  styleUrl: './session-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionPanelComponent implements OnInit {
  protected readonly session = inject(FirebaseSessionStore);
  protected readonly nickname = signal('Coleccionista');
  readonly localPackRequested = output<void>();
  readonly firebasePackOpened = output<readonly Sticker[]>();

  ngOnInit(): void {
    void this.session.initialize();
  }

  protected updateNickname(event: Event): void {
    this.nickname.set((event.target as HTMLInputElement).value);
  }

  protected async signInWithGoogle(): Promise<void> {
    await this.session.signInWithGoogle(this.nickname());
  }

  protected async signInGuest(): Promise<void> {
    await this.session.signInGuest(this.nickname());
  }

  protected async claimStarterPack(): Promise<void> {
    await this.session.claimStarterPack();
  }

  protected async openFirebasePack(): Promise<void> {
    const stickers = await this.session.openPack();
    if (stickers.length > 0) {
      this.firebasePackOpened.emit(stickers);
    }
  }

  protected openLocalPack(): void {
    this.localPackRequested.emit();
  }
}
