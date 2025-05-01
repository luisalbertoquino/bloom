// src/app/features/admin/layout/admin-layout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CookieManagerService } from '../../../core/services/cookie-manager.service';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';
import { catchError, delay, switchMap, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';


@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = true;
  currentUser: User | null = null;
  isUserMenuOpen = false;
  logoUrl = '/assets/images/logo.png';
  siteTitle = 'Admin Panel';
  isMobile = false;
  autoRetrying = false;
  private mobileBreakpoint = 768;
  private userSubscription: Subscription | null = null;
  private cleanupInterval: any = null;

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
    private cookieManager: CookieManagerService
  ) { 
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Realizar limpieza inicial única
    this.cookieManager.cleanNonEssentialCookies();
    
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    this.loadSettings();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
    
    // Limpieza periódica de cookies (cada 15 minutos)
    // Menos frecuente para reducir operaciones innecesarias
    this.setupPeriodicCleanup();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
    
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    
    // Limpiar el intervalo para evitar memory leaks
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
  
  private setupPeriodicCleanup(): void {
    // Reducir frecuencia de limpieza para minimizar operaciones con cookies
    this.cleanupInterval = setInterval(() => {
      this.cookieManager.cleanNonEssentialCookies();
    }, 15 * 60 * 1000); // 15 minutos
    
    // Limpieza adicional en caso de un cambio de ruta
    // Esto se maneja automáticamente ahora por el cookieManager
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout(): void {
    // Limpiar cookies no esenciales antes de logout
    this.cookieManager.cleanNonEssentialCookies();
    
    this.authService.logout()
      .pipe(
        catchError(error => {
          console.error('Error en logout:', error);
          
          // Redirección manual en caso de error
          window.location.href = '/login';
          return of(null);
        })
      )
      .subscribe(() => {
        // No es necesario hacer nada aquí, AuthService maneja la redirección
      });
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < this.mobileBreakpoint;
    if (this.isMobile) {
      this.isSidebarOpen = false;
    } else {
      this.isSidebarOpen = true;
    }
  }

  private loadSettings(): void {
    // Evitamos limpieza antes de la carga para reducir operaciones cookie
    
    this.settingsService.getSettings()
      .pipe(
        catchError(error => {
          console.error('Error loading settings:', error);
          
          if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
            this.autoRetrying = true;
            setTimeout(() => {
              this.autoRetrying = false;
              this.loadSettings();
            }, 1000);
          }
          
          return of({
            site_title: 'Admin Panel',
            logo: ''
          });
        })
      )
      .subscribe(settings => {
        if (settings.site_title) {
          this.siteTitle = settings.site_title;
        }
        if (settings.logo) {
          this.logoUrl = environment.storageUrl + settings.logo;
        }
      });
  }
}