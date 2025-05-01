import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router'; // Importar Router
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ProductService, Product } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/enviroment';


@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NavbarComponent,
    FooterComponent
  ]
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  isLoading = true;
  errorMessage = '';
  quantity = 1;
  storageUrl = environment.storageUrl;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router, // Inyectar Router aquí
    private productService: ProductService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.loadProduct();
  }

  loadProduct(): void {
    this.isLoading = true;
    
    // Obtener el ID del producto de la URL
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.errorMessage = 'Producto no encontrado';
      this.isLoading = false;
      return;
    }
    
    // Cargar los detalles del producto
    this.productService.getProduct(Number(id)).subscribe({
      next: (product: Product) => {
        this.product = {
          ...product,
          price: Number(product.price) // Asegurarse que el precio sea un número
        };
        this.isLoading = false;
        
        // Cargar productos relacionados (de la misma categoría)
        this.loadRelatedProducts(product.category_id);
      },
      error: (error: any) => {
        console.error('Error loading product', error);
        this.errorMessage = 'Error al cargar el producto. Por favor, intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }

  loadRelatedProducts(categoryId: number): void {
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        if (products && Array.isArray(products)) {
          this.relatedProducts = products
            .filter(p => p.category_id === categoryId && p.id !== this.product?.id && p.available)
            .slice(0, 4)
            .map(p => ({
              ...p,
              price: Number(p.price)
            }));
        }
      },
      error: (error: any) => {
        console.error('Error loading related products', error);
      }
    });
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
    }
  }

  buyNow(): void {
    if (this.product) {
      // Agregar al carrito con la cantidad especificada
      for (let i = 0; i < this.quantity; i++) {
        this.cartService.addToCart(this.product);
      }
      
      // Redireccionar a WhatsApp
      this.cartService.sendToWhatsApp();

      // Navegar a otra página después de comprar (opcional)
      // Por ejemplo, redirigir a la página del carrito
      this.router.navigate(['/carrito']);
    }
  }

  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.storageUrl + path;
  }
}
