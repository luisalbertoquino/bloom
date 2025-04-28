import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { SettingsService } from './core/services/settings.service';
import { CsrfInterceptor } from './core/interceptors/csrf.interceptor';
import { AuthService } from './core/services/auth.service';
import { firstValueFrom } from 'rxjs';

// Función para cargar la configuración antes de inicializar la app
export function initializeAppFactory(settingsService: SettingsService, authService: AuthService) {
  return () => {
    // Inicializar el token CSRF si el usuario está autenticado
    if (authService.isAuthenticated) {
      authService.initCsrfToken().subscribe();
    }
    
    return firstValueFrom(settingsService.getSettings());
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [SettingsService, AuthService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CsrfInterceptor,
      multi: true
    }
  ]
};