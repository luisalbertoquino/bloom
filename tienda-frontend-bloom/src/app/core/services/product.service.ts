// src/app/core/services/product.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError, of, timer } from 'rxjs';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, delay, switchMap } from 'rxjs/operators';

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
  created_at: string;
  updated_at: string;
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

  private getTokenFromCookie(): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const parts = cookie.trim().split('=');
        if (parts.length > 1 && parts[0] === 'XSRF-TOKEN') {
          return decodeURIComponent(parts[1]);
        }
      }
    } catch (e) {
      console.warn('Error al obtener token CSRF:', e);
    }
    return null;
  }

  private createHeaders(): HttpHeaders {
    const token = this.getTokenFromCookie();
    return new HttpHeaders({
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      ...(token ? { 'X-XSRF-TOKEN': token } : {})
    });
  }

  // Función helper para reintentar peticiones automáticamente
  private requestWithRetry<T>(requestFn: () => Observable<T>, maxRetries = 2): Observable<T> {
    return requestFn().pipe(
      catchError(error => {
        if (maxRetries > 0) {
          console.log(`Reintentando... ${maxRetries} intentos restantes`);
          // Esperar y luego ejecutar la misma función con menos reintentos
          return of(null).pipe(
            delay(800),
            switchMap(() => this.requestWithRetry(requestFn, maxRetries - 1))
          );
        }
        return throwError(() => error);
      })
    );
  }

  // Obtener todos los productos con reintentos automáticos
  getProducts(): Observable<Product[]> {
    return this.httpBase.get<Product[]>(`${this.apiUrl}/products`).pipe(
      catchError((error) => {
        console.error('Error al obtener productos:', error);
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          console.log('Error de conexión. Reintentando obtener productos después de un retraso...');
          return this.requestWithRetry<Product[]>(() => 
            this.httpBase.get<Product[]>(`${this.apiUrl}/products`)
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  // Obtener un producto por ID
  getProduct(id: number): Observable<Product> {
    return this.httpBase.get<Product>(`${this.apiUrl}/products/${id}`).pipe(
      catchError((error) => {
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          return this.requestWithRetry<Product>(() => 
            this.httpBase.get<Product>(`${this.apiUrl}/products/${id}`)
          );
        }
        return throwError(() => error);
      })
    );
  }

  // Obtener productos por categoría
  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.httpBase.get<Product[]>(`${this.apiUrl}/categories/${categoryId}/products`).pipe(
      catchError((error) => {
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          return this.requestWithRetry<Product[]>(() => 
            this.httpBase.get<Product[]>(`${this.apiUrl}/categories/${categoryId}/products`)
          );
        }
        return throwError(() => error);
      })
    );
  }

  // Solo para administradores
  createProduct(productData: FormData): Observable<Product> {
    const headers = this.createHeaders();
    
    return this.http.post<Product>(`${this.apiUrl}/products`, productData, {
      headers: headers,
      withCredentials: true
    }).pipe(
      catchError((error) => {
        console.error('Error al crear producto:', error);
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          console.log('Error de conexión. Reintentando...');
          return this.requestWithRetry<Product>(() => 
            this.http.post<Product>(`${this.apiUrl}/products`, productData, {
              headers: this.createHeaders(), // Obtener tokens frescos en cada reintento
              withCredentials: true
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  updateProduct(id: number, productData: FormData): Observable<Product> {
    // Simulando PUT con POST para mejor compatibilidad con FormData en Laravel
    productData.append('_method', 'PUT');
    
    const headers = this.createHeaders();
    
    return this.http.post<Product>(`${this.apiUrl}/products/${id}`, productData, {
      headers: headers,
      withCredentials: true
    }).pipe(
      catchError((error) => {
        console.error('Error al actualizar producto:', error);
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          console.log('Error de conexión. Reintentando...');
          
          // Crear una copia de FormData para el reintento (no podemos reutilizar el original)
          const newFormData = new FormData();
          // Copiar todos los valores (excepto _method que añadiremos después)
          for (const pair of (productData as any).entries()) {
            if (pair[0] !== '_method') {
              newFormData.append(pair[0], pair[1]);
            }
          }
          // Añadir _method nuevamente
          newFormData.append('_method', 'PUT');
          
          return this.requestWithRetry<Product>(() => 
            this.http.post<Product>(`${this.apiUrl}/products/${id}`, newFormData, {
              headers: this.createHeaders(),
              withCredentials: true
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  deleteProduct(id: number): Observable<any> {
    const headers = this.createHeaders();
    
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`, {
      headers: headers,
      withCredentials: true
    }).pipe(
      catchError((error) => {
        console.error('Error al eliminar producto:', error);
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          console.log('Error de conexión. Reintentando...');
          return this.requestWithRetry<any>(() => 
            this.http.delete<any>(`${this.apiUrl}/products/${id}`, {
              headers: this.createHeaders(),
              withCredentials: true
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  toggleAvailability(id: number): Observable<any> {
    const headers = this.createHeaders();
    
    return this.http.patch<any>(`${this.apiUrl}/products/${id}/toggle-availability`, {}, {
      headers: headers,
      withCredentials: true
    }).pipe(
      catchError((error) => {
        console.error('Error al cambiar disponibilidad:', error);
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          console.log('Error de conexión. Reintentando...');
          return this.requestWithRetry<any>(() => 
            this.http.patch<any>(`${this.apiUrl}/products/${id}/toggle-availability`, {}, {
              headers: this.createHeaders(),
              withCredentials: true
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  // Obtener productos relacionados
  getRelatedProducts(productId: number, limit: number = 4): Observable<Product[]> {
    return this.httpBase.get<Product[]>(`${this.apiUrl}/products/${productId}/related?limit=${limit}`).pipe(
      catchError((error) => {
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          return this.requestWithRetry<Product[]>(() => 
            this.httpBase.get<Product[]>(`${this.apiUrl}/products/${productId}/related?limit=${limit}`)
          );
        }
        return throwError(() => error);
      })
    );
  }

  // Buscar productos
  searchProducts(query: string): Observable<Product[]> {
    return this.httpBase.get<Product[]>(`${this.apiUrl}/products/search?q=${query}`).pipe(
      catchError((error) => {
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          return this.requestWithRetry<Product[]>(() => 
            this.httpBase.get<Product[]>(`${this.apiUrl}/products/search?q=${query}`)
          );
        }
        return throwError(() => error);
      })
    );
  }

  // Obtener productos destacados
  getFeaturedProducts(limit: number = 8): Observable<Product[]> {
    return this.httpBase.get<Product[]>(`${this.apiUrl}/products/featured?limit=${limit}`).pipe(
      catchError((error) => {
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          return this.requestWithRetry<Product[]>(() => 
            this.httpBase.get<Product[]>(`${this.apiUrl}/products/featured?limit=${limit}`)
          );
        }
        return throwError(() => error);
      })
    );
  }

  // Eliminar una imagen adicional específica del producto
  deleteProductImage(imageId: number): Observable<any> {
    const headers = this.createHeaders();
    
    return this.http.delete<any>(`${this.apiUrl}/product-images/${imageId}`, {
      headers: headers,
      withCredentials: true
    }).pipe(
      catchError((error) => {
        console.error('Error al eliminar imagen:', error);
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          console.log('Error de conexión. Reintentando...');
          return this.requestWithRetry<any>(() => 
            this.http.delete<any>(`${this.apiUrl}/product-images/${imageId}`, {
              headers: this.createHeaders(),
              withCredentials: true
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }
}