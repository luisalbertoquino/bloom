// src/app/core/services/auth.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, switchMap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HttpBaseService } from './http-base.service';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
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

  constructor(
    private http: HttpClient,
    private httpBase: HttpBaseService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Inicializar el BehaviorSubject con el usuario almacenado en localStorage
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Devuelve el valor actual del usuario sin suscribirse al observable
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Devuelve el token actual desde localStorage
  public get token(): string | null {
    if (this.isBrowser && window.localStorage) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  // Devuelve true si el usuario está autenticado
  public get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUserValue;
  }

  // Recupera el usuario almacenado en localStorage
  private getUserFromStorage(): User | null {
    if (this.isBrowser && window.localStorage) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  // Inicializa el token CSRF llamando al endpoint específico
  initCsrfToken(): Observable<any> {
    if (this.csrfTokenInitialized) {
      return of(true); // Ya se inicializó, no hacer nada
    }
    
    console.log('Inicializando token CSRF...');
    return this.http.get(`${environment.baseUrl}/sanctum/csrf-cookie`, {
      withCredentials: true
    }).pipe(
      tap(response => {
        console.log('Token CSRF inicializado correctamente');
        if (this.isBrowser) {
          console.log('Cookies después de inicializar CSRF:', document.cookie);
        }
        this.csrfTokenInitialized = true;
      }),
      catchError(error => {
        console.error('Error al inicializar token CSRF:', error);
        return throwError(() => error);
      })
    );
  }

  // Refresca el token CSRF
  refreshCsrfToken(): Observable<any> {
    this.csrfTokenInitialized = false;
    return this.initCsrfToken();
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

  // Inicia sesión con manejo explícito del token CSRF
  login(email: string, password: string): Observable<AuthResponse> {
    console.log('Iniciando proceso de login...');
    
    return this.initCsrfToken().pipe(
      switchMap(() => {
        // Obtenemos el token CSRF manualmente de las cookies
        const token = this.getXsrfToken();
        console.log('Token CSRF para login:', token);
        
        // Configuramos los headers manualmente para asegurarnos de que el token se envía correctamente
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(token ? { 'X-XSRF-TOKEN': token } : {})
        });
        
        if (this.isBrowser) {
          console.log('Cookies antes de login:', document.cookie);
        }
        
        return this.http.post<AuthResponse>(
          `${this.apiUrl}/login`, 
          { email, password },
          { 
            headers: headers,
            withCredentials: true 
          }
        ).pipe(
          tap(response => {
            console.log('Login exitoso, guardando datos...');
            
            // Almacenar token y datos
            if (this.isBrowser && window.localStorage) {
              localStorage.setItem('access_token', response.access_token);
              localStorage.setItem('user', JSON.stringify(response.user));
            }
            this.currentUserSubject.next(response.user);
            this.router.navigate(['/admin']);
          }),
          finalize(() => {
            // Log para verificar las cookies después de login
            if (this.isBrowser) {
              console.log('Cookies después de login:', document.cookie);
            }
          }),
          catchError(error => {
            console.error('Error en login:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  // Cierra sesión
  logout(): Observable<any> {
    // Refrescar token CSRF antes de cerrar sesión
    return this.refreshCsrfToken().pipe(
      switchMap(() => {
        // Obtener el token CSRF actualizado
        const token = this.getXsrfToken();
        
        // Crear headers con el token
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(token ? { 'X-XSRF-TOKEN': token } : {})
        });
        
        return this.http.post<any>(
          `${this.apiUrl}/logout`, 
          {},
          { 
            headers: headers,
            withCredentials: true 
          }
        ).pipe(
          tap(() => {
            console.log('Logout exitoso');
            this.clearAuthData();
          })
        );
      }),
      catchError(error => {
        console.error('Error en logout:', error);
        // Incluso si hay error, limpiamos los datos localmente
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  // Limpia los datos de autenticación
  public clearAuthData(): void {
    console.log('Limpiando datos de autenticación');
    if (this.isBrowser && window.localStorage) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
    this.csrfTokenInitialized = false;
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Obtiene los datos del usuario actual desde el backend
  getCurrentUser(): Observable<User> {
    // Obtener el token CSRF
    const token = this.getXsrfToken();
    
    // Crear headers con el token
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { 'X-XSRF-TOKEN': token } : {})
    });
    
    return this.http.get<User>(
      `${this.apiUrl}/user`,
      { 
        headers: headers,
        withCredentials: true 
      }
    ).pipe(
      tap(user => {
        console.log('Usuario actual obtenido');
        if (this.isBrowser && window.localStorage) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Error al obtener usuario actual:', error);
        if (error.status === 401) {
          this.clearAuthData();
        }
        return throwError(() => error);
      })
    );
  }

  public handleAuthError(): void {
    console.log('Manejando error de autenticación desde AuthService');
    this.clearAuthData();
  }
}