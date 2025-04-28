import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Añadir token CSRF y X-Requested-With header para solicitudes modificadoras
    if (this.isModifyingRequest(request.method)) {
      const token = this.getXsrfTokenFromCookie();
      
      if (token) {
        request = request.clone({
          headers: request.headers
            .set('X-XSRF-TOKEN', token)
            .set('X-Requested-With', 'XMLHttpRequest')
        });
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si obtenemos un error 419 (CSRF token mismatch), intentar refrescar el token y reintentar
        if (error.status === 419) {
          console.log('Error CSRF 419 detectado. Refrescando token CSRF...');
          
          return this.authService.refreshCsrfToken().pipe(
            switchMap(() => {
              // Clonar la solicitud con el nuevo token CSRF
              const newToken = this.getXsrfTokenFromCookie();
              
              if (newToken) {
                const newRequest = request.clone({
                  headers: request.headers
                    .set('X-XSRF-TOKEN', newToken)
                    .set('X-Requested-With', 'XMLHttpRequest')
                });
                
                // Reintentar la solicitud
                return next.handle(newRequest);
              }
              
              return next.handle(request);
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  private isModifyingRequest(method: string | undefined): boolean {
    return method !== undefined && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  }

  // Actualiza el método en csrf.interceptor.ts
private getXsrfTokenFromCookie(): string | null {
  console.log('Todas las cookies:', document.cookie); // Para depuración
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      const decodedValue = decodeURIComponent(value);
      console.log('Token CSRF encontrado:', decodedValue);
      return decodedValue;
    }
  }
  
  console.warn('No se encontró token CSRF en las cookies');
  return null;
}
}