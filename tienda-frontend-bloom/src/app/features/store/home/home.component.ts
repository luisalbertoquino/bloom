// src/app/features/store/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { CategoryService, Category } from '../../../core/services/category.service';
import { ProductService, Product } from '../../../core/services/product.service';
import { BlogService, BlogPost } from '../../../core/services/blog.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';
import { ProductQuickViewComponent } from '../product-quick-view/product-quick-view.component';

import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Router } from '@angular/router';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FooterComponent,
    ProductQuickViewComponent,
    ProductCardComponent
  ]
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  products: Product[] = [];
  featuredPosts: BlogPost[] = [];
  bannerUrl = '/assets/images/banner.jpg';
  isLoading = true;
  storageUrl = environment.storageUrl;
  
  // Quick View Modal
  showQuickView = false;
  selectedProduct: Product | null = null;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private blogService: BlogService,
    private settingsService: SettingsService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    // Cargar datos reales
    this.loadAllData();
  }

  // Abre el modal de vista rápida
  quickView(product: Product): void {
    this.selectedProduct = product;
    this.showQuickView = true;
  }
  
  // Navega a la página de detalle del producto
  viewProductDetails(product: Product): void {
    this.router.navigate(['/productos', product.id]);
  }

  closeQuickView(): void {
    this.showQuickView = false;
    this.selectedProduct = null;
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  buyNow(product: Product): void {
    this.cartService.addToCart(product);
    this.cartService.sendToWhatsApp();
  }

  getExcerpt(html: string): string {
    if (!html) return '';
    const text = String(html).replace(/<\/?[^>]+(>|$)/g, '');
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.storageUrl + path;
  }

  private loadAllData(): void {
    // Preparar observables seguros (que no fallan)
    const safeCategories$ = this.categoryService.getCategories().pipe(
      catchError(error => {
        console.error('Error loading categories', error);
        return of([]);
      })
    );
    
    const safeProducts$ = this.productService.getProducts().pipe(
      catchError(error => {
        console.error('Error loading products', error);
        return of([]);
      })
    );
    
    const safePosts$ = this.blogService.getFeaturedPosts().pipe(
      catchError(error => {
        console.error('Error loading featured posts', error);
        return of([]);
      })
    );
    
    const safeSettings$ = this.settingsService.getSettings().pipe(
      catchError(error => {
        console.error('Error loading settings', error);
        return of({});
      })
    ); 
  
    // Combinar todos los observables
    forkJoin({
      categories: safeCategories$,
      products: safeProducts$,
      posts: safePosts$,
      settings: safeSettings$
    }).subscribe(results => {
      // Procesar categorías
      if (results.categories && Array.isArray(results.categories)) {
        this.categories = results.categories.filter(cat => cat.active);
      }
      
      // Procesar productos
      if (results.products && Array.isArray(results.products)) {
        this.products = results.products
          .filter(product => product.available)
          .slice(0, 8)
          .map(product => ({
            ...product,
            price: Number(product.price)
          }));
      }
      
      // Procesar posts
      if (results.posts && Array.isArray(results.posts)) {
        this.featuredPosts = results.posts;
      }
      
      // Procesar configuraciones
      if (results.settings && results.settings.banner_image) {
        this.bannerUrl = this.storageUrl + results.settings.banner_image;
      }
      
      // Marcar carga como completa
      this.isLoading = false;
    });
  }

  private loadCategories(categories$: Observable<Category[]>): void {
    categories$.subscribe(
      (categories: Category[]) => {
        if (categories && Array.isArray(categories)) {
          this.categories = categories.filter(cat => cat.active);
        }
        this.checkLoadingComplete();
      },
      (error: any) => {
        console.error('Error loading categories', error);
        this.checkLoadingComplete();
      }
    );
  }

  
  private loadProducts(products$: Observable<Product[]>): void {
    products$.subscribe(
      (products: Product[]) => {
        if (products && Array.isArray(products)) {
          this.products = products
            .filter(product => product.available)
            .slice(0, 8)
            .map(product => ({
              ...product,
              price: Number(product.price) // Convertir a número
            }));
        }
        this.checkLoadingComplete();
      },
      (error: any) => {
        console.error('Error loading products', error);
        this.checkLoadingComplete();
      }
    );
  }

  private loadFeaturedPosts(posts$: Observable<BlogPost[]>): void {
    posts$.subscribe(
      (posts: BlogPost[]) => {
        if (posts && Array.isArray(posts)) {
          this.featuredPosts = posts;
        }
        this.checkLoadingComplete();
      },
      (error: any) => {
        console.error('Error loading featured posts', error);
        this.checkLoadingComplete();
      }
    );
  }

  private loadSettings(settings$: Observable<any>): void {
    settings$.subscribe(
      (settings: any) => {
        if (settings && settings.banner_image) {
          this.bannerUrl = this.storageUrl + settings.banner_image;
        }
        this.checkLoadingComplete();
      },
      (error: any) => {
        console.error('Error loading settings', error);
        this.checkLoadingComplete();
      }
    );
  }
  
  // Método para verificar si todas las cargas han terminado
  private checkLoadingComplete(): void {
    // Si todos los datos esenciales están cargados, marcar la carga como completa
    if (
      this.categories.length > 0 &&
      this.products.length > 0
    ) {
      this.isLoading = false;
    }
  }
}