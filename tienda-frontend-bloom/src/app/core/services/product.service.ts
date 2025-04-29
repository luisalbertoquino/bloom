// src/app/core/services/product.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../enviroments/enviroment';
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
  category?: any;
  images?: any[];
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