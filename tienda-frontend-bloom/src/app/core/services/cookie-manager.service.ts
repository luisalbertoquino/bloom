// Mejoras en CookieManagerService
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CookieManagerService {
  private readonly ESSENTIAL_COOKIES = [
    'XSRF-TOKEN', 
    'laravel_session',
    'bloom_session',
    'access_token'
  ];
  private readonly MAX_COOKIES = 20; // Aumentar el límite
  private readonly MAX_ROUTE_COOKIES = 5; // Aumentar el límite
  private readonly isBrowser: boolean;
  private readonly TOKEN_KEY = 'XSRF_TOKEN';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      // Reducir la frecuencia de limpieza
      setInterval(() => this.checkCookieCount(), 60000);
      this.checkCookieCount();
    }
  }

  // Token handling
  getToken(): string | null {
    if (!this.isBrowser) return null;
    
    // Priorizar la cookie, pero usar localStorage como respaldo
    const cookieToken = this.getTokenFromCookie();
    const localToken = localStorage.getItem(this.TOKEN_KEY);
    
    // Si tenemos token en cookie, actualizamos localStorage
    if (cookieToken && cookieToken.length > 20) {
      localStorage.setItem(this.TOKEN_KEY, cookieToken);
      return cookieToken;
    }
    
    // Si tenemos token en localStorage pero no en cookie, intentar restaurar
    if (localToken && localToken.length > 20 && !cookieToken) {
      console.log('Restaurando token CSRF desde localStorage');
      document.cookie = `XSRF-TOKEN=${localToken}; path=/; max-age=7200`;
      return localToken;
    }
    
    return cookieToken || localToken;
  }

  saveToken(token: string): void {
    if (this.isBrowser && token) localStorage.setItem(this.TOKEN_KEY, token);
  }

  clearToken(): void {
    if (this.isBrowser) localStorage.removeItem(this.TOKEN_KEY);
  }

  // Cookie management
  cleanRouteCookies(keepLatest: number = 0): void {
    if (!this.isBrowser) return;
    
    // Identificar solo cookies de ruta específicas
    const routeCookies = this.getRouteCookies();
    
    // Ser menos agresivo, solo eliminar si hay muchas
    if (routeCookies.length <= Math.max(keepLatest, 5)) return;
    
    // Preservar las cookies más recientes
    routeCookies.slice(0, routeCookies.length - keepLatest)
      .forEach(cookie => {
        // No eliminar cookies esenciales
        if (!this.isEssentialCookie(cookie.name)) {
          this.deleteCookie(cookie.name);
        }
      });
  }

  cleanAllCookies(): void {
    if (!this.isBrowser) return;
    
    const token = this.getToken();
    this.cleanNonEssentialCookies();
    if (token) this.saveToken(token);
  }

  // Helper methods - mejorado
  private getTokenFromCookie(): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const parts = cookie.trim().split('=');
        if (parts.length > 1 && parts[0] === 'XSRF-TOKEN') {
          return decodeURIComponent(parts[1]);
        }
      }
      return null;
    } catch (e) {
      console.warn('Error al obtener token CSRF de cookie:', e);
      return null;
    }
  }

  private getRouteCookies(): {name: string, value: string}[] {
    return document.cookie.split(';')
      .map(c => c.trim().split('='))
      .filter(([name]) => name && (name === 'c' || name.startsWith('c_')))
      .map(([name, ...value]) => ({name, value: value.join('=')}));
  }

  private checkCookieCount(): void {
    if (!this.isBrowser) return;
    
    const cookies = document.cookie.split(';').filter(c => c.trim());
    const routeCookies = this.getRouteCookies();
    
    // Solo limpiar si superamos ampliamente los límites
    if (cookies.length > this.MAX_COOKIES + 5 || 
        routeCookies.length > this.MAX_ROUTE_COOKIES + 2) {
      console.log('Limpiando cookies excesivas:', cookies.length);
      this.cleanRouteCookies(this.MAX_ROUTE_COOKIES);
    }
  }

  cleanNonEssentialCookies(): void {
    const allCookies = document.cookie.split(';');
    
    // Salvaguardar tokens importantes
    const xsrfToken = this.getTokenFromCookie();
    
    allCookies.forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name && !this.isEssentialCookie(name)) {
        this.deleteCookie(name);
      }
    });
    
    // Restaurar tokens importantes
    if (xsrfToken) this.saveToken(xsrfToken);
  }

  private isEssentialCookie(name: string): boolean {
    return this.ESSENTIAL_COOKIES.includes(name) || 
           name.startsWith('laravel_') || 
           name.startsWith('bloom_') ||
           name === 'XSRF-TOKEN';
  }

  private deleteCookie(name: string): void {
    // Evitar borrar cookies esenciales
    if (this.isEssentialCookie(name)) return;
    
    const domains = [window.location.hostname, 'localhost'];
    const paths = ['/', '/admin', '/api'];
    
    domains.forEach(domain => {
      paths.forEach(path => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
      });
    });
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}