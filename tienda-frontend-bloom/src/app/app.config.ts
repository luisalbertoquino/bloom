// src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { SettingsService } from './core/services/settings.service';
import { CsrfInterceptor } from './core/interceptors/csrf.interceptor';
import { AuthService } from './core/services/auth.service';
import { firstValueFrom, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject, InjectionToken } from '@angular/core';

// Función modificada para inicializar la app de manera segura con SSR
export function initializeAppFactory(
  settingsService: SettingsService, 
  authService: AuthService,
  platformId: Object
) {
  return () => {
    console.log('Inicializando aplicación...');
    
    // Verificar si estamos en el navegador
    const isBrowser = isPlatformBrowser(platformId);
    
    if (isBrowser) {
      // Solo inicializamos el token CSRF en el navegador
      const csrfPromise = firstValueFrom(authService.initCsrfToken())
        .catch(error => {
          console.error('Error al inicializar CSRF token:', error);
          return false; // Permitir que la app siga inicializándose
        });
      
      // También cargar configuraciones
      const settingsPromise = firstValueFrom(settingsService.getSettings())
        .catch(error => {
          console.error('Error al cargar configuraciones:', error);
          return false;
        });
      
      // Devolver una promesa que se resuelve cuando ambas operaciones se completan
      return Promise.all([csrfPromise, settingsPromise])
        .then(() => {
          console.log('Inicialización completada');
          return true;
        })
        .catch(error => {
          console.error('Error en la inicialización:', error);
          return true; // Devolver true para que la app se inicie de todos modos
        });
    } else {
      // En el servidor (SSR), evitamos operaciones que dependen del navegador
      console.log('Inicialización en SSR - omitiendo operaciones específicas del navegador');
      return Promise.resolve(true);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()), // Usar fetch para mejor rendimiento
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [SettingsService, AuthService, PLATFORM_ID],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CsrfInterceptor,
      multi: true
    }
  ]
};