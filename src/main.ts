// src/main.ts
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  console.log('Production mode enabled');
  enableProdMode();
}

// initialize firebase app here (AOT friendly)
if (environment.firebase) {
  initializeApp(environment.firebase);
  // optionally export storage globally by attaching to window for quick dev access:
  // (window as any).__FIREBASE_STORAGE = getStorage();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
