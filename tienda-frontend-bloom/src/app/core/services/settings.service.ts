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
  private cachedSettings: any = {};

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
      this.cachedSettings = cachedSettings;
      return of(cachedSettings);
    }
    
    // Si ya estamos cargando, devolvemos configuración predeterminada para evitar múltiples solicitudes
    if (this.isLoading) {
      return of(this.fallbackSettings);
    }
    
    this.isLoading = true;
    
    return this.httpBase.get<any>(`${this.apiUrl}/settings`).pipe(
      tap(settings => {
        this.cachedSettings = settings;
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

  // Método para obtener la configuración en caché
  getCachedSettings(): any {
    const cachedSettings = this.cacheService.get('settings');
    if (cachedSettings) {
      return cachedSettings;
    }
    return this.cachedSettings || this.fallbackSettings;
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
  updateSettings(formData: FormData): Observable<any> {
    // Usar httpBase directamente, como en CategoryService
    return this.httpBase.post<any>(`${this.apiUrl}/settings`, formData).pipe(
      tap(response => {
        // Actualizar caché con los nuevos valores
        const updatedSettings = {...this.getCachedSettings()};
        
        // Actualizar valores en la caché
        for (const key of [
          'site_title', 'primary_color', 'secondary_color', 'footer_text', 
          'address', 'phone', 'email', 'facebook', 'instagram', 
          'twitter', 'youtube', 'whatsapp_number'
        ]) {
          if (formData.has(key)) {
            updatedSettings[key] = formData.get(key);
          }
        }
        
        // Si el backend devuelve rutas de archivos, actualizar esos valores también
        if (response && typeof response === 'object') {
          for (const key of ['logo', 'banner_image', 'favicon']) {
            if (response[key]) {
              updatedSettings[key] = response[key];
            }
          }
        }
        
        // Guardar configuración actualizada en caché
        this.cachedSettings = updatedSettings;
        this.cacheService.set('settings', updatedSettings, 5 * 60 * 1000);
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
    if (!this.isBrowser || !faviconPath) return;
    
    try {
      // Remover favicon existente para asegurar que se actualice
      const existingLink = document.querySelector("link[rel*='icon']");
      if (existingLink) {
        existingLink.remove();
      }
      
      // Crear nuevo link con timestamp para evitar caché
      const link = document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      // Añadir timestamp para evitar caché
      link.href = `${environment.storageUrl}${faviconPath}?t=${new Date().getTime()}`;
      document.getElementsByTagName('head')[0].appendChild(link);
      
      console.log('Favicon actualizado:', link.href);
    } catch (error) {
      console.error('Error al configurar el favicon:', error);
    }
  }
}