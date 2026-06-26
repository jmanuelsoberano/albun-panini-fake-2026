import { Injectable } from '@angular/core';
import type { FirebaseOptions } from 'firebase/app';
import type { FirebaseRuntimeConfig } from './firebase.models';

interface FirebaseConfigModule {
  readonly firebaseConfig?: FirebaseOptions;
  readonly USE_FIREBASE_EMULATORS?: boolean;
  readonly USE_CLOUD_FUNCTIONS?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FirebaseConfigService {
  private configPromise?: Promise<FirebaseRuntimeConfig | null>;

  async loadConfig(): Promise<FirebaseRuntimeConfig | null> {
    this.configPromise ??= this.importConfig();
    return this.configPromise;
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(await this.loadConfig());
  }

  async canUseGuestSignIn(): Promise<boolean> {
    const config = await this.loadConfig();
    return Boolean(config?.useEmulators && this.isLocalHost());
  }

  async shouldUseCloudFunctions(): Promise<boolean> {
    const config = await this.loadConfig();
    return Boolean(config?.useCloudFunctions);
  }

  private async importConfig(): Promise<FirebaseRuntimeConfig | null> {
    if (typeof location === 'undefined') {
      return null;
    }

    return (await this.importLocalConfig()) ?? (await this.fetchHostingConfig());
  }

  private async importLocalConfig(): Promise<FirebaseRuntimeConfig | null> {
    try {
      const configUrl = new URL('/firebase-config.js', location.origin);
      const head = await fetch(configUrl, { method: 'HEAD' });
      const contentType = head.headers.get('content-type') ?? '';
      if (!head.ok || !contentType.includes('javascript')) {
        return null;
      }

      const moduleUrl = `${configUrl.href}?v=${Date.now()}`;
      const configModule = (await import(/* @vite-ignore */ moduleUrl)) as FirebaseConfigModule;
      if (this.hasPlaceholderConfig(configModule.firebaseConfig)) {
        return null;
      }

      return {
        firebaseConfig: configModule.firebaseConfig,
        useEmulators: Boolean(configModule.USE_FIREBASE_EMULATORS),
        useCloudFunctions: Boolean(configModule.USE_CLOUD_FUNCTIONS),
      };
    } catch {
      return null;
    }
  }

  private async fetchHostingConfig(): Promise<FirebaseRuntimeConfig | null> {
    return this.fetchHostingConfigFrom(new URL('/__/firebase/init.json', location.origin).href);
  }

  private async fetchHostingConfigFrom(url: string): Promise<FirebaseRuntimeConfig | null> {
    try {
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || !contentType.includes('json')) {
        return null;
      }

      const body = await response.text();
      if (!body.trim()) {
        return null;
      }

      const firebaseConfig = JSON.parse(body) as FirebaseOptions;
      if (this.hasPlaceholderConfig(firebaseConfig)) {
        return null;
      }

      return {
        firebaseConfig,
        useEmulators: false,
        useCloudFunctions: false,
      };
    } catch {
      return null;
    }
  }

  private hasPlaceholderConfig(config: FirebaseOptions | undefined): config is undefined {
    if (!config) {
      return true;
    }

    return (['apiKey', 'authDomain', 'projectId', 'appId'] as const).some((key) => {
      const value = config[key];
      return !value || String(value).startsWith('TU_');
    });
  }

  private isLocalHost(): boolean {
    const hostname = location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  }
}
