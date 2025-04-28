import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../enviroments/enviroment';
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

  constructor(
    private http: HttpClient,
    private httpBase: HttpBaseService,
    private router: Router
  ) {
    // Inicializar el BehaviorSubject con el usuario almacenado en localStorage
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Si hay un usuario autenticado, inicializar el token CSRF
    if (this.isAuthenticated) {
      this.initCsrfToken().subscribe();
    }
  }

  // Devuelve el valor actual del usuario sin suscribirse al observable
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Devuelve el token actual desde localStorage
  public get token(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
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
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  // Inicializa el token CSRF llamando al endpoint específico
  // Inicializa el token CSRF llamando al endpoint específico
initCsrfToken(): Observable<any> {
  if (this.csrfTokenInitialized) {
    return of(true); // Ya se inicializó, no hacer nada
  }
  
  console.log('Inicializando token CSRF...');
  // Intentamos tanto con /sanctum/csrf-cookie como con /api/csrf-test
  return this.http.get(`${environment.baseUrl}/sanctum/csrf-cookie`, {
    withCredentials: true
  }).pipe(
    tap(response => {
      console.log('Token CSRF inicializado correctamente:', response);
      console.log('Cookies después de inicializar:', document.cookie);
      this.csrfTokenInitialized = true;
    }),
    catchError(error => {
      console.error('Error al inicializar token CSRF con sanctum:', error);
      
      // Intentar con la ruta alternativa
      return this.http.get(`${this.apiUrl}/csrf-test`, {
        withCredentials: true
      }).pipe(
        tap(response => {
          console.log('Token CSRF inicializado con ruta alternativa:', response);
          console.log('Cookies después de inicializar (alt):', document.cookie);
          this.csrfTokenInitialized = true;
        }),
        catchError(innerError => {
          console.error('Error al inicializar token CSRF con ruta alternativa:', innerError);
          return throwError(() => innerError);
        })
      );
    })
  );
}

// Refresca el token CSRF
refreshCsrfToken(): Observable<any> {
  this.csrfTokenInitialized = false;
  return this.initCsrfToken();
}

  // Inicia sesión utilizando el HttpBaseService, primero obteniendo un token CSRF
  login(email: string, password: string): Observable<AuthResponse> {
    console.log('Iniciando proceso de login...');
    
    // Primero obtener el token CSRF, luego iniciar sesión
    return this.initCsrfToken().pipe(
      switchMap(() => {
        return this.httpBase.post<AuthResponse>(
          `${this.apiUrl}/login`, 
          { email, password }
        ).pipe(
          tap(response => {
            console.log('Login exitoso, guardando datos...');
            
            // Almacenar token y datos
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('access_token', response.access_token);
              localStorage.setItem('user', JSON.stringify(response.user));
            }
            this.currentUserSubject.next(response.user);
            this.router.navigate(['/admin']);
          })
        );
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  // Cierra sesión
  logout(): Observable<any> {
    // Refrescar token CSRF antes de cerrar sesión
    return this.refreshCsrfToken().pipe(
      switchMap(() => {
        return this.httpBase.post<any>(`${this.apiUrl}/logout`, {}).pipe(
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
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
    this.csrfTokenInitialized = false;
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Obtiene los datos del usuario actual desde el backend
  getCurrentUser(): Observable<User> {
    return this.httpBase.get<User>(`${this.apiUrl}/user`).pipe(
      tap(user => {
        console.log('Usuario actual obtenido');
        if (typeof window !== 'undefined' && window.localStorage) {
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