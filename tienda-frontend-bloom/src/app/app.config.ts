// src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { SettingsService } from './core/services/settings.service';
import { AuthService } from './core/services/auth.service';
import { CookieManagerService } from './core/services/cookie-manager.service';
import { csrfInterceptor } from './core/interceptors/csrf.interceptor';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

function initializeAppFactory(): () => Promise<boolean> {
  const settingsService = inject(SettingsService);
  const authService = inject(AuthService);
  const cookieManager = inject(CookieManagerService);
  const platformId = inject(PLATFORM_ID);
  
  return () => {
    const isBrowser = isPlatformBrowser(platformId);
    
    if (!isBrowser) {
      return Promise.resolve(true);
    }

    // Limpieza inicial agresiva de cookies
    cookieManager.cleanRouteCookies(1); // Mantener solo 1 cookie de ruta
    cookieManager.cleanNonEssentialCookies();

    return firstValueFrom(authService.initCsrfToken())
      .then(() => firstValueFrom(settingsService.getSettings()))
      .then(() => true)
      .catch(() => true); // Continuar incluso si hay errores
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([csrfInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [SettingsService, AuthService, CookieManagerService, PLATFORM_ID],
      multi: true
    }
  ]
};