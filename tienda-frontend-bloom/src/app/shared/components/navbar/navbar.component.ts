// src/app/shared/components/navbar/navbar.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartPopupComponent } from '../../../features/store/cart-popup/cart-popup.component';
import { environment } from '../../../../enviroments/enviroment';

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
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;
  
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
  
  private isBrowser: boolean;
  private clickListener: any = null;

  constructor(
    private cartService: CartService,
    private settingsService: SettingsService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Verificar si estamos en el navegador
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

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

  ngAfterViewInit(): void {
    // Solo ejecutar en el navegador
    if (this.isBrowser) {
      // Escuchar eventos globales para cerrar componentes abiertos
      this.clickListener = (event: MouseEvent) => {
        // Cerrar el menú de usuario si se hace clic fuera de él
        const userMenuElement = document.querySelector('.relative') as Node;
        if (this.isUserMenuOpen && userMenuElement && !event.composedPath().includes(userMenuElement)) {
          this.isUserMenuOpen = false;
        }
      };
      
      document.addEventListener('click', this.clickListener);
    }
  }
  
  ngOnDestroy(): void {
    // Limpiar el listener cuando el componente se destruye
    if (this.isBrowser && this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
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
      
      // Enfocar el input de búsqueda después de que se muestre (solo en navegador)
      if (this.isBrowser) {
        setTimeout(() => {
          if (this.searchInput && this.searchInput.nativeElement) {
            this.searchInput.nativeElement.focus();
          }
        }, 100);
      }
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
        queryParams: { search: this.searchQuery.trim() } 
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