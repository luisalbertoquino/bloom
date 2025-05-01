// src/app/features/admin/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService, Product } from '../../../core/services/product.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { BlogService, BlogPost } from '../../../core/services/blog.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

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

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private blogService: BlogService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Cargar datos para el dashboard
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Cargar productos
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        if (products && Array.isArray(products)) {
          this.productCount = products.length;
          this.availableProductCount = products.filter(p => p.available).length;
          
          // Obtener los 5 productos más recientes para la tabla
          this.recentProducts = [...products]
            .sort((a, b) => (b.id || 0) - (a.id || 0)) // Ordenar por ID descendente (asumiendo que IDs más altos son más recientes)
            .slice(0, 5) // Tomar los primeros 5
            .map(product => ({
              ...product,
              price: Number(product.price) // Asegurarse que el precio es un número
            }));
          
          // Organizar productos por categoría
          this.organizeByCategoryCount(products);
        }
        this.checkLoadingComplete();
      },
      error: (error: any) => {
        console.error('Error loading products', error);
        this.checkLoadingComplete();
      }
    });
    
    // Cargar categorías
    this.categoryService.getCategories().subscribe({
      next: (categories: Category[]) => {
        if (categories && Array.isArray(categories)) {
          this.categoryCount = categories.length;
        }
        this.checkLoadingComplete();
      },
      error: (error: any) => {
        console.error('Error loading categories', error);
        this.checkLoadingComplete();
      }
    });
    
    // Cargar entradas de blog
    this.blogService.getPosts().subscribe({
      next: (posts: BlogPost[]) => {
        if (posts && Array.isArray(posts)) {
          this.blogPostCount = posts.length;
        }
        this.checkLoadingComplete();
      },
      error: (error: any) => {
        console.error('Error loading blog posts', error);
        this.checkLoadingComplete();
      }
    });
  }

  toggleProductAvailability(product: Product): void {
    this.productService.toggleAvailability(product.id).subscribe({
      next: () => {
        // Actualizar el estado del producto localmente
        product.available = !product.available;
        
        // Actualizar contadores
        this.availableProductCount = product.available 
          ? this.availableProductCount + 1 
          : this.availableProductCount - 1;
        
        // Mostrar mensaje de éxito
        this.successMessage = `Producto "${product.name}" ${product.available ? 'activado' : 'desactivado'} correctamente.`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error toggling product availability', error);
        this.errorMessage = `Error al cambiar el estado del producto "${product.name}".`;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  getCategoryName(categoryId: number): string {
    const category = this.productsByCategory.find(c => c.name && typeof c.name === 'string');
    return category ? category.name : 'Sin categoría';
  }

  private organizeByCategoryCount(products: Product[]): void {
    // Obtener todas las categorías
    this.categoryService.getCategories().subscribe({
      next: (categories: Category[]) => {
        if (categories && Array.isArray(categories)) {
          // Crear un mapa de recuento por categoría
          const categoryCounts = new Map<number, number>();
          
          // Contar productos por categoría
          products.forEach(product => {
            const categoryId = product.category_id;
            categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
          });
          
          // Convertir a array para la vista
          this.productsByCategory = categories
            .filter(category => categoryCounts.has(category.id))
            .map(category => ({
              name: category.name,
              count: categoryCounts.get(category.id) || 0
            }))
            .sort((a, b) => b.count - a.count);
        }
      },
      error: (error: any) => {
        console.error('Error loading categories for count', error);
      }
    });
  }

  private checkLoadingComplete(): void {
    // Considerar la carga completa cuando tenemos todos los datos básicos
    if (this.productCount >= 0 && this.categoryCount >= 0 && this.blogPostCount >= 0) {
      this.isLoading = false;
    }
  }

  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.storageUrl + path;
  }
}