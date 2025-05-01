// src/app/core/services/category.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, delay } from 'rxjs/operators';
import { CookieManagerService } from './cookie-manager.service';

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = environment.apiUrl;

  constructor(
    private httpBase: HttpBaseService,
    private http: HttpClient,
    private cookieManager: CookieManagerService
  ) { }

  // Obtener todas las categorías con reintentos automáticos
  getCategories(): Observable<Category[]> {
    return this.httpBase.get<Category[]>(`${this.apiUrl}/categories`).pipe(
      catchError((error) => {
        console.error('Error al obtener categorías:', error);
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          // Limpiar cookies antes de reintentar
          this.cookieManager.cleanRouteCookies();
          console.log('Reintentando obtener categorías después de limpiar cookies...');
          return of([]).pipe(
            delay(800),
            retry(1)
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  // Obtener una categoría por ID
  getCategory(id: number): Observable<Category> {
    return this.httpBase.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  // Crear categoría (simplificado usando httpBase)
  createCategory(formData: FormData): Observable<Category> {
    return this.httpBase.post<Category>(`${this.apiUrl}/categories`, formData);
  }

  // Actualizar categoría (simplificado usando httpBase)
  updateCategory(id: number, formData: FormData): Observable<Category> {
    formData.append('_method', 'PUT');
    return this.httpBase.post<Category>(`${this.apiUrl}/categories/${id}`, formData);
  }

  // Eliminar categoría (simplificado usando httpBase)
  deleteCategory(id: number): Observable<any> {
    return this.httpBase.delete<any>(`${this.apiUrl}/categories/${id}`);
  }
}