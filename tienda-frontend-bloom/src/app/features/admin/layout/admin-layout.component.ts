// src/app/features/admin/layout/admin-layout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { environment } from '../../../../environments/enviroment';

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
  private mobileBreakpoint = 768; // Breakpoint para considerar como móvil

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService
  ) { 
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Cargar datos del usuario
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    // Cargar configuración del sitio
    this.loadSettings();

    // Escuchar cambios en el tamaño de la pantalla
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < this.mobileBreakpoint;
    if (this.isMobile) {
      this.isSidebarOpen = false; // Cierra el sidebar por defecto en móviles
    } else {
      this.isSidebarOpen = true; // Abre el sidebar en pantallas más grandes
    }
  }

  private loadSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        if (settings.site_title) {
          this.siteTitle = settings.site_title;
        }
        if (settings.logo) {
          this.logoUrl = environment.storageUrl + settings.logo;
        }
      },
      error: (err) => {
        console.error('Error loading settings:', err);
      }
    });
  }
}