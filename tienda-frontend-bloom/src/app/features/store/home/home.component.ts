// src/app/features/store/home/home.component.ts
import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, Subscription, timer, interval } from 'rxjs';
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

import { WhatsappButtonComponent } from '../../../shared/components/whatsapp-button/whatsapp-button.component';

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
    ProductCardComponent,
    WhatsappButtonComponent
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

  duplicatedBlogPosts: BlogPost[] = []; // Posts duplicados para el efecto de bucle infinito
  blogSliderPosition = 0; // Posición actual del slider
  blogIsDragging = false; // Indica si se está arrastrando el slider
  blogStartX = 0; // Posición X inicial al arrastrar
  blogCurrentTranslate = 0; // Posición actual al arrastrar
  blogPrevTranslate = 0; // Posición anterior al arrastrar
  blogSliderWidth = 0; // Ancho total del conjunto de posts
  blogAutoResumeTimeout: any = null; // Timeout para reanudar el slider automáticamente
  blogSliderTimer: Subscription | null = null; // Timer para el movimiento automático
  blogSliderSpeed = 0.5; // Velocidad de movimiento del slider
  blogSliderPaused = false; // Indica si el slider está pausado
  
  // Textos atractivos para secciones
  sectionTitles = {
    categories: 'Explora Nuestras Colecciones',
    products: 'Descubre lo Más Deseado',
    blog: 'Inspírate con las Últimas Tendencias'
  };
  
  sectionDescriptions = {
    categories: 'Encuentra el estilo perfecto para cada ocasión en nuestras exclusivas colecciones',
    products: 'Productos mas vendidos y recomendados por nuestros clientes',
    blog: 'Ideas frescas y consejos de estilo para complementar tu look'
  };
  
  // Quick View Modal
  showQuickView = false;
  selectedProduct: Product | null = null;
  
  // Variables para el slider de categorías
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
  
  // Variables para el slider del blog
  currentBlogSlide = 0;
  postsPerSlide = 4; // Número de posts por slide (ajustable según el diseño responsive)
  
  // Para determinar si estamos en el navegador o en SSR
  isBrowser: boolean;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private blogService: BlogService,
    private settingsService: SettingsService,
    private cartService: CartService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.isLoading = true;
    // Cargar datos reales
    this.loadAllData();
    
    // Determinar posts por slide según el tamaño de la pantalla
    if (this.isBrowser) {
      this.updatePostsPerSlide();
      
      // Ajustar la cantidad de posts por slide al cambiar el tamaño de la ventana
      this.document.defaultView?.addEventListener('resize', this.updatePostsPerSlide.bind(this));
    }
  }
  
  ngOnDestroy(): void {
    // Detener los temporizadores cuando se destruye el componente
    if (this.sliderTimer) {
      this.sliderTimer.unsubscribe();
    }
    
    if (this.blogSliderTimer) {
      this.blogSliderTimer.unsubscribe();
    }
    
    // Limpiar cualquier timeout pendiente
    if (this.autoResumeTimeout) {
      clearTimeout(this.autoResumeTimeout);
    }
    
    if (this.blogAutoResumeTimeout) {
      clearTimeout(this.blogAutoResumeTimeout);
    }
    
    // Eliminar el event listener de resize
    if (this.isBrowser) {
      this.document.defaultView?.removeEventListener('resize', this.updatePostsPerSlide.bind(this));
      
      // Eliminar eventos globales que pudieran quedar
      this.document.removeEventListener('mousemove', this.mouseMove.bind(this));
      this.document.removeEventListener('mouseup', this.mouseUp.bind(this));
      this.document.removeEventListener('mousemove', this.blogMouseMove.bind(this));
      this.document.removeEventListener('mouseup', this.blogMouseUp.bind(this));
    }
  }
  
  // Actualizar posts por slide según el tamaño de la pantalla
  @HostListener('window:resize')
  updatePostsPerSlide(): void {
    if (!this.isBrowser) return;
    
    const width = this.document.defaultView?.innerWidth || 1024;
    
    if (width < 640) { // Móvil
      this.postsPerSlide = 1;
    } else if (width < 768) { // Tablet pequeña
      this.postsPerSlide = 2;
    } else if (width < 1024) { // Tablet grande
      this.postsPerSlide = 3;
    } else { // Desktop
      this.postsPerSlide = 4;
    }
  }

  // Iniciar el slider automático de categorías
  startCategorySlider(): void {
    if (!this.isBrowser) return;
    
    // Asegurarnos de tener suficientes categorías para un efecto suave
    // Duplicamos varias veces para tener un conjunto mucho más amplio
    this.duplicatedCategories = [];
    
    // Repetimos las categorías 5 veces para asegurar un efecto infinito real
    for (let i = 0; i < 5; i++) {
      this.duplicatedCategories = [...this.duplicatedCategories, ...this.categories];
    }
    
    // Esperar a que el DOM se actualice para obtener el ancho del slider
    setTimeout(() => {
      // Calcular el ancho total de las categorías originales
      const categoryItems = this.document.querySelectorAll('.category-item');
      if (categoryItems.length > 0) {
        const itemWidth = (categoryItems[0] as HTMLElement).offsetWidth;
        const itemMargin = 32; // 16px por cada lado (mx-4)
        
        // Este es el ancho de un conjunto completo de categorías
        const singleSetWidth = (itemWidth + itemMargin) * this.categories.length;
        
        // Guardamos este valor para usarlo en cálculos posteriores
        this.sliderWidth = singleSetWidth;
        
        // CORRECCIÓN: Asegurarnos de que la posición inicial sea correcta para que se vean los elementos
        this.sliderPosition = 0;
        
        // Iniciar desde una posición donde se vean los elementos
        setTimeout(() => {
          // Ahora sí posicionamos en el segundo conjunto para efecto infinito
          this.sliderPosition = -singleSetWidth;
          
          // Iniciar el timer para el movimiento continuo de categorías
          this.sliderTimer = timer(0, 20).subscribe(() => {
            if (!this.sliderPaused && !this.isDragging) {
              // Mover el slider
              this.sliderPosition -= this.sliderSpeed;
              
              // Verificamos si necesitamos reposicionar para crear el efecto infinito
              this.checkCategoryReposition();
            }
          });
        }, 100);
      }
    }, 500);
  }

  // Método para verificar si necesitamos reposicionar el slider de categorías para efecto infinito
  checkCategoryReposition(): void {
    // Si nos hemos desplazado más allá del segundo conjunto
    if (Math.abs(this.sliderPosition) >= this.sliderWidth * 2) {
      // Calculamos cuánto nos hemos desplazado más allá del umbral
      const overshoot = Math.abs(this.sliderPosition) - (this.sliderWidth * 2);
      
      // Reposicionamos al inicio del primer conjunto + el overshoot
      this.sliderPosition = -this.sliderWidth - overshoot;
    }
    
    // Si nos hemos desplazado hacia atrás (arrastre manual) y estamos antes del primer conjunto
    if (this.sliderPosition > -this.sliderWidth) {
      // Calculamos cuánto nos hemos desplazado hacia atrás
      const undershoot = -this.sliderWidth - this.sliderPosition;
      
      // Reposicionamos al inicio del tercer conjunto - el undershoot
      this.sliderPosition = -(this.sliderWidth * 3) + undershoot;
    }
  }
  
  // Iniciar el slider del blog con efecto infinito
  // Reemplaza el método startBlogSlider con esta implementación que funciona:
  startBlogSlider(): void {
    if (!this.isBrowser || this.featuredPosts.length === 0) {
      console.log('No se puede iniciar el slider: browser no disponible o no hay posts');
      return;
    }
    
    console.log('Iniciando slider con', this.featuredPosts.length, 'posts');
    
    // Método de duplicación que sabemos que funciona (3 veces)
    this.duplicatedBlogPosts = [...this.featuredPosts, ...this.featuredPosts, ...this.featuredPosts];
    
    // Esperar a que el DOM se actualice
    setTimeout(() => {
      const blogSlidesContainer = this.document.querySelector('.blog-slides-container') as HTMLElement;
      if (blogSlidesContainer) {
        // Cálculo simple del ancho que sabemos que funciona
        this.blogSliderWidth = blogSlidesContainer.offsetWidth / 3;
        
        // Iniciar desde una posición donde ya haya un conjunto completo antes
        this.blogSliderPosition = -this.blogSliderWidth;
        
        // Iniciar el timer para el movimiento continuo
        if (this.blogSliderTimer) {
          this.blogSliderTimer.unsubscribe();
        }
        
        this.blogSliderTimer = timer(0, 20).subscribe(() => {
          if (!this.blogSliderPaused && !this.blogIsDragging) {
            // Mover el slider
            this.blogSliderPosition -= this.blogSliderSpeed;
            
            // Cuando hemos desplazado un conjunto completo, volver al inicio
            if (Math.abs(this.blogSliderPosition) >= this.blogSliderWidth * 2) {
              this.blogSliderPosition = -this.blogSliderWidth;
            }
          }
        });
        
        console.log('Slider de blog iniciado correctamente');
      } else {
        console.error('No se pudo encontrar el contenedor de slides del blog');
      }
    }, 500);
  }

  // Método auxiliar para determinar cuántos elementos mostrar según el ancho de pantalla
  getItemsPerView(width: number): number {
    if (width < 640) return 1;  // Móvil
    if (width < 768) return 2;  // Tablet pequeña
    if (width < 1024) return 3; // Tablet grande
    return 4;                   // Desktop
  }

  // Método para verificar si necesitamos reposicionar el slider para crear el efecto infinito
  checkForReposition(): void {
    // Si nos hemos desplazado más allá del segundo conjunto
    if (Math.abs(this.blogSliderPosition) >= this.blogSliderWidth * 2) {
      // Calculamos cuánto nos hemos desplazado más allá del umbral
      const overshoot = Math.abs(this.blogSliderPosition) - (this.blogSliderWidth * 2);
      
      // Reposicionamos al inicio del primer conjunto + el overshoot
      this.blogSliderPosition = -this.blogSliderWidth - overshoot;
    }
    
    // Si nos hemos desplazado hacia atrás (arrastre manual) y estamos antes del primer conjunto
    if (this.blogSliderPosition > -this.blogSliderWidth) {
      // Calculamos cuánto nos hemos desplazado hacia atrás
      const undershoot = -this.blogSliderWidth - this.blogSliderPosition;
      
      // Reposicionamos al inicio del tercer conjunto - el undershoot
      this.blogSliderPosition = -(this.blogSliderWidth * 3) + undershoot;
    }
  }
  
  // Métodos para manejo táctil del slider de blog
  blogTouchStart(event: TouchEvent): void {
    this.pauseBlogSlider();
    this.blogIsDragging = true;
    this.blogStartX = event.touches[0].clientX;
    this.blogPrevTranslate = this.blogSliderPosition;
  }
  
  blogTouchMove(event: TouchEvent): void {
    if (this.blogIsDragging) {
      const currentX = event.touches[0].clientX;
      const diff = currentX - this.blogStartX;
      this.blogCurrentTranslate = this.blogPrevTranslate + diff;
      this.blogSliderPosition = this.blogCurrentTranslate;
    }
  }
  
  blogTouchEnd(): void {
    this.blogIsDragging = false;
    this.blogPrevTranslate = this.blogSliderPosition;
    
    // Reiniciar el movimiento automático después de 3 segundos
    if (this.blogAutoResumeTimeout) {
      clearTimeout(this.blogAutoResumeTimeout);
    }
    
    this.blogAutoResumeTimeout = setTimeout(() => {
      this.blogSliderPaused = false;
      
      // Verificar si necesitamos restablecer la posición para mantener el efecto infinito
      if (this.blogSliderPosition > 0) {
        // Si el usuario ha arrastrado demasiado a la derecha
        this.blogSliderPosition = -this.blogSliderWidth;
      } else if (Math.abs(this.blogSliderPosition) > this.blogSliderWidth * 2) {
        // Si el usuario ha arrastrado demasiado a la izquierda
        this.blogSliderPosition = -this.blogSliderWidth;
      }
    }, 3000);
  }
  
  // Para soporte de mouse en el slider de blog
  blogMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.pauseBlogSlider();
    this.blogIsDragging = true;
    this.blogStartX = event.clientX;
    this.blogPrevTranslate = this.blogSliderPosition;
    
    // Registrar eventos globales para mouse
    if (this.isBrowser) {
      this.document.addEventListener('mousemove', this.blogMouseMove.bind(this));
      this.document.addEventListener('mouseup', this.blogMouseUp.bind(this));
    }
  }
  
  blogMouseMove(event: MouseEvent): void {
    if (this.blogIsDragging) {
      const currentX = event.clientX;
      const diff = currentX - this.blogStartX;
      this.blogCurrentTranslate = this.blogPrevTranslate + diff;
      this.blogSliderPosition = this.blogCurrentTranslate;
    }
  }
  
  blogMouseUp(): void {
    this.blogIsDragging = false;
    this.blogPrevTranslate = this.blogSliderPosition;
    
    // Eliminar eventos globales
    if (this.isBrowser) {
      this.document.removeEventListener('mousemove', this.blogMouseMove.bind(this));
      this.document.removeEventListener('mouseup', this.blogMouseUp.bind(this));
    }
    
    // Reiniciar el movimiento automático después de 3 segundos
    if (this.blogAutoResumeTimeout) {
      clearTimeout(this.blogAutoResumeTimeout);
    }
    
    this.blogAutoResumeTimeout = setTimeout(() => {
      this.blogSliderPaused = false;
      
      // Verificar si necesitamos restablecer la posición
      if (this.blogSliderPosition > 0) {
        // Si el usuario ha arrastrado demasiado a la derecha
        this.blogSliderPosition = -this.blogSliderWidth;
      } else if (Math.abs(this.blogSliderPosition) > this.blogSliderWidth * 2) {
        // Si el usuario ha arrastrado demasiado a la izquierda
        this.blogSliderPosition = -this.blogSliderWidth;
      }
    }, 3000);
  }
    
  // Pausar el slider del blog
  pauseBlogSlider(): void {
    this.blogSliderPaused = true;
  }
  
  // Reanudar el slider del blog
  resumeBlogSlider(): void {
    this.blogSliderPaused = false;
  }
  
  // Ir a la slide anterior del blog
  prevBlogSlide(): void {
    this.pauseBlogSlider(); // Pausar temporalmente al interactuar
    this.currentBlogSlide = (this.currentBlogSlide === 0) 
      ? this.getBlogSlideCount() - 1 
      : this.currentBlogSlide - 1;
      
    // Reanudar después de un tiempo
    setTimeout(() => this.resumeBlogSlider(), 5000);
  }
  
  // Ir a la siguiente slide del blog
  nextBlogSlide(): void {
    this.currentBlogSlide = (this.currentBlogSlide === this.getBlogSlideCount() - 1) 
      ? 0 
      : this.currentBlogSlide + 1;
  }
  
  // Ir a una slide específica del blog
  // Método mejorado para ir a una slide específica 
  goToBlogSlide(index: number): void {
    if (index >= 0 && index < this.featuredPosts.length) {
      this.pauseBlogSlider();
      this.currentBlogSlide = index;
      
      const width = this.document.defaultView?.innerWidth || 1024;
      const itemsPerView = this.getItemsPerView(width);
      
      // Obtenemos una referencia a un elemento individual para calcular su ancho
      const singleItem = this.document.querySelector('.blog-post-item') as HTMLElement;
      if (!singleItem) return;
      
      const itemWidth = singleItem.offsetWidth;
      
      // Calculamos la posición basada en el índice
      // Nos aseguramos de que estemos en el segundo conjunto para mantener el efecto infinito
      this.blogSliderPosition = -this.blogSliderWidth - (index * itemWidth);
      
      // Reanudar después de un tiempo
      setTimeout(() => this.resumeBlogSlider(), 5000);
    }
  }
  
  // Obtener el número total de slides del blog
  getBlogSlideCount(): number {
    if (!this.featuredPosts || this.featuredPosts.length === 0) return 0;
    return Math.ceil(this.featuredPosts.length / this.postsPerSlide);
  }
  
  // Obtener un array con los índices de todas las slides del blog
  getBlogSlideIndexes(): number[] {
    const count = this.getBlogSlideCount();
    return Array.from({ length: count }, (_, i) => i);
  }
  
  // Obtener los posts para una slide específica
  getBlogPostsForSlide(slideIndex: number): BlogPost[] {
    const startIndex = slideIndex * this.postsPerSlide;
    const endIndex = Math.min(startIndex + this.postsPerSlide, this.featuredPosts.length);
    return this.featuredPosts.slice(startIndex, endIndex);
  }

  // Método para pausar el slider de categorías al pasar el ratón (hover)
  pauseSlider(): void {
    this.sliderPaused = true;
    // Limpiar timeout si existía
    if (this.autoResumeTimeout) {
      clearTimeout(this.autoResumeTimeout);
      this.autoResumeTimeout = null;
    }
  }

  // Método para reanudar el slider de categorías al quitar el ratón
  resumeSlider(): void {
    this.sliderPaused = false;
  }
  
  // Métodos para manejo táctil del slider de categorías
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
      
      // Verificar si necesitamos restablecer la posición para mantener el efecto infinito
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
    if (this.isBrowser) {
      this.document.addEventListener('mousemove', this.mouseMove.bind(this));
      this.document.addEventListener('mouseup', this.mouseUp.bind(this));
    }
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
    if (this.isBrowser) {
      this.document.removeEventListener('mousemove', this.mouseMove.bind(this));
      this.document.removeEventListener('mouseup', this.mouseUp.bind(this));
    }
    
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

      // Iniciar el slider de blog directamente aquí si hay posts
      if (this.featuredPosts.length > 0) {
        // Dar tiempo para que el DOM se actualice
        setTimeout(() => {
          this.startBlogSlider();
        }, 100);
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