// src/app/core/services/settings.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, retry, switchMap } from 'rxjs/operators';
import { HttpBaseService } from './http-base.service';
import { CacheService } from './cache.service';
import { environment } from '../../../enviroments/enviroment';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

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
    private authService: AuthService,
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
      // Intenta la solicitud hasta 2 veces antes de fallar
      retry(1),
      tap(settings => {
        this.cacheService.set('settings', settings, 5 * 60 * 1000);
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('Error al cargar configuraciones:', error);
        this.isLoading = false;
        // Guardar la configuración predeterminada en caché para evitar futuras solicitudes fallidas
        this.cacheService.set('settings', this.fallbackSettings, 30 * 1000); // Caché temporal de 30 segundos
        return of(this.fallbackSettings);
      })
    );
  }

  // Obtener una configuración específica (no usa caché)
  getSetting(key: string): Observable<any> {
    return this.httpBase.get<any>(`${this.apiUrl}/settings/${key}`).pipe(
      retry(1),
      catchError(error => {
        console.error(`Error al cargar configuración ${key}:`, error);
        return of(null);
      })
    );
  }

  // Solo para administradores (actualiza configuración y limpia caché)
  updateSettings(settingsData: FormData): Observable<any> {
    return this.authService.refreshCsrfToken().pipe(
      switchMap(() => {
        const token = this.getTokenFromCookie('XSRF-TOKEN');
        
        const headers = new HttpHeaders({
          'X-XSRF-TOKEN': decodeURIComponent(token || ''),
          'X-Requested-With': 'XMLHttpRequest'
        });
        
        return this.http.post<any>(`${this.apiUrl}/settings`, settingsData, {
          headers: headers,
          withCredentials: true
        }).pipe(
          tap(() => {
            // Limpiar caché después de actualizar
            this.cacheService.clear('settings');
          })
        );
      }),
      catchError(error => {
        console.error('Error al actualizar configuraciones:', error);
        throw error; // Re-lanzar el error para que el componente pueda manejarlo
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

  private getTokenFromCookie(name: string): string | null {
    if (!this.isBrowser) return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  }
}