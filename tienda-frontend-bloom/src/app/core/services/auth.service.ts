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
  private authTimestamp: number | null = null;
  private autoRefreshInterval: any = null;

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
    
    // Verificar si hay sesión guardada
    if (this.isBrowser && this.isAuthenticated) {
      // Restaurar timestamp de autenticación si existe
      const timestamp = localStorage.getItem('auth_timestamp');
      if (timestamp) {
        this.authTimestamp = parseInt(timestamp, 10);
        
        // Verificar si la sesión no está demasiado antigua (8 horas)
        const now = Date.now();
        const hoursDiff = (now - this.authTimestamp) / (1000 * 60 * 60);
        
        if (hoursDiff > 8) {
          // Sesión demasiado antigua, limpiar datos
          console.warn('Sesión antigua detectada. Cerrando sesión automáticamente.');
          this.clearAuthData();
        } else {
          // Configurar renovación automática de token CSRF
          this.setupAutoRefresh();
        }
      }
    }
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

  // Configurar renovación automática de token CSRF
  private setupAutoRefresh(): void {
    // Limpiar intervalo existente si lo hay
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    // Renovar token cada 15 minutos para mantener la sesión activa
    this.autoRefreshInterval = setInterval(() => {
      if (this.isAuthenticated) {
        this.refreshCsrfToken().subscribe({
          next: () => console.log('Token CSRF renovado automáticamente'),
          error: () => console.error('Error al renovar token CSRF automáticamente')
        });
      } else {
        // Si ya no está autenticado, detener la renovación automática
        this.stopAutoRefresh();
      }
    }, 15 * 60 * 1000); // 15 minutos
    
    console.log('Renovación automática de token CSRF configurada');
  }
  
  // Detener renovación automática
  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
      console.log('Renovación automática de token CSRF detenida');
    }
  }

  // Método revisado para inicializar el token CSRF
  initCsrfToken(): Observable<any> {
    if (this.csrfTokenInitialized && !this.tokenRefreshInProgress) {
      // Verificar si realmente tenemos un token válido
      const token = this.getXsrfTokenFromCookie() || localStorage.getItem('XSRF_TOKEN');
      if (token && token.length > 20) {
        console.log('Token CSRF válido existente');
        
        // Si hay token en localStorage pero no en cookie, restaurarlo
        if (!this.getXsrfTokenFromCookie() && localStorage.getItem('XSRF_TOKEN')) {
          const storedToken = localStorage.getItem('XSRF_TOKEN');
          this.restoreTokenToCookie(storedToken!);
          console.log('Token CSRF restaurado desde localStorage a cookie');
        }
        
        return of(true);
      }
    }
    
    this.tokenRefreshInProgress = true;
    console.log('Solicitando CSRF token...');
    
    // Evitar duplicar la URL si ya contiene http
    const csrfUrl = environment.baseUrl.startsWith('http') 
      ? `${environment.baseUrl}/sanctum/csrf-cookie`
      : `${window.location.origin}${environment.baseUrl}/sanctum/csrf-cookie`;
    
    return this.http.get(csrfUrl, {
      withCredentials: true,
      headers: new HttpHeaders({
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      })
    }).pipe(
      // Aumentar el delay para asegurar que la cookie se procese
      delay(500),
      tap(() => {
        this.tokenRefreshInProgress = false;
        this.csrfTokenInitialized = true;
        
        if (this.isBrowser) {
          const token = this.getXsrfTokenFromCookie();
          console.log('CSRF token obtenido:', token ? token.substring(0, 10) + '...' : 'No disponible');
          
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

  // Método para restaurar token desde localStorage a cookie
  private restoreTokenToCookie(token: string): void {
    if (!this.isBrowser) return;
    
    try {
      // Calcular fecha de expiración (8 horas desde ahora)
      const expiresDate = new Date();
      expiresDate.setTime(expiresDate.getTime() + 8 * 60 * 60 * 1000);
      
      // Establecer cookie con el token
      document.cookie = `XSRF-TOKEN=${token}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Lax`;
      console.log('Token CSRF restaurado a cookie');
    } catch (e) {
      console.error('Error al restaurar token CSRF a cookie:', e);
    }
  }

  refreshCsrfToken(): Observable<any> {
    this.csrfTokenInitialized = false;
    return this.initCsrfToken();
  }

  // Método revisado para login
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
          
          // Guardar timestamp de autenticación
          this.authTimestamp = Date.now();
          localStorage.setItem('auth_timestamp', this.authTimestamp.toString());
          
          // Guardar también el token CSRF actual
          const csrfToken = this.getXsrfTokenFromCookie();
          if (csrfToken) {
            localStorage.setItem('XSRF_TOKEN', csrfToken);
          }
          
          // Configurar renovación automática de token
          this.setupAutoRefresh();
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

  // Método para restaurar el estado de autenticación
  restoreAuthState(user: User, token: string): void {
    this.currentUserSubject.next(user);
    
    // Restaurar token CSRF si es necesario
    const xsrfToken = localStorage.getItem('XSRF_TOKEN');
    if (xsrfToken && !this.getXsrfTokenFromCookie()) {
      this.restoreTokenToCookie(xsrfToken);
    }
    
    // Configurar renovación automática
    this.setupAutoRefresh();
    
    console.log('Estado de autenticación restaurado para:', user.email);
  }

  logout(): Observable<any> {
    // Detener renovación automática de token
    this.stopAutoRefresh();
    
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
    // Detener renovación automática de token
    this.stopAutoRefresh();
    
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('XSRF_TOKEN');
      localStorage.removeItem('auth_timestamp');
      // Usar el servicio de gestión de cookies para limpiar cookies
      this.cookieManager.cleanAllCookies();
    }
    
    this.csrfTokenInitialized = false;
    this.authTimestamp = null;
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User> {
    if (!this.isAuthenticated) {
      return throwError(() => new Error('No autenticado'));
    }
    
    // Añadir token de autorización también
    let headers = new HttpHeaders({
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json'
    });
    
    // Añadir token CSRF si existe
    const csrfToken = this.getXsrfTokenFromCookie();
    if (csrfToken) {
      headers = headers.set('X-XSRF-TOKEN', csrfToken);
    }
    
    // Añadir token de autorización si existe
    const authToken = this.token;
    if (authToken) {
      headers = headers.set('Authorization', `Bearer ${authToken}`);
    }
    
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
          this.cookieManager.cleanNonEssentialCookies();
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