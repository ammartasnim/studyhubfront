import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Configuration } from './api/configuration';
import { CustomConfiguration } from './api/custom-configuration';

import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
// import { responseHandlerInterceptor } from './core/interceptors/response-handler.interceptor';
import { routes } from './app.routes';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        // responseHandlerInterceptor,
        authTokenInterceptor
      ])
    ),
    provideCharts(withDefaultRegisterables()),
    {
      provide: Configuration,
      useValue: new CustomConfiguration({
        basePath: 'http://localhost:8081'
      })
    }
  ]
};
