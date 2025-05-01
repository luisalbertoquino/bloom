// src/app/features/store/product-category/product-category.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { CategoryService, Category } from '../../../core/services/category.service';
import { ProductService, Product } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';
import { ProductQuickViewComponent } from '../product-quick-view/product-quick-view.component';

import { Router } from '@angular/router';

@Component({
  selector: 'app-product-category',
  templateUrl: './product-category.component.html',
  styleUrls: ['./product-category.component.scss'],
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

export class ProductCategoryComponent implements OnInit {
  products: Product[] = [];
  category: Category | null = null;
  isLoading = true;
  errorMessage = '';
  storageUrl = environment.storageUrl;

  // Quick View Modal
  showQuickView = false;
  selectedProduct: Product | null = null;

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Suscribirse a los cambios de los parámetros de la ruta
    this.route.paramMap.subscribe(params => {
      const categoryId = params.get('id');
      if (categoryId) {
        this.loadCategory(Number(categoryId));
      } else {
        this.errorMessage = 'Categoría no encontrada';
        this.isLoading = false;
      }
    });
  }
 
  loadCategory(categoryId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Cargar los detalles de la categoría
    this.categoryService.getCategory(categoryId).subscribe({
      next: (category: Category) => {
        this.category = category;
        this.loadProductsByCategory(categoryId);
      },
      error: (error: any) => {
        console.error('Error loading category', error);
        this.errorMessage = 'Error al cargar la categoría. Por favor, intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }

  loadProductsByCategory(categoryId: number): void {
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        if (products && Array.isArray(products)) {
          this.products = products
            .filter(product => product.category_id === categoryId && product.available)
            .map(product => ({
              ...product,
              price: Number(product.price) // Convertir a número
            }));
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading products', error);
        this.errorMessage = 'Error al cargar los productos. Por favor, intenta de nuevo.';
        this.isLoading = false;
      }
    });
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