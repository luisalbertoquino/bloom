// src/app/core/interceptors/csrf.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token CSRF de las cookies
    const token = this.getXsrfToken();
    
    if (token && this.isModifyingRequest(req.method)) {
      // Clonar la solicitud y agregar el token CSRF como encabezado
      req = req.clone({
        headers: req.headers
          .set('X-XSRF-TOKEN', token)
          .set('X-Requested-With', 'XMLHttpRequest')
      });
    }
    
    return next.handle(req);
  }
  
  private getXsrfToken(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
  
  private isModifyingRequest(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  }
}