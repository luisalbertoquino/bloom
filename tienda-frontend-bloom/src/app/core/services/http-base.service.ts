// src/app/core/services/http-base.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, retry, timeout, delay, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { CookieManagerService } from './cookie-manager.service';


interface HttpOptions {
  headers?: HttpHeaders | {[header: string]: string | string[]};
  context?: HttpContext;
  params?: HttpParams | {[param: string]: string | number | boolean | readonly (string | number | boolean)[]};
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
  retryCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HttpBaseService {
  private readonly apiUrl = environment.apiUrl;
  private readonly isBrowser: boolean;
  private readonly defaultTimeout = 15000;
  private readonly maxRetries = 2;
  
  constructor(
    private http: HttpClient,
    private cookieManager: CookieManagerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  private getFullUrl(url: string): string {
    return url.startsWith('http') ? url : `${this.apiUrl}${url}`;
  }

  private prepareOptions(options: HttpOptions = {}): HttpOptions {
    const defaultOptions: HttpOptions = {
      headers: new HttpHeaders({
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      }),
      withCredentials: true,
      responseType: 'json'
    };

    return {
      ...defaultOptions,
      ...options,
      headers: this.mergeHeaders(defaultOptions.headers, options.headers)
    };
  }

  private mergeHeaders(defaultHeaders: any, customHeaders?: any): HttpHeaders {
    let headers = new HttpHeaders();

    if (defaultHeaders instanceof HttpHeaders) {
      defaultHeaders.keys().forEach(key => {
        headers = headers.set(key, defaultHeaders.get(key)!);
      });
    } else if (typeof defaultHeaders === 'object') {
      Object.entries(defaultHeaders).forEach(([key, value]) => {
        headers = headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
      });
    }

    if (customHeaders instanceof HttpHeaders) {
      customHeaders.keys().forEach(key => {
        headers = headers.set(key, customHeaders.get(key)!);
      });
    } else if (typeof customHeaders === 'object') {
      Object.entries(customHeaders).forEach(([key, value]) => {
        headers = headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
      });
    }

    return headers;
  }

  private handleError<T>(error: HttpErrorResponse, url: string): Observable<T> {
    if (this.isBrowser) {
      if (error.status === 419 || error.status === 431) {
        console.warn('CSRF Token inválido o headers demasiado grandes. Limpiando cookies...');
        this.cookieManager.cleanAllCookies();
        window.location.reload();
        return of({} as T);
      }
    }

    console.error(`Error en la solicitud a ${url}:`, error);
    return throwError(() => error);
  }

  private withRetry<T>(source$: Observable<T>, retryCount: number = this.maxRetries): Observable<T> {
    return source$.pipe(
      retry({
        count: retryCount,
        delay: (error, retryCount) => {
          console.log(`Reintento ${retryCount} después de error:`, error);
          return timer(Math.min(1000 * retryCount, 5000));
        }
      })
    );
  }

  get<T>(url: string, options: HttpOptions = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const requestOptions = this.prepareOptions(options);

    if (!this.isBrowser) {
      return of({} as T);
    }

    return this.withRetry(
      this.http.get<T>(fullUrl, requestOptions).pipe(
        timeout(this.defaultTimeout),
        catchError(error => this.handleError<T>(error, fullUrl))
      ),
      options.retryCount
    );
  }

  post<T>(url: string, body: any = null, options: HttpOptions = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const requestOptions = this.prepareOptions(options);

    if (!this.isBrowser) {
      return of({} as T);
    }

    return this.withRetry(
      this.http.post<T>(fullUrl, body, requestOptions).pipe(
        timeout(this.defaultTimeout),
        catchError(error => this.handleError<T>(error, fullUrl))
      ),
      options.retryCount
    );
  }

  put<T>(url: string, body: any = null, options: HttpOptions = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const requestOptions = this.prepareOptions(options);

    if (!this.isBrowser) {
      return of({} as T);
    }

    return this.withRetry(
      this.http.put<T>(fullUrl, body, requestOptions).pipe(
        timeout(this.defaultTimeout),
        catchError(error => this.handleError<T>(error, fullUrl))
      ),
      options.retryCount
    );
  }

  patch<T>(url: string, body: any = null, options: HttpOptions = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const requestOptions = this.prepareOptions(options);

    if (!this.isBrowser) {
      return of({} as T);
    }

    return this.withRetry(
      this.http.patch<T>(fullUrl, body, requestOptions).pipe(
        timeout(this.defaultTimeout),
        catchError(error => this.handleError<T>(error, fullUrl))
      ),
      options.retryCount
    );
  }

  delete<T>(url: string, options: HttpOptions = {}): Observable<T> {
    const fullUrl = this.getFullUrl(url);
    const requestOptions = this.prepareOptions(options);

    if (!this.isBrowser) {
      return of({} as T);
    }

    return this.withRetry(
      this.http.delete<T>(fullUrl, requestOptions).pipe(
        timeout(this.defaultTimeout),
        catchError(error => this.handleError<T>(error, fullUrl))
      ),
      options.retryCount
    );
  }
}