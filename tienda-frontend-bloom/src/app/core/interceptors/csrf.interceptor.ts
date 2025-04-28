// src/app/core/interceptors/csrf.interceptor.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Si no estamos en el navegador, pasamos la solicitud sin modificar
    if (!this.isBrowser) {
      return next.handle(request);
    }
    
    // Obtener el token CSRF de las cookies
    const token = this.getXsrfToken();
    
    // Añadir los headers necesarios solo si existe el token
    if (token) {
      console.log('Añadiendo token CSRF:', token);
      
      request = request.clone({
        withCredentials: true,
        setHeaders: {
          'X-XSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    } else {
      console.log('No se encontró token CSRF, añadiendo solo withCredentials');
      
      // Incluso sin token, asegúrate de que las credenciales (cookies) se envíen
      request = request.clone({
        withCredentials: true,
        setHeaders: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    }
    
    return next.handle(request);
  }
  
  // Método para obtener el token CSRF de las cookies
  private getXsrfToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
}