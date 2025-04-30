// src/app/features/admin/layout/admin-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { environment } from '../../../../enviroments/enviroment';

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
export class AdminLayoutComponent implements OnInit {
  isSidebarOpen = true;
  currentUser: User | null = null;
  isUserMenuOpen = false;
  logoUrl = '/assets/images/logo.png'; // Ruta por defecto
  siteTitle = 'Admin Panel'; // Texto por defecto

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    // Cargar datos del usuario
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    // Cargar configuración del sitio
    this.loadSettings();
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

  private loadSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        if (settings.site_title) {
          this.siteTitle = settings.site_title;
        }
        if (settings.logo) {
          this.logoUrl = 'http://localhost:8000/storage/' + settings.logo;
        }
      },
      error: (err) => {
        console.error('Error loading settings:', err);
      }
    });
  }
}