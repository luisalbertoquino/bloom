// src/app/core/services/token.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { delay, tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly isBrowser: boolean;
  private csrfTokenInitialized = false;
  private tokenRefreshInProgress = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Método para obtener token de cookie
  getXsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const parts = cookie.trim().split('=');
        if (parts.length > 1 && parts[0] === 'XSRF-TOKEN') {
          return decodeURIComponent(parts[1]);
        }
      }
    } catch (e) {
      console.error('Error al extraer token CSRF:', e);
    }
    
    return null;
  }

  // Método para renovar token CSRF
  refreshCsrfToken(): Observable<any> {
    if (this.tokenRefreshInProgress) {
      return of(false);
    }
    
    this.tokenRefreshInProgress = true;
    
    const csrfUrl = environment.baseUrl.startsWith('http') 
      ? `${environment.baseUrl}/sanctum/csrf-cookie`
      : `${window.location.origin}${environment.baseUrl}/sanctum/csrf-cookie`;
    
    return this.http.get(csrfUrl, {
      withCredentials: true,
      headers: new HttpHeaders({
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      })
    }).pipe(
      delay(500),
      tap(() => {
        this.tokenRefreshInProgress = false;
        this.csrfTokenInitialized = true;
        
        if (this.isBrowser) {
          const token = this.getXsrfTokenFromCookie();
          console.log('CSRF token obtenido:', token ? token.substring(0, 10) + '...' : 'No disponible');
          
          if (token) {
            localStorage.setItem('XSRF_TOKEN', token);
          }
        }
      }),
      catchError(error => {
        this.tokenRefreshInProgress = false;
        this.csrfTokenInitialized = false;
        console.error('Error al inicializar token CSRF:', error);
        return of(false);
      })
    );
  }

  // Método para obtener token desde múltiples fuentes
  getToken(): string | null {
    if (!this.isBrowser) return null;
    
    // Primero intentar de cookie
    const cookieToken = this.getXsrfTokenFromCookie();
    
    // Si no hay token en cookie, intentar desde localStorage
    if (!cookieToken && this.isBrowser) {
      const localToken = localStorage.getItem('XSRF_TOKEN');
      if (localToken) {
        console.log('Usando token CSRF desde localStorage');
        
        // Restaurar a cookie si es posible
        try {
          const expiresDate = new Date();
          expiresDate.setTime(expiresDate.getTime() + 8 * 60 * 60 * 1000);
          document.cookie = `XSRF-TOKEN=${localToken}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Lax`;
          return localToken;
        } catch (e) {
          console.error('Error al restaurar token a cookie:', e);
        }
      }
    }
    
    return cookieToken;
  }
}