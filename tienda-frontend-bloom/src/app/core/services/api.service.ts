// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CookieManagerService } from './cookie-manager.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private cookieManager: CookieManagerService
  ) {}

  // Método genérico para preparar headers con token CSRF
  private prepareHeaders(): HttpHeaders {
    const token = this.cookieManager.getToken();
    
    return new HttpHeaders({
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      ...(token ? { 'X-XSRF-TOKEN': token } : {})
    });
  }

  // Manejador de errores genérico
  private handleError<T>(operation: string, endpoint: string, result: T = {} as T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`Error in ${operation} request to ${endpoint}:`, error);
      
      // Si el error es 431 (Headers demasiado grandes), limpiar cookies y reintentar
      if (error.status === 431) {
        console.warn('Error 431: Headers demasiado grandes - Limpiando cookies');
        this.cookieManager.cleanNonEssentialCookies();
        
        // Retornar un error que pueda ser capturado por el caller
        return throwError(() => ({
          status: error.status,
          message: 'Error de conexión. Se limpiaron las cookies, por favor intenta nuevamente.'
        }));
      }
      
      // Otros errores
      return throwError(() => error);
    };
  }

  // Método para peticiones GET
  get<T>(endpoint: string, options = {}): Observable<T> {
    console.log(`Making GET request to: ${this.apiUrl}/${endpoint}`);

    // Limpiar proactivamente cookies no esenciales antes de peticiones
    this.cookieManager.checkCookieCount();

    const headers = this.prepareHeaders();
    const requestOptions = {
      headers,
      withCredentials: true,
      ...options
    };
    
    // Detección robusta de entorno de servidor
    const isServer = typeof window === 'undefined' || 
                     (typeof process !== 'undefined' && process.versions && process.versions.node);
    
    // Si estamos en el servidor durante SSR, devuelve datos de prueba
    if (isServer) {
      console.log('Server environment detected, returning mock data');
      return of({} as T);
    }
    
    // En navegador, haz la petición real
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, requestOptions)
      .pipe(
        catchError(this.handleError<T>('GET', endpoint)),
        retry({
          count: 1,
          delay: (error) => {
            // Solo reintentar para ciertos errores específicos
            if (error.status === 431) {
              return of(true); // Reintentar una vez
            }
            return throwError(() => error); // No reintentar para otros errores
          }
        }),
        catchError(error => {
          console.error(`Error after retry in GET request to ${endpoint}:`, error);
          return of({} as T);
        })
      );
  }

  // Método para peticiones POST
  post<T>(endpoint: string, data: any, options = {}): Observable<T> {
    // Limpiar proactivamente cookies no esenciales antes de peticiones
    this.cookieManager.checkCookieCount();
    
    const headers = this.prepareHeaders();
    const requestOptions = {
      headers,
      withCredentials: true,
      ...options
    };
    
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data, requestOptions)
      .pipe(
        catchError(this.handleError<T>('POST', endpoint)),
        retry({
          count: 1,
          delay: (error) => {
            if (error.status === 431) {
              return of(true);
            }
            return throwError(() => error);
          }
        }),
        catchError(error => throwError(() => error))
      );
  }

  // Método para peticiones PUT
  put<T>(endpoint: string, data: any, options = {}): Observable<T> {
    // Limpiar proactivamente cookies no esenciales antes de peticiones
    this.cookieManager.checkCookieCount();
    
    const headers = this.prepareHeaders();
    const requestOptions = {
      headers,
      withCredentials: true,
      ...options
    };
    
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data, requestOptions)
      .pipe(
        catchError(this.handleError<T>('PUT', endpoint)),
        retry({
          count: 1,
          delay: (error) => {
            if (error.status === 431) {
              return of(true);
            }
            return throwError(() => error);
          }
        }),
        catchError(error => throwError(() => error))
      );
  }

  // Método para peticiones DELETE
  delete<T>(endpoint: string, options = {}): Observable<T> {
    // Limpiar proactivamente cookies no esenciales antes de peticiones
    this.cookieManager.checkCookieCount();
    
    const headers = this.prepareHeaders();
    const requestOptions = {
      headers,
      withCredentials: true,
      ...options
    };
    
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, requestOptions)
      .pipe(
        catchError(this.handleError<T>('DELETE', endpoint)),
        retry({
          count: 1,
          delay: (error) => {
            if (error.status === 431) {
              return of(true);
            }
            return throwError(() => error);
          }
        }),
        catchError(error => throwError(() => error))
      );
  }

  // Método para peticiones PATCH
  patch<T>(endpoint: string, data: any, options = {}): Observable<T> {
    // Limpiar proactivamente cookies no esenciales antes de peticiones
    this.cookieManager.checkCookieCount();
    
    const headers = this.prepareHeaders();
    const requestOptions = {
      headers,
      withCredentials: true,
      ...options
    };
    
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, data, requestOptions)
      .pipe(
        catchError(this.handleError<T>('PATCH', endpoint)),
        retry({
          count: 1,
          delay: (error) => {
            if (error.status === 431) {
              return of(true);
            }
            return throwError(() => error);
          }
        }),
        catchError(error => throwError(() => error))
      );
  }
}