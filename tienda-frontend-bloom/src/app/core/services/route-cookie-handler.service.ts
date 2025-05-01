// src/app/core/services/route-cookie-handler.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RouteCookieHandlerService {
  private readonly isBrowser: boolean;
  private readonly ROUTE_COOKIE_NAME = 'c'; // Nombre de la cookie que se crea al navegar
  private readonly MAX_COOKIES = 10;
  private lastCleanupTime = 0;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      // Escuchar eventos de navegación para manejar cookies
      this.setupRouteListener();
      
      // Limpiar cookies al inicio
      this.cleanRouteCookies();
    }
  }

  private setupRouteListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const now = Date.now();
      
      // Limitar frecuencia de limpieza a máximo una vez cada 5 segundos
      if (now - this.lastCleanupTime > 5000) {
        this.cleanRouteCookies();
        this.lastCleanupTime = now;
      }
    });
  }

  /**
   * Limpia las cookies de ruta ('c') que se crean al navegar entre páginas
   * Mantiene sólo las más recientes hasta el límite establecido
   */
  public cleanRouteCookies(): void {
    if (!this.isBrowser || typeof document === 'undefined') return;
    
    try {
      // Identificar todas las cookies 'c'
      const cookies = document.cookie.split(';');
      const routeCookies: {name: string, value: string, path: string}[] = [];
      
      cookies.forEach(cookie => {
        const parts = cookie.trim().split('=');
        if (parts.length > 1) {
          const name = parts[0].trim();
          
          // Buscar cookies 'c' y variantes con prefijo
          if (name === this.ROUTE_COOKIE_NAME || name.startsWith(`${this.ROUTE_COOKIE_NAME}_`)) {
            // Extraer el path de la cookie (si está disponible)
            let path = '/';
            const cookieMetadata = parts[1].split(';');
            for (const metadata of cookieMetadata) {
              if (metadata.trim().toLowerCase().startsWith('path=')) {
                path = metadata.trim().substring(5);
                break;
              }
            }
            
            routeCookies.push({
              name,
              value: parts[1],
              path
            });
          }
        }
      });
      
      // Si hay más cookies de ruta que el máximo permitido, eliminar las más antiguas
      if (routeCookies.length > this.MAX_COOKIES) {
        console.log(`Detectadas ${routeCookies.length} cookies de ruta, eliminando las más antiguas`);
        
        // Ordenar por antigüedad (asumiendo que las más antiguas tienen valores más pequeños)
        routeCookies.sort((a, b) => a.value.localeCompare(b.value));
        
        // Eliminar las cookies más antiguas, dejando sólo MAX_COOKIES
        const cookiesToRemove = routeCookies.slice(0, routeCookies.length - this.MAX_COOKIES);
        
        cookiesToRemove.forEach(cookie => {
          this.deleteCookie(cookie.name, cookie.path);
        });
        
        console.log(`Se eliminaron ${cookiesToRemove.length} cookies de ruta`);
      }
    } catch (e) {
      console.error('Error al limpiar cookies de ruta:', e);
    }
  }

  /**
   * Elimina una cookie específica
   */
  private deleteCookie(name: string, path: string = '/'): void {
    if (!this.isBrowser || typeof document === 'undefined') return;
    
    const domains = ['localhost', window.location.hostname];
    
    // Intentar eliminar con todas las combinaciones posibles
    domains.forEach(domain => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
    });
    
    // También intentar sin dominio específico
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
  }
}