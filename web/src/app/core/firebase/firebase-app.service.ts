import { inject, Injectable } from '@angular/core';
import type { FirebaseServices } from './firebase.models';
import { FirebaseConfigService } from './firebase-config.service';

@Injectable({ providedIn: 'root' })
export class FirebaseAppService {
  private readonly configService = inject(FirebaseConfigService);
  private servicesPromise?: Promise<FirebaseServices | null>;

  async getServices(): Promise<FirebaseServices | null> {
    this.servicesPromise ??= this.initializeServices();
    return this.servicesPromise;
  }

  private async initializeServices(): Promise<FirebaseServices | null> {
    const config = await this.configService.loadConfig();
    if (!config) {
      return null;
    }

    const [appApi, authApi, firestoreApi, functionsApi] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
      import('firebase/functions'),
    ]);

    const app =
      appApi.getApps().length > 0
        ? appApi.getApps()[0]
        : appApi.initializeApp(config.firebaseConfig);
    const auth = authApi.getAuth(app);
    const db = firestoreApi.getFirestore(app);
    const functions = functionsApi.getFunctions(app);

    if (config.useEmulators) {
      authApi.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      firestoreApi.connectFirestoreEmulator(db, '127.0.0.1', 8080);
      functionsApi.connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    }

    return { app, auth, db, functions };
  }
}
