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

import { Router } from '@angular/router';

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
  products: Product[] = [];
  isLoading = true;
  storageUrl = environment.storageUrl;

  // Quick View Modal
  showQuickView = false;
  selectedProduct: Product | null = null;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        if (products && Array.isArray(products)) {
          this.products = products
            .filter(product => product.available)
            .map(product => ({
              ...product,
              price: Number(product.price) // Convertir a número
            }));
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading products', error);
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