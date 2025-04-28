// src/app/shared/components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartPopupComponent } from '../../../features/store/cart-popup/cart-popup.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    FormsModule,
    CartPopupComponent
  ],
})
export class NavbarComponent implements OnInit {
  isMobileMenuOpen = false;
  isSearchOpen = false;
  isUserMenuOpen = false;
  cartItemCount = 0;
  logoUrl = '/assets/images/logo.png';
  siteTitle = 'Bloom Accesorios';
  isCartOpen = false;
  isAuthenticated = false;
  userName = '';
  searchQuery = '';

  constructor(
    private cartService: CartService,
    private settingsService: SettingsService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Suscribirse a los cambios en el carrito
    this.cartService.cart.subscribe(items => {
      this.cartItemCount = this.cartService.getTotalItems();
    });

    // Suscribirse a los cambios en la autenticación
    this.authService.currentUser.subscribe(user => {
      this.isAuthenticated = !!user;
      if (user) {
        this.userName = user.name;
      }
    });

    // Cargar configuraciones del sitio
    this.loadSettings();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isSearchOpen = false;
      this.isUserMenuOpen = false;
    }
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      this.isMobileMenuOpen = false;
      this.isUserMenuOpen = false;
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  toggleLoginModal(): void {
    if (this.isAuthenticated) {
      this.toggleUserMenu();
    } else {
      // Navegar a la página de login
      this.router.navigate(['/login']);
    }
  }

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  search(): void {
    if (this.searchQuery.trim()) {
      // Navegar a la página de productos con el parámetro de búsqueda
      this.router.navigate(['/productos'], { 
        queryParams: { query: this.searchQuery } 
      });
      this.isSearchOpen = false;
      this.searchQuery = '';
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // El redireccionamiento se hace en el servicio
        this.isUserMenuOpen = false;
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
        // Intentamos cerrar sesión localmente de todos modos
        this.isUserMenuOpen = false;
      }
    });
  }

  private loadSettings(): void {
    this.settingsService.getSettings().subscribe(
      settings => {
        if (settings.site_title) {
          this.siteTitle = settings.site_title;
        }

        if (settings.logo) {
          // Construir la URL completa de la imagen
          this.logoUrl = 'http://localhost:8000/storage/' + settings.logo;
        }
      },
      error => {
        console.error('Error loading settings', error);
      }
    );
  }
}