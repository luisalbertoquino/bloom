// src/app/features/store/home/home.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, Subscription, timer } from 'rxjs';
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
export class HomeComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  duplicatedCategories: Category[] = []; // Categorías duplicadas para el efecto de bucle
  products: Product[] = [];
  featuredPosts: BlogPost[] = [];
  bannerUrl = '/assets/images/banner.jpg';
  isLoading = true;
  storageUrl = environment.storageUrl;
  
  // Quick View Modal
  showQuickView = false;
  selectedProduct: Product | null = null;
  
  // Variables para el slider
  sliderTimer: Subscription | null = null;
  sliderPosition = 0;
  sliderPaused = false;
  sliderSpeed = 1.5; // Pixeles a mover por cada tick
  sliderWidth = 0; // Ancho total del conjunto de categorías originales
  
  // Variables para el manejo de gestos táctiles
  isDragging = false;
  startX = 0;
  currentTranslate = 0;
  prevTranslate = 0;
  autoResumeTimeout: any = null;

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
  
  ngOnDestroy(): void {
    // Detener el temporizador del slider cuando se destruye el componente
    if (this.sliderTimer) {
      this.sliderTimer.unsubscribe();
    }
    
    // Limpiar cualquier timeout pendiente
    if (this.autoResumeTimeout) {
      clearTimeout(this.autoResumeTimeout);
    }
  }

  // Iniciar el slider automático
  startCategorySlider(): void {
    // Duplicar las categorías para el efecto de bucle continuo
    // Duplicamos tres veces para asegurar un desplazamiento largo sin problemas
    this.duplicatedCategories = [...this.categories, ...this.categories, ...this.categories];
    
    // Esperar a que el DOM se actualice para obtener el ancho del slider
    setTimeout(() => {
      // Calcular el ancho total de las categorías originales
      const categoryItems = document.querySelectorAll('.category-item');
      if (categoryItems.length > 0) {
        const itemWidth = categoryItems[0].clientWidth;
        const itemMargin = 32; // 16px por cada lado (mx-4)
        this.sliderWidth = (itemWidth + itemMargin) * this.categories.length;
        
        // Iniciar el slider desde una posición donde ya haya un conjunto completo antes
        // Esto permite que cuando se reinicie, ya tengamos elementos antes y después
        this.sliderPosition = -this.sliderWidth;
      }
      
      // Iniciar el timer para el movimiento continuo
      this.sliderTimer = timer(0, 20).subscribe(() => {
        if (!this.sliderPaused && !this.isDragging) {
          // Mover el slider
          this.sliderPosition -= this.sliderSpeed;
          
          // Cuando hemos desplazado dos conjuntos completos, volver al inicio
          if (Math.abs(this.sliderPosition) >= this.sliderWidth * 2) {
            this.sliderPosition = -this.sliderWidth;
          }
        }
      });
    }, 500);
  }

  // Método para pausar el slider al pasar el ratón (hover)
  pauseSlider(): void {
    this.sliderPaused = true;
    // Limpiar timeout si existía
    if (this.autoResumeTimeout) {
      clearTimeout(this.autoResumeTimeout);
      this.autoResumeTimeout = null;
    }
  }

  // Método para reanudar el slider al quitar el ratón
  resumeSlider(): void {
    this.sliderPaused = false;
  }
  
  // Métodos para manejo táctil
  touchStart(event: TouchEvent): void {
    this.pauseSlider();
    this.isDragging = true;
    this.startX = event.touches[0].clientX;
    this.prevTranslate = this.sliderPosition;
    
    // Evitar que el slider se mueva automáticamente durante el arrastre
    if (this.sliderTimer) {
      this.sliderPaused = true;
    }
  }
  
  touchMove(event: TouchEvent): void {
    if (this.isDragging) {
      const currentX = event.touches[0].clientX;
      const diff = currentX - this.startX;
      this.currentTranslate = this.prevTranslate + diff;
      this.sliderPosition = this.currentTranslate;
    }
  }
  
  touchEnd(): void {
    this.isDragging = false;
    this.prevTranslate = this.sliderPosition;
    
    // Reiniciar el movimiento automático después de 1 segundo
    if (this.autoResumeTimeout) {
      clearTimeout(this.autoResumeTimeout);
    }
    
    this.autoResumeTimeout = setTimeout(() => {
      this.sliderPaused = false;
      
      // Verificar si necesitamos restablecer la posición
      // Si se ha movido demasiado hacia la derecha o izquierda, reposicionamos
      if (this.sliderPosition > 0) {
        // Si el usuario ha arrastrado demasiado a la derecha
        this.sliderPosition = -this.sliderWidth;
      } else if (Math.abs(this.sliderPosition) > this.sliderWidth * 2) {
        // Si el usuario ha arrastrado demasiado a la izquierda
        this.sliderPosition = -this.sliderWidth;
      }
    }, 1000);
  }
  
  // Para soporte de mouse y touch en dispositivos híbridos (PC con pantalla táctil)
  mouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.pauseSlider();
    this.isDragging = true;
    this.startX = event.clientX;
    this.prevTranslate = this.sliderPosition;
    
    // Registrar eventos globales para mouse
    document.addEventListener('mousemove', this.mouseMove.bind(this));
    document.addEventListener('mouseup', this.mouseUp.bind(this));
  }
  
  mouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const currentX = event.clientX;
      const diff = currentX - this.startX;
      this.currentTranslate = this.prevTranslate + diff;
      this.sliderPosition = this.currentTranslate;
    }
  }
  
  mouseUp(): void {
    this.isDragging = false;
    this.prevTranslate = this.sliderPosition;
    
    // Eliminar eventos globales
    document.removeEventListener('mousemove', this.mouseMove.bind(this));
    document.removeEventListener('mouseup', this.mouseUp.bind(this));
    
    // Reiniciar el movimiento automático después de 1 segundo
    if (this.autoResumeTimeout) {
      clearTimeout(this.autoResumeTimeout);
    }
    
    this.autoResumeTimeout = setTimeout(() => {
      this.sliderPaused = false;
      
      // Verificar si necesitamos restablecer la posición
      if (this.sliderPosition > 0) {
        // Si el usuario ha arrastrado demasiado a la derecha
        this.sliderPosition = -this.sliderWidth;
      } else if (Math.abs(this.sliderPosition) > this.sliderWidth * 2) {
        // Si el usuario ha arrastrado demasiado a la izquierda
        this.sliderPosition = -this.sliderWidth;
      }
    }, 1000);
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
        
        // Si hay pocas categorías, duplicarlas para tener suficientes para un buen efecto
        if (this.categories.length < 6 && this.categories.length > 0) {
          const originalLength = this.categories.length;
          const duplications = Math.ceil(6 / originalLength);
          
          let expandedCategories = [...this.categories];
          for (let i = 0; i < duplications - 1; i++) {
            expandedCategories = [...expandedCategories, ...this.categories];
          }
          this.categories = expandedCategories;
        }
        
        // Iniciar el slider
        this.startCategorySlider();
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