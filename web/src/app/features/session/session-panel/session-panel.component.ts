import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { Sticker } from '../../../core/models/album.models';
import { FirebaseSessionStore } from '../../../core/firebase/firebase-session.store';

@Component({
  selector: 'app-session-panel',
  imports: [A11yModule],
  templateUrl: './session-panel.component.html',
  styleUrl: './session-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionPanelComponent implements OnInit {
  protected readonly session = inject(FirebaseSessionStore);
  protected readonly nickname = signal('Coleccionista');
  protected readonly loginDialogOpen = signal(false);
  readonly devPackRequested = output<void>();
  readonly firebasePackOpened = output<readonly Sticker[]>();

  ngOnInit(): void {
    void this.session.initialize();
  }

  protected updateNickname(event: Event): void {
    this.nickname.set((event.target as HTMLInputElement).value);
  }

  protected async signInWithGoogle(): Promise<void> {
    await this.session.signInWithGoogle(this.nickname());
    if (this.session.isAuthenticated()) {
      this.closeLoginPrompt();
    }
  }

  protected async signInGuest(): Promise<void> {
    await this.session.signInGuest(this.nickname());
    if (this.session.isAuthenticated()) {
      this.closeLoginPrompt();
    }
  }

  protected async claimStarterPack(): Promise<void> {
    await this.session.claimStarterPack();
  }

  protected async openPack(): Promise<void> {
    if (!this.session.isAuthenticated()) {
      this.openLoginPrompt();
      return;
    }

    const stickers = await this.session.openPack();
    if (stickers.length > 0) {
      this.firebasePackOpened.emit(stickers);
    }
  }

  protected openLoginPrompt(): void {
    this.loginDialogOpen.set(true);
  }

  protected closeLoginPrompt(): void {
    this.loginDialogOpen.set(false);
  }

  protected openDevPack(): void {
    this.devPackRequested.emit();
  }
}
