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
  private readonly MAX_COOKIES = 15;
  private readonly MAX_ROUTE_COOKIES = 3;
  private readonly isBrowser: boolean;
  private readonly TOKEN_KEY = 'XSRF_TOKEN';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      setInterval(() => this.checkCookieCount(), 30000);
      this.checkCookieCount();
    }
  }

  // Token handling
  getToken(): string | null {
    return this.isBrowser ? this.getTokenFromCookie() || localStorage.getItem(this.TOKEN_KEY) : null;
  }

  saveToken(token: string): void {
    if (this.isBrowser) localStorage.setItem(this.TOKEN_KEY, token);
  }

  clearToken(): void {
    if (this.isBrowser) localStorage.removeItem(this.TOKEN_KEY);
  }

  // Cookie management
  cleanRouteCookies(keepLatest: number = 0): void {
    if (!this.isBrowser) return;
    
    const routeCookies = this.getRouteCookies();
    if (routeCookies.length <= keepLatest) return;
    
    routeCookies.slice(0, routeCookies.length - keepLatest)
      .forEach(cookie => this.deleteCookie(cookie.name));
  }

  cleanAllCookies(): void {
    if (!this.isBrowser) return;
    
    const token = this.getToken();
    this.cleanNonEssentialCookies();
    if (token) this.saveToken(token);
  }

  // Helper methods
  private getTokenFromCookie(): string | null {
    try {
      const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      console.warn('Error getting CSRF token:', e);
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
    
    if (cookies.length > this.MAX_COOKIES || routeCookies.length > this.MAX_ROUTE_COOKIES) {
      this.cleanRouteCookies(this.MAX_ROUTE_COOKIES);
    }
  }

  cleanNonEssentialCookies(): void {
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name && !this.isEssentialCookie(name)) {
        this.deleteCookie(name);
      }
    });
  }

  private isEssentialCookie(name: string): boolean {
    return this.ESSENTIAL_COOKIES.includes(name) || 
           name.startsWith('laravel_') || 
           name.startsWith('bloom_');
  }

  private deleteCookie(name: string): void {
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