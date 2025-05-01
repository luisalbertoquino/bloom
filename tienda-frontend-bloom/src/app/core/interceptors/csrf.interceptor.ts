// src/app/core/interceptors/csrf.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { throwError, of, Observable, timer } from 'rxjs';
import { CookieManagerService } from '../services/cookie-manager.service';

export const csrfInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const cookieManager = inject(CookieManagerService);

  // Excepciones para solicitudes que no requieren CSRF
  if (!isBrowser || !req.url.includes(environment.apiUrl)) {
    return next(req);
  }

  // Limpieza preventiva de cookies solo para solicitudes POST/PUT/PATCH/DELETE
  if (isBrowser && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    cookieManager.cleanRouteCookies(1);
  }

  // Obtener token CSRF
  const token = isBrowser ? cookieManager.getToken() : null;

  // Clonar la solicitud con el token
  const clonedReq = req.clone({
    withCredentials: true,
    headers: req.headers
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Accept', 'application/json')
      .set('X-XSRF-TOKEN', token || '')
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isBrowser) return throwError(() => error);

      if (error.status === 419 || error.status === 431) {
        console.warn(`Error ${error.status} detectado. Limpiando cookies...`);
        cookieManager.cleanAllCookies();
        
        // Solo reintentar para solicitudes no-GET
        if (req.method !== 'GET') {
          return timer(300).pipe(
            switchMap(() => {
              const retryReq = clonedReq.clone();
              return next(retryReq);
            }),
            catchError(retryError => {
              console.error('Error en reintento:', retryError);
              if (retryError.status === 419 || retryError.status === 431) {
                window.location.href = '/login?session_expired=1';
              }
              return throwError(() => retryError);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};