// src/app/core/services/auth.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, switchMap, finalize, delay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HttpBaseService } from './http-base.service';
import { CookieManagerService } from './cookie-manager.service';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = environment.apiUrl;
  private csrfTokenInitialized = false;
  private isBrowser: boolean;
  private tokenRefreshInProgress = false;

  constructor(
    private http: HttpClient,
    private httpBase: HttpBaseService,
    private router: Router,
    private cookieManager: CookieManagerService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    return this.isBrowser ? localStorage.getItem('access_token') : null;
  }

  public get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUserValue;
  }

  private getUserFromStorage(): User | null {
    if (this.isBrowser) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  // Función para obtener correctamente el token CSRF
  private getXsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const parts = cookie.trim().split('=');
        if (parts.length > 1 && parts[0] === 'XSRF-TOKEN') {
          // Importante: Decodificar correctamente el valor de la cookie
          return decodeURIComponent(parts[1]);
        }
      }
    } catch (e) {
      console.error('Error al extraer token CSRF:', e);
    }
    
    return null;
  }

  // Método revisado para inicializar el token CSRF
  initCsrfToken(): Observable<any> {
    if (this.csrfTokenInitialized && !this.tokenRefreshInProgress) {
      console.log('Token CSRF ya inicializado, omitiendo solicitud');
      return of(true);
    }
    
    this.tokenRefreshInProgress = true;
    console.log('Solicitando CSRF token a:', `${environment.baseUrl}/sanctum/csrf-cookie`);
    
    // Primero, forzar limpieza del estado de CSRF
    this.csrfTokenInitialized = false;
    
    return this.http.get(`${environment.baseUrl}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: new HttpHeaders({
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      })
    }).pipe(
      // Delay crítico para asegurar que la cookie se procese correctamente
      delay(300),
      tap(() => {
        this.tokenRefreshInProgress = false;
        this.csrfTokenInitialized = true;
        
        if (this.isBrowser) {
          const token = this.getXsrfTokenFromCookie();
          console.log('CSRF token después de inicializar:', token ? 'Obtenido' : 'No disponible');
          
          // Guardar directamente en localStorage para reutilizar
          if (token) {
            localStorage.setItem('XSRF_TOKEN', token);
          }
        }
      }),
      catchError(error => {
        this.tokenRefreshInProgress = false;
        this.csrfTokenInitialized = false;
        console.error('Error al inicializar token CSRF:', error);
        return of(false);
      })
    );
  }

  refreshCsrfToken(): Observable<any> {
    this.csrfTokenInitialized = false;
    return this.initCsrfToken();
  }

  // Método revisado para login - sin reintentos automáticos
  login(email: string, password: string): Observable<AuthResponse> {
    console.log('Iniciando proceso de login para:', email);
    
    return this.initCsrfToken().pipe(
      switchMap(() => {
        // Obtener token DIRECTAMENTE de las cookies (no del localStorage)
        const token = this.getXsrfTokenFromCookie();
        console.log('Token CSRF para login:', token ? token.substring(0, 10) + '...' : 'No disponible');
        
        if (!token) {
          return throwError(() => ({
            status: 419,
            message: 'No se pudo obtener token de seguridad. Por favor, recarga la página.'
          }));
        }
        
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': token  // Usar el token directamente de la cookie
        });
        
        return this.http.post<AuthResponse>(
          `${this.apiUrl}/login`, 
          { email, password },
          { headers, withCredentials: true }
        );
      }),
      tap(response => {
        console.log('Login exitoso');
        
        // Guardar token y datos del usuario
        if (this.isBrowser) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user', JSON.stringify({
            id: response.user.id,
            name: response.user.name,
            email: response.user.email
          }));
        }
        
        // Actualizar el BehaviorSubject con el usuario actual
        this.currentUserSubject.next(response.user);
        
        // Redirigir al usuario después del login
        this.router.navigate(['/admin']);
      }),
      catchError(error => {
        console.error('Error en login:', error);
        
        // Limpiar estado de token para permitir obtener uno nuevo
        if (error.status === 419) {
          this.csrfTokenInitialized = false;
          console.log('Error de CSRF token.');
        }
        
        // NO reintentar automáticamente - devolver el error al componente
        if (error.error && error.error.message) {
          return throwError(() => ({
            status: error.status,
            message: error.error.message
          }));
        }
        
        // Mensajes de error personalizados según status
        const errorMessages: {[key: number]: string} = {
          401: 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.',
          419: 'Error de seguridad. Por favor, recarga la página e intenta nuevamente.',
          431: 'Error de conexión. Por favor, recarga la página e intenta nuevamente.',
          0: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
        };
        
        // Usar operador de acceso seguro con valor predeterminado
        const message = (error.status in errorMessages) 
          ? errorMessages[error.status] 
          : 'Error al conectar con el servidor. Inténtalo de nuevo más tarde.';
        
        return throwError(() => ({
          status: error.status,
          message: message
        }));
      })
    );
  }

  logout(): Observable<any> {
    // Obtener token DIRECTAMENTE de las cookies
    const token = this.getXsrfTokenFromCookie();
    
    const headers = new HttpHeaders({
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      ...(token ? { 'X-XSRF-TOKEN': token } : {})
    });
    
    return this.http.post<any>(
      `${this.apiUrl}/logout`, 
      {},
      { headers, withCredentials: true }
    ).pipe(
      tap(() => this.clearAuthData()),
      catchError(error => {
        this.clearAuthData();
        return of(null);
      })
    );
  }

  public clearAuthData(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('XSRF_TOKEN');
      // Usar el servicio de gestión de cookies para limpiar cookies
      this.cookieManager.cleanAllCookies();
    }
    this.csrfTokenInitialized = false;
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User> {
    if (!this.isAuthenticated) {
      return throwError(() => new Error('No autenticado'));
    }
    
    // Obtener token DIRECTAMENTE de las cookies
    const token = this.getXsrfTokenFromCookie();
    
    const headers = new HttpHeaders({
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      ...(token ? { 'X-XSRF-TOKEN': token } : {})
    });
    
    return this.http.get<User>(
      `${this.apiUrl}/user`,
      { headers, withCredentials: true }
    ).pipe(
      tap(user => {
        if (this.isBrowser) {
          // Almacenar solo datos esenciales
          const essentialUserData = {
            id: user.id,
            name: user.name,
            email: user.email
          };
          localStorage.setItem('user', JSON.stringify(essentialUserData));
        }
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        if (error.status === 401) {
          this.clearAuthData();
        } else if (error.status === 431) {
          // Error específico de encabezados demasiado grandes
          console.error('Error 431: Headers demasiado grandes - Limpiando cookies');
          this.cookieManager.cleanNonEssentialCookies(); // Cambio a cleanNonEssentialCookies
          // NO reintentar automáticamente
          return throwError(() => ({
            status: error.status,
            message: 'Error de conexión. Por favor, recarga la página e intenta nuevamente.'
          }));
        }
        return throwError(() => error);
      })
    );
  }

  public handleAuthError(): void {
    this.clearAuthData();
  }
}