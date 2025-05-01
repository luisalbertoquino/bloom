// src/app/features/store/product-quick-view/product-quick-view.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Product } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-quick-view',
  templateUrl: './product-quick-view.component.html',
  styleUrls: ['./product-quick-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class ProductQuickViewComponent implements OnInit {
  @Input() product: Product | null = null;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  
  quantity = 1;
  storageUrl = environment.storageUrl;

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Reset quantity when the modal opens
    this.quantity = 1;
  }

  increaseQuantity(): void {
    if (this.quantity < 10) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      // Agregar al carrito con la cantidad especificada
      for (let i = 0; i < this.quantity; i++) {
        this.cartService.addToCart(this.product);
      }
      this.closeModal();
    }
  }

  buyNow(): void {
    if (this.product) {
      // Agregar al carrito con la cantidad especificada
      for (let i = 0; i < this.quantity; i++) {
        this.cartService.addToCart(this.product);
      }
      
      // Cerrar el modal
      this.closeModal();
      
      // Redireccionar a WhatsApp
      this.cartService.sendToWhatsApp();
    }
  }

  viewProductDetails(): void {
    if (this.product) {
      this.closeModal();
      this.router.navigate(['/productos', this.product.id]);
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.storageUrl + path;
  }

  // Prevenir que los clics dentro del modal se propaguen al fondo
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}