// src/app/core/services/settings.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, retry, delay } from 'rxjs/operators';
import { HttpBaseService } from './http-base.service';
import { CacheService } from './cache.service';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CookieManagerService } from './cookie-manager.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = environment.apiUrl;
  private isLoading = false;
  private fallbackSettings = {
    site_title: 'Sitio Web',
    primary_color: '#fc6280',
    secondary_color: '#f8a5c2',
    whatsapp_number: '+1234567890'
  };
  private isBrowser: boolean;

  constructor(
    private httpBase: HttpBaseService,
    private http: HttpClient,
    private cacheService: CacheService,
    private cookieManager: CookieManagerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Obtener todas las configuraciones (usando caché)
  getSettings(): Observable<any> {
    // Si ya está en caché, usamos eso
    const cachedSettings = this.cacheService.get('settings');
    if (cachedSettings) {
      return of(cachedSettings);
    }
    
    // Si ya estamos cargando, devolvemos configuración predeterminada para evitar múltiples solicitudes
    if (this.isLoading) {
      return of(this.fallbackSettings);
    }
    
    this.isLoading = true;
    
    return this.httpBase.get<any>(`${this.apiUrl}/settings`).pipe(
      tap(settings => {
        this.cacheService.set('settings', settings, 5 * 60 * 1000);
        this.isLoading = false;
      }),
      catchError((error) => {
        console.error('Error al cargar configuraciones:', error);
        this.isLoading = false;
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          // Limpiar cookies antes de reintentar
          this.cookieManager.cleanRouteCookies();
          console.log('Reintentando obtener configuraciones después de limpiar cookies...');
          return of(this.fallbackSettings).pipe(
            delay(800),
            retry(1)
          );
        }
        
        // Guardar la configuración predeterminada en caché para evitar futuras solicitudes fallidas
        this.cacheService.set('settings', this.fallbackSettings, 30 * 1000); // Caché temporal de 30 segundos
        return of(this.fallbackSettings);
      })
    );
  }

  // Obtener una configuración específica (no usa caché)
  getSetting(key: string): Observable<any> {
    return this.httpBase.get<any>(`${this.apiUrl}/settings/${key}`).pipe(
      catchError(error => {
        console.error(`Error al cargar configuración ${key}:`, error);
        return of(null);
      })
    );
  }

  // Solo para administradores (actualiza configuración y limpia caché)
  // IMPORTANTE: Usamos el mismo patrón que en CategoryService
  updateSettings(formData: FormData): Observable<any> {
    // Usar httpBase directamente, como en CategoryService
    return this.httpBase.post<any>(`${this.apiUrl}/settings`, formData).pipe(
      tap(() => {
        // Limpiar caché después de actualizar
        this.cacheService.clear('settings');
      }),
      catchError(error => {
        console.error('Error al actualizar configuraciones:', error);
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          // Limpiar cookies antes de reintentar
          this.cookieManager.cleanRouteCookies(3); // Limpieza agresiva
          console.log('Error de sesión. Limpiando cookies y lanzando error...');
        }
        
        return throwError(() => error);
      })
    );
  }

  // Configurar el favicon del sitio
  setFavicon(faviconPath: string): void {
    // Verificar si estamos en un navegador y existe una ruta de favicon
    if (!this.isBrowser || !faviconPath) return;
    
    try {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = `${environment.storageUrl}${faviconPath}`;
      document.getElementsByTagName('head')[0].appendChild(link);
    } catch (error) {
      console.error('Error al configurar el favicon:', error);
    }
  }
}