import { inject, Injectable } from '@angular/core';
import type { Unsubscribe, User } from 'firebase/auth';
import { FirebaseAppService } from './firebase-app.service';
import { FirebaseConfigService } from './firebase-config.service';
import { UserProfileService } from './user-profile.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebaseApp = inject(FirebaseAppService);
  private readonly config = inject(FirebaseConfigService);
  private readonly profiles = inject(UserProfileService);

  async listenToSession(callback: (user: User | null) => void): Promise<Unsubscribe> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      callback(null);
      return () => undefined;
    }

    const auth = await import('firebase/auth');
    return auth.onAuthStateChanged(services.auth, callback);
  }

  async signInWithGoogle(nickname: string): Promise<User> {
    const services = await this.firebaseApp.getServices();
    if (!services) {
      throw new Error('Firebase no esta configurado.');
    }

    const auth = await import('firebase/auth');
    const provider = new auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await auth.signInWithPopup(services.auth, provider);
    await this.profiles.upsertUserProfile(credential.user, nickname);
    return credential.user;
  }

  async signInGuest(nickname: string): Promise<User> {
    if (!(await this.config.canUseGuestSignIn())) {
      throw new Error(
        'El acceso invitado solo esta disponible en desarrollo local con emuladores.',
      );
    }

    const services = await this.firebaseApp.getServices();
    if (!services) {
      throw new Error('Firebase no esta configurado.');
    }

    const auth = await import('firebase/auth');
    const credential = await auth.signInAnonymously(services.auth);
    const safeNickname = await this.profiles.upsertUserProfile(credential.user, nickname);
    await auth.updateProfile(credential.user, { displayName: safeNickname });
    return credential.user;
  }
}
