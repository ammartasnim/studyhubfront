import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

if (typeof (globalThis as any).global === 'undefined') {
  (globalThis as any).global = globalThis;
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
