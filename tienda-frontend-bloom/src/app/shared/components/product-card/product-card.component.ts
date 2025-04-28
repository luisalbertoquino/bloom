import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product: any;
  @Input() storageUrl: string = ''; // Cambiado de imageUrlPrefix a storageUrl
  
  @Output() viewDetails = new EventEmitter<any>();
  @Output() quickView = new EventEmitter<any>();
  @Output() addToCart = new EventEmitter<any>();
  @Output() buyNow = new EventEmitter<any>();
  
  getImageUrl(path: string): string {
    if (!path) return 'assets/images/placeholder.jpg';
    return this.storageUrl ? `${this.storageUrl}${path}` : path;
  }
  
  onViewProductDetails(): void {
    this.viewDetails.emit(this.product);
  }
  
  onQuickView(): void {
    this.quickView.emit(this.product);
  }
  
  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }
  
  onBuyNow(): void {
    this.buyNow.emit(this.product);
  }
}