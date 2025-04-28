// src/app/core/services/cart.service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from './product.service';
import { SettingsService } from './settings.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError } from 'rxjs/operators';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  public cart = this.cartSubject.asObservable();

  constructor(private settingsService: SettingsService) {
    // Cargar el carrito desde localStorage si existe y estamos en el navegador
    if (this.isBrowser) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          this.cartItems = JSON.parse(savedCart);
          this.cartSubject.next(this.cartItems);
        } catch (error) {
          console.error('Error parsing cart data from localStorage', error);
          // En caso de error, inicializar con carrito vacío
          localStorage.removeItem('cart');
        }
      }
    }
  }

  // Añadir producto al carrito
  addToCart(product: Product, quantity: number = 1): void {
    const existingItem = this.cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cartItems.push({ product, quantity });
    }
    
    this.updateCart();
  }

  // Eliminar producto del carrito
  removeFromCart(productId: number): void {
    this.cartItems = this.cartItems.filter(item => item.product.id !== productId);
    this.updateCart();
  }

  // Actualizar cantidad de un producto
  updateQuantity(productId: number, quantity: number): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item) {
      item.quantity = quantity;
      this.updateCart();
    }
  }

  // Vaciar carrito
  clearCart(): void {
    this.cartItems = [];
    this.updateCart();
  }

  // Obtener total de productos en el carrito
  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  // Obtener total del carrito
  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  private updateCart(): void {
    this.cartSubject.next([...this.cartItems]);
    if (this.isBrowser) {
      try {
        localStorage.setItem('cart', JSON.stringify(this.cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage', error);
      }
    }
  }
  
  // Enviar carrito a WhatsApp
  sendToWhatsApp(): void {
    if (!this.isBrowser) return; // No hacer nada en el servidor
    
    this.settingsService.getSetting('whatsapp_number').pipe(
      catchError(error => {
        console.error('Error obteniendo el número de WhatsApp', error);
        alert('No se pudo obtener el número de WhatsApp. Intenta de nuevo más tarde.');
        throw error;
      })
    ).subscribe(setting => {
      if (!setting || !setting.value) {
        console.error('No se encontró el número de WhatsApp en la configuración');
        alert('No se encontró un número de WhatsApp para enviar el pedido.');
        return;
      }
      
      const phoneNumber = setting.value;
      let message = 'Hola, me gustaría ordenar los siguientes productos:\n\n';
      
      this.cartItems.forEach(item => {
        message += `- ${item.product.name} (${item.quantity}) a $${item.product.price} c/u\n`;
      });
      
      message += `\nTotal: $${this.getTotalPrice().toFixed(2)}`;
      
      // Codificar el mensaje para URL
      const encodedMessage = encodeURIComponent(message);
      
      // Crear URL de WhatsApp
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      // Abrir WhatsApp en nueva pestaña
      window.open(whatsappUrl, '_blank');
    });
  }
}