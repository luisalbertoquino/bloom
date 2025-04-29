// src/app/features/store/product-list/product-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductService, Product } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../enviroments/enviroment';
import { ProductQuickViewComponent } from '../product-quick-view/product-quick-view.component';

import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
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
export class ProductListComponent implements OnInit {
  // Todos los productos
  allProducts: Product[] = [];
  // Productos de la página actual
  products: Product[] = [];
  isLoading = true;
  storageUrl = environment.storageUrl;

  // Configuración de paginación
  currentPage = 1;
  pageSize = 10; // Productos por página
  totalPages = 1;

  // Quick View Modal
  showQuickView = false;
  selectedProduct: Product | null = null;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Escuchar cambios en los parámetros de la URL
    this.route.queryParams.subscribe(params => {
      // Obtener la página de los parámetros o usar 1 por defecto
      this.currentPage = parseInt(params['page'] || '1', 10);
      // Cargar los productos
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        if (products && Array.isArray(products)) {
          // Guardar todos los productos filtrados
          this.allProducts = products
            .filter(product => product.available)
            .map(product => ({
              ...product,
              price: Number(product.price) // Convertir a número
            }));
          
          // Calcular total de páginas
          this.totalPages = Math.ceil(this.allProducts.length / this.pageSize);
          
          // Asegurar que la página actual es válida
          if (this.currentPage < 1) this.currentPage = 1;
          if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
          
          // Paginar los productos
          this.paginateProducts();
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading products', error);
        this.isLoading = false;
      }
    });
  }

  // Método para paginar los productos
  paginateProducts(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.products = this.allProducts.slice(startIndex, endIndex);
  }

  // Navegar a una página específica
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return; // No hacer nada si la página no es válida o es la misma
    }
    
    // Actualizar la URL con el nuevo parámetro de página
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge', // Mantener otros parámetros de consulta
    });
  }

  // Ir a la página anterior
  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  // Ir a la página siguiente
  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  // Generar array de páginas para mostrar
  getPages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5; // Máximo de botones de página a mostrar
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
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

  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.storageUrl + path;
  }
}