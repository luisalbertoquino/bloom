// src/app/features/store/product-list/product-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductService, Product } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';
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
    FormsModule,
    NavbarComponent,
    FooterComponent,
    ProductQuickViewComponent,
    ProductCardComponent
  ]
}) 
export class ProductListComponent implements OnInit {
  // Todos los productos (sin filtrar)
  allProducts: Product[] = [];
  // Productos filtrados por búsqueda
  filteredProducts: Product[] = [];
  // Productos de la página actual
  products: Product[] = [];
  isLoading = true;
  storageUrl = environment.storageUrl;

  // Términos de búsqueda
  searchTerm = '';

  // Opción de ordenación
  sortOption = 'newest'; // Valor por defecto

  // Configuración de paginación
  currentPage = 1;
  pageSize = 12; // Productos por página
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
      
      // Obtener el término de búsqueda si existe
      const searchParam = params['search'] || '';
      if (searchParam !== this.searchTerm) {
        this.searchTerm = searchParam;
      }
      
      // Obtener la opción de ordenación si existe
      const sortParam = params['sort'] || 'newest';
      if (sortParam !== this.sortOption) {
        this.sortOption = sortParam;
      }
      
      // Cargar los productos
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        if (products && Array.isArray(products)) {
          // Guardar todos los productos disponibles
          this.allProducts = products
            .filter(product => product.available)
            .map(product => ({
              ...product,
              price: Number(product.price) // Convertir a número
            }));
          
          // Aplicar filtro de búsqueda si hay un término
          this.applySearchFilter();
          
          // Aplicar ordenación
          this.applySorting();
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading products', error);
        this.isLoading = false;
      }
    });
  }

  // Aplicar filtro de búsqueda a los productos
  applySearchFilter(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredProducts = this.allProducts.filter(product => 
        product.name.toLowerCase().includes(term) || 
        (product.description && product.description.toLowerCase().includes(term))
      );
    } else {
      this.filteredProducts = [...this.allProducts];
    }
    
    // Recalcular la paginación después de filtrar
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    
    // Asegurar que la página actual es válida después del filtrado
    if (this.currentPage < 1) this.currentPage = 1;
    if (this.totalPages === 0) this.totalPages = 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
  }

  // Aplicar ordenación a los productos filtrados
  applySorting(): void {
    // Clonar el array para no modificar el original directamente
    const products = [...this.filteredProducts];

    // Ordenar según la opción seleccionada
    switch (this.sortOption) {
      case 'newest':
        // Ordenar por fecha de creación (de más reciente a más antiguo)
        products.sort((a, b) => {
          // Asegurarse de que created_at existe antes de usarlo
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
      
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      
      case 'name-asc':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      
      case 'name-desc':
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      
      default:
        // Por defecto, no ordenar
        break;
    }

    this.filteredProducts = products;
    
    // Actualizar la URL con la opción de ordenación
    this.updateUrlParams();
    
    // Paginar los productos ordenados
    this.paginateProducts();
  }

  // Actualizar parámetros de URL
  updateUrlParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort: this.sortOption
      },
      queryParamsHandling: 'merge' // Mantener otros parámetros
    });
  }

  // Método para iniciar una búsqueda
  onSearch(): void {
    // Actualizar la URL con el nuevo término de búsqueda y volver a la página 1
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        search: this.searchTerm,
        page: 1 // Resetear a la primera página en nueva búsqueda
      },
      queryParamsHandling: 'merge' // Mantener otros parámetros
    });
  }

  // Método para limpiar la búsqueda
  clearSearch(): void {
    if (this.searchTerm) {
      this.searchTerm = '';
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { 
          search: null, // Eliminar parámetro search
          page: 1 // Volver a la primera página
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  // Método para paginar los productos
  paginateProducts(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.products = this.filteredProducts.slice(startIndex, endIndex);
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