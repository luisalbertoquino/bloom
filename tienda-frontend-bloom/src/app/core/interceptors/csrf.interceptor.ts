// src/app/core/interceptors/csrf.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { throwError, of, Observable, timer } from 'rxjs';
import { CookieManagerService } from '../services/cookie-manager.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

// Variable estática para controlar número de reintentos globales
let globalRetryCount = 0;
const MAX_GLOBAL_RETRIES = 3;

export const csrfInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const cookieManager = inject(CookieManagerService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Reset contador global después de un tiempo sin errores (5 minutos)
  if (globalRetryCount > 0) {
    setTimeout(() => {
      globalRetryCount = 0;
    }, 5 * 60 * 1000);
  }

  // Excepciones para solicitudes que no requieren CSRF
  if (!isBrowser || !req.url.includes(environment.apiUrl)) {
    return next(req);
  }

  // Obtener token CSRF de múltiples fuentes
  let token = null;
  if (isBrowser) {
    // Primero intentar de cookie
    token = cookieManager.getToken();
    
    // Si no hay token en cookie, intentar desde localStorage
    if (!token && localStorage.getItem('XSRF_TOKEN')) {
      token = localStorage.getItem('XSRF_TOKEN');
      console.log('Usando token CSRF desde localStorage');
      
      // Restaurar a cookie si es posible
      try {
        const expiresDate = new Date();
        expiresDate.setTime(expiresDate.getTime() + 8 * 60 * 60 * 1000);
        document.cookie = `XSRF-TOKEN=${token}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Lax`;
      } catch (e) {
        console.error('Error al restaurar token a cookie:', e);
      }
    }
  }

  // Añadir datos de autenticación
  let headers = req.headers
    .set('X-Requested-With', 'XMLHttpRequest')
    .set('Accept', 'application/json');

  // Añadir token CSRF si existe
  if (token) {
    headers = headers.set('X-XSRF-TOKEN', token);
  }

  // Añadir token de autorización si existe
  const authToken = localStorage.getItem('access_token');
  if (authToken) {
    headers = headers.set('Authorization', `Bearer ${authToken}`);
  }

  const clonedReq = req.clone({
    withCredentials: true,
    headers: headers
  });

  return next(clonedReq).pipe(
    tap(() => {
      // Reiniciar contador si la solicitud es exitosa
      if (req.method !== 'GET') {
        globalRetryCount = 0;
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (!isBrowser) return throwError(() => error);

      // Verificar si hemos alcanzado el límite global de reintentos
      if (globalRetryCount >= MAX_GLOBAL_RETRIES) {
        console.warn('Demasiados reintentos globales. Posible problema de sesión.');
        
        // Emitir evento de sesión expirada
        const expiredEvent = new CustomEvent('session-expired', {
          detail: { 
            message: 'Se ha detectado un problema con tu sesión. Por favor, vuelve a iniciar sesión.',
            status: error.status 
          }
        });
        window.dispatchEvent(expiredEvent);
        
        // Reiniciar contador global
        globalRetryCount = 0;
        
        return throwError(() => error);
      }

      // Para errores de autenticación, intentar renovar la sesión
      if (error.status === 401) {
        console.warn('Error de autenticación 401 - Intentando renovar sesión...');
        globalRetryCount++;
        
        // Emitir evento de advertencia
        const warningEvent = new CustomEvent('auth-warning', {
          detail: { 
            message: `Verificando tu sesión... (Intento ${globalRetryCount}/${MAX_GLOBAL_RETRIES})`, 
            status: error.status 
          }
        });
        window.dispatchEvent(warningEvent);
        
        // Intentar renovar el token antes de rendirse
        return authService.refreshCsrfToken().pipe(
          switchMap(() => {
            // Intentar obtener el usuario actual
            return authService.getCurrentUser().pipe(
              switchMap(() => {
                // La sesión sigue activa, reintentar la solicitud original con un token fresco
                console.log('Sesión renovada, reintentando solicitud...');
                
                // Obtener token fresco
                const freshToken = cookieManager.getToken();
                
                // Crear una nueva solicitud con el token actualizado
                const retryReq = req.clone({
                  withCredentials: true,
                  headers: req.headers
                    .set('X-Requested-With', 'XMLHttpRequest')
                    .set('Accept', 'application/json')
                    .set('X-XSRF-TOKEN', freshToken || '')
                    .set('Authorization', `Bearer ${localStorage.getItem('access_token') || ''}`)
                    .set('Cache-Control', 'no-cache, no-store, must-revalidate')
                    .set('Pragma', 'no-cache')
                });
                
                // Pequeño retraso antes de reintentar
                return timer(500).pipe(
                  switchMap(() => next(retryReq))
                );
              }),
              catchError(userError => {
                // No se pudo obtener el usuario, ahora sí reportar error de sesión
                console.error('No se pudo renovar la sesión:', userError);
                
                // Emitir evento de sesión expirada
                const expiredEvent = new CustomEvent('session-expired', {
                  detail: { 
                    message: 'Tu sesión ha expirado, por favor vuelve a iniciar sesión.',
                    status: error.status 
                  }
                });
                window.dispatchEvent(expiredEvent);
                
                return throwError(() => userError);
              })
            );
          }),
          catchError(refreshError => {
            console.error('Error al renovar token CSRF:', refreshError);
            
            // Emitir evento de sesión expirada
            const expiredEvent = new CustomEvent('session-expired', {
              detail: { 
                message: 'No se pudo renovar tu sesión, por favor vuelve a iniciar sesión.',
                status: error.status 
              }
            });
            window.dispatchEvent(expiredEvent);
            
            return throwError(() => refreshError);
          })
        );
      }
      
      // Para errores CSRF (419) o Headers too large (431)
      if (error.status === 419 || error.status === 431) {
        console.warn(`Error ${error.status} detectado. Renovando token CSRF...`);
        globalRetryCount++;
        
        // Emitir evento de advertencia
        const warningEvent = new CustomEvent('auth-warning', {
          detail: { 
            message: `Renovando credenciales de seguridad... (Intento ${globalRetryCount}/${MAX_GLOBAL_RETRIES})`, 
            status: error.status 
          }
        });
        window.dispatchEvent(warningEvent);
        
        // Limpiar cookies no esenciales si es error 431
        if (error.status === 431) {
          cookieManager.cleanNonEssentialCookies();
        }
        
        // Renovar token CSRF
        return authService.refreshCsrfToken().pipe(
          switchMap(() => {
            // Obtener token actualizado
            const freshToken = cookieManager.getToken();
            console.log('Token renovado:', freshToken ? 'OK' : 'Fallo');
            
            // Solo reintentar para solicitudes que modifican datos
            if (!['GET'].includes(req.method)) {
              const retryReq = req.clone({
                withCredentials: true,
                headers: req.headers
                  .set('X-Requested-With', 'XMLHttpRequest')
                  .set('Accept', 'application/json')
                  .set('X-XSRF-TOKEN', freshToken || '')
                  .set('Authorization', `Bearer ${localStorage.getItem('access_token') || ''}`)
                  .set('Cache-Control', 'no-cache, no-store, must-revalidate')
                  .set('Pragma', 'no-cache')
              });
              
              return timer(500).pipe(
                switchMap(() => next(retryReq))
              );
            }
            
            return throwError(() => error);
          }),
          catchError(retryError => {
            console.error('Error en reintento de token:', retryError);
            
            // Emitir evento de CSRF error para posibles reintentos adicionales
            const csrfEvent = new CustomEvent('csrf-error', {
              detail: { 
                message: 'Error de seguridad. Intentando solucionar...',
                status: retryError.status,
                originalUrl: req.url,
                method: req.method
              }
            });
            window.dispatchEvent(csrfEvent);
            
            // Delay para permitir que se muestre el mensaje
            return timer(1000).pipe(
              switchMap(() => throwError(() => retryError))
            );
          })
        );
      }

      return throwError(() => error);
    })
  );
};