import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Configuration } from './api/generated/configuration';
import { CustomConfiguration } from './api/custom-configuration';

import { authTokenInterceptor } from './auth-token.interceptor';
import { responseHandlerInterceptor } from './response-handler.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        responseHandlerInterceptor,
        authTokenInterceptor
      ])
    ),
    {
      provide: Configuration,
      useValue: new CustomConfiguration({
        basePath: 'http://localhost:8081'
      })
    }
  ]
};
