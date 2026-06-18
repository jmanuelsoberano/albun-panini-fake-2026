import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AlbumChallenge } from '../../core/models/album.models';
import { FirebaseSessionStore } from '../../core/firebase/firebase-session.store';
import { AlbumStore } from '../../core/state/album-store.service';

@Component({
  selector: 'app-challenges-page',
  imports: [RouterLink],
  templateUrl: './challenges-page.component.html',
  styleUrl: './challenges-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengesPageComponent {
  protected readonly album = inject(AlbumStore);
  protected readonly session = inject(FirebaseSessionStore);

  protected actionLabel(challenge: AlbumChallenge): string {
    if (!this.session.isAuthenticated()) {
      return 'Iniciar sesión';
    }

    if (this.session.isMissionClaimed(challenge.id)) {
      return 'Reclamado';
    }

    return challenge.complete ? 'Reclamar 25 monedas' : 'En progreso';
  }

  protected canClaim(challenge: AlbumChallenge): boolean {
    return (
      this.session.isAuthenticated() &&
      challenge.complete &&
      !this.session.isMissionClaimed(challenge.id)
    );
  }

  protected claimMission(challenge: AlbumChallenge): void {
    if (!this.canClaim(challenge)) {
      return;
    }

    void this.session.claimMission(challenge.id);
  }
}
