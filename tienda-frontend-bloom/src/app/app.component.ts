// src/app/app.component.ts
import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { AuthStateService } from './core/services/auth-state.service';
import { AppLoaderComponent } from '../app/shared/components/app-loader/app-loader.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet, CommonModule, AppLoaderComponent]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'mi-app';
  private routerSubscription: Subscription | null = null;
  private isBrowser: boolean;
  authCheckCompleted$: Observable<boolean>; // Solo declara el tipo
  
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any,
    private authStateService: AuthStateService,
    private themeService: ThemeService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.authCheckCompleted$ = this.authStateService.authCheckCompleted$; // Inicializa después de que el servicio exista
  }

  ngOnInit() {
    // Solo ejecutar código del lado del cliente si estamos en el navegador
    if (this.isBrowser) {
      // Inicializar tema desde la configuración de la BD
      this.themeService.initializeTheme();
      
      // Verificar si hay una sesión guardada
      this.checkStoredSession();
      
      // Monitorear cambios de ruta para renovar token en áreas protegidas
      this.authCheckCompleted$.pipe(
        filter(completed => completed === true),
        take(1)
      ).subscribe(() => {
        this.setupRouterEvents();
      });
      
      // Escuchar eventos globales de autenticación
      window.addEventListener('session-expired', this.handleSessionExpired.bind(this));
      window.addEventListener('auth-warning', this.handleAuthWarning.bind(this));
      window.addEventListener('csrf-error', this.handleCsrfError.bind(this));
    } else {
      // En servidor, marcar como completado inmediatamente
      this.authStateService.setAuthCheckCompleted(true);
    }
  }
  
  private setupRouterEvents() {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Verificar si estamos en una ruta protegida
        if (event.url.includes('/admin')) {
          // Si estamos autenticados, renovar token CSRF periódicamente
          if (this.authService.isAuthenticated) {
            this.authService.refreshCsrfToken().subscribe({
              next: () => console.log('Token CSRF renovado en cambio de ruta'),
              error: () => console.error('Error al renovar token CSRF en cambio de ruta')
            });
          }
        }
      });
  }
  
  ngOnDestroy() {
    // Solo ejecutar código del lado del cliente si estamos en el navegador
    if (this.isBrowser) {
      if (this.routerSubscription) {
        this.routerSubscription.unsubscribe();
      }
      
      // Eliminar listeners
      window.removeEventListener('session-expired', this.handleSessionExpired.bind(this));
      window.removeEventListener('auth-warning', this.handleAuthWarning.bind(this));
      window.removeEventListener('csrf-error', this.handleCsrfError.bind(this));
    }
  }
  
  private checkStoredSession() {
    // Esta función solo se ejecuta en el navegador
    if (!this.isBrowser) {
      this.authStateService.setAuthCheckCompleted(true);
      return;
    }
    
    // Verificar si hay una sesión guardada
    const accessToken = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    const timestamp = localStorage.getItem('auth_timestamp');
    
    if (accessToken && user && timestamp) {
      // Verificar si la sesión no es demasiado antigua (8 horas max)
      const now = Date.now();
      const storedTime = parseInt(timestamp, 10);
      const hoursDiff = (now - storedTime) / (1000 * 60 * 60);
      
      if (hoursDiff < 8) {
        // Restaurar estado de autenticación
        this.authService.restoreAuthState(JSON.parse(user), accessToken);
        
        // Renovar token CSRF
        this.authService.refreshCsrfToken().subscribe({
          next: () => {
            console.log('Token CSRF renovado al iniciar la aplicación');
            this.authStateService.setAuthCheckCompleted(true);
          },
          error: () => {
            console.error('Error al renovar token CSRF al iniciar');
            this.authStateService.setAuthCheckCompleted(true);
          }
        });
      } else {
        // Limpiar datos antiguos
        console.warn('Sesión expirada detectada al iniciar. Limpiando datos.');
        this.authService.clearAuthData();
        this.authStateService.setAuthCheckCompleted(true);
      }
    } else {
      // No hay sesión guardada
      this.authStateService.setAuthCheckCompleted(true);
    }
  }
  
  // Manejadores de eventos
  private handleSessionExpired(event: any) {
    console.warn('Evento de sesión expirada recibido:', event.detail?.message);
    // No hacer logout inmediatamente, permitir que los componentes muestren mensajes
  }
  
  private handleAuthWarning(event: any) {
    console.log('Advertencia de autenticación:', event.detail?.message);
    // Los componentes individuales mostrarán alertas
  }
  
  private handleCsrfError(event: any) {
    console.warn('Error CSRF:', event.detail?.message);
    // Intentar renovar token CSRF
    this.authService.refreshCsrfToken().subscribe();
  }
}