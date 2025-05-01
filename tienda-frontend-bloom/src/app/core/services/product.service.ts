// src/app/core/services/product.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  main_image: string;
  available: boolean;
  stock: number;
  created_at: string; // Añadido
  updated_at: string; // Añadido
  category?: any;
  images?: any[];
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(
    private httpBase: HttpBaseService,
    private http: HttpClient
  ) { }

  // Obtener todos los productos
  getProducts(): Observable<Product[]> {
    return this.httpBase.get<Product[]>(`${this.apiUrl}/products`);
  }

  // Obtener un producto por ID
  getProduct(id: number): Observable<Product> {
    return this.httpBase.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  // Obtener productos por categoría
  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.httpBase.get<Product[]>(`${this.apiUrl}/categories/${categoryId}/products`);
  }

  // Solo para administradores
  createProduct(productData: FormData): Observable<Product> {
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.post<Product>(`${this.apiUrl}/products`, productData, {
      headers: headers,
      withCredentials: true
    });
  }

  updateProduct(id: number, productData: FormData): Observable<Product> {
    // Simulando PUT con POST para mejor compatibilidad con FormData en Laravel
    productData.append('_method', 'PUT');
    
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.post<Product>(`${this.apiUrl}/products/${id}`, productData, {
      headers: headers,
      withCredentials: true
    });
  }

  deleteProduct(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`, {
      headers: headers,
      withCredentials: true
    });
  }

  toggleAvailability(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.patch<any>(`${this.apiUrl}/products/${id}/toggle-availability`, {}, {
      headers: headers,
      withCredentials: true
    });
  }

  // Obtener productos relacionados (puede ser por misma categoría o por etiquetas si las hay)
  getRelatedProducts(productId: number, limit: number = 4): Observable<Product[]> {
    return this.httpBase.get<Product[]>(`${this.apiUrl}/products/${productId}/related?limit=${limit}`);
  }

  // Buscar productos
  searchProducts(query: string): Observable<Product[]> {
    return this.httpBase.get<Product[]>(`${this.apiUrl}/products/search?q=${query}`);
  }

  // Obtener productos destacados
  getFeaturedProducts(limit: number = 8): Observable<Product[]> {
    return this.httpBase.get<Product[]>(`${this.apiUrl}/products/featured?limit=${limit}`);
  }

  // Eliminar una imagen adicional específica del producto
  deleteProductImage(imageId: number): Observable<any> {
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.delete<any>(`${this.apiUrl}/product-images/${imageId}`, {
      headers: headers,
      withCredentials: true
    });
  }

  private getTokenFromCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  }
}