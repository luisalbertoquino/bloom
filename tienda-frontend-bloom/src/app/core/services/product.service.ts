// src/app/core/services/product.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../enviroments/enviroment';

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

  constructor(private httpBase: HttpBaseService) { }

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
    return this.httpBase.post<Product>(`${this.apiUrl}/products`, productData);
  }

  updateProduct(id: number, productData: FormData): Observable<Product> {
    return this.httpBase.put<Product>(`${this.apiUrl}/products/${id}`, productData);
  }

  deleteProduct(id: number): Observable<any> {
    return this.httpBase.delete<any>(`${this.apiUrl}/products/${id}`);
  }

  toggleAvailability(id: number): Observable<any> {
    // Nota: Necesitamos añadir método patch a HttpBaseService o usar post como alternativa
    return this.httpBase.post<any>(`${this.apiUrl}/products/${id}/toggle-availability`, {});
  }
}