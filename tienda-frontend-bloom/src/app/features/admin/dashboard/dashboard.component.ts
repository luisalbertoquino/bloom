import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService, Product } from '../../../core/services/product.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { BlogService, BlogPost } from '../../../core/services/blog.service';
import { AuthService } from '../../../core/services/auth.service';
import { CookieManagerService } from '../../../core/services/cookie-manager.service';
import { environment } from '../../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class DashboardComponent implements OnInit {
  productCount = 0;
  availableProductCount = 0;
  categoryCount = 0;
  blogPostCount = 0;
  productsByCategory: {name: string, count: number}[] = [];
  recentProducts: Product[] = [];
  isLoading = true;
  storageUrl = environment.storageUrl;
  successMessage = '';
  errorMessage = '';
  autoRetrying = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private blogService: BlogService,
    private authService: AuthService,
    private cookieManager: CookieManagerService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Usar forkJoin para combinar las solicitudes y simplificar el código
    forkJoin({
      products: this.productService.getProducts().pipe(
        catchError(error => {
          console.error('Error loading products', error);
          return of([]);
        })
      ),
      categories: this.categoryService.getCategories().pipe(
        catchError(error => {
          console.error('Error loading categories', error);
          return of([]);
        })
      ),
      posts: this.blogService.getPosts().pipe(
        catchError(error => {
          console.error('Error loading blog posts', error);
          return of([]);
        })
      )
    }).subscribe({
      next: ({ products, categories, posts }) => {
        // Procesar productos
        this.processProducts(products);
        
        // Procesar categorías
        this.categoryCount = categories.length;
        
        // Procesar posts
        this.blogPostCount = posts.length;
        
        // Organizar productos por categoría
        this.organizeProductsByCategory(products, categories);
        
        // Finalizar carga
        this.isLoading = false;
        this.autoRetrying = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Serás redirigido a la página de inicio de sesión.';
          this.handleSessionExpired();
        } else {
          this.errorMessage = 'Error al cargar los datos del panel. Inténtalo de nuevo más tarde.';
          
          // Reintento automático para errores de conexión
          if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
            this.autoRetrying = true;
            this.errorMessage = 'Reestableciendo conexión...';
            setTimeout(() => {
              this.loadDashboardData();
            }, 1000);
          }
        }
      }
    });
  }

  toggleProductAvailability(product: Product): void {
    this.productService.toggleAvailability(product.id).subscribe({
      next: () => {
        product.available = !product.available;
        this.availableProductCount = product.available 
          ? this.availableProductCount + 1 
          : this.availableProductCount - 1;
        
        this.successMessage = `Producto "${product.name}" ${product.available ? 'activado' : 'desactivado'} correctamente.`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error toggling product availability', error);
        this.errorMessage = `Error al cambiar el estado del producto "${product.name}".`;
        
        // Reintento automático para errores de conexión
        if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
          this.autoRetrying = true;
          this.errorMessage = 'Reestableciendo conexión...';
          setTimeout(() => {
            this.autoRetrying = false;
            this.toggleProductAvailability(product);
          }, 1000);
        } else {
          setTimeout(() => this.errorMessage = '', 3000);
        }
      }
    });
  }

  private processProducts(products: Product[]): void {
    if (products && Array.isArray(products)) {
      this.productCount = products.length;
      this.availableProductCount = products.filter(p => p.available).length;
      
      this.recentProducts = [...products]
        .sort((a, b) => (b.id || 0) - (a.id || 0))
        .slice(0, 5)
        .map(product => ({
          ...product,
          price: Number(product.price)
        }));
    }
  }

  private organizeProductsByCategory(products: Product[], categories: Category[]): void {
    if (products && categories && Array.isArray(products) && Array.isArray(categories)) {
      const categoryCounts = new Map<number, number>();
      
      products.forEach(product => {
        const categoryId = product.category_id;
        categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
      });
      
      this.productsByCategory = categories
        .filter(category => categoryCounts.has(category.id))
        .map(category => ({
          name: category.name,
          count: categoryCounts.get(category.id) || 0
        }))
        .sort((a, b) => b.count - a.count);
    }
  }

  private handleSessionExpired(): void {
    setTimeout(() => {
      this.authService.logout().subscribe({
        next: () => {},
        error: () => {
          window.location.href = '/login';
        }
      });
    }, 2000);
  }

  getCategoryName(categoryId: number): string {
    const category = this.productsByCategory.find(c => c.name && typeof c.name === 'string');
    return category ? category.name : 'Sin categoría';
  }

  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.storageUrl + path;
  }
}