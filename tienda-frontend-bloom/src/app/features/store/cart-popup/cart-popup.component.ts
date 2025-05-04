// src/app/features/store/cart-popup/cart-popup.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-cart-popup',
  templateUrl: './cart-popup.component.html',
  styleUrls: ['./cart-popup.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CartPopupComponent implements OnInit {
  @Input() isVisible = false;
  @Output() closeCart = new EventEmitter<void>();
  
  cartItems: CartItem[] = [];
  totalPrice = 0;
  apiUrl = environment.storageUrl; // Base URL para imágenes
  
  constructor(private cartService: CartService) { }
  
  ngOnInit(): void {
    // Suscribirnos a los cambios en el carrito
    this.cartService.cart.subscribe(items => {
      this.cartItems = items;
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }
  
  close(): void {
    this.closeCart.emit();
  }
  
  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.apiUrl + path;
  }
  
  increaseQuantity(productId: number): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
    }
  }
  
  decreaseQuantity(productId: number): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item && item.quantity > 1) {
      this.cartService.updateQuantity(productId, item.quantity - 1);
    } else if (item) {
      this.cartService.removeFromCart(productId);
    }
  }
  
  removeItem(productId: number): void {
    this.cartService.removeFromCart(productId);
  }
  
  clearCart(): void {
    this.cartService.clearCart();
  }
  
  sendToWhatsApp(): void {
    this.cartService.sendToWhatsApp();
    this.close();
  }
}