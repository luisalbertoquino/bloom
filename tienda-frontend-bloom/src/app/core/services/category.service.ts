// src/app/core/services/category.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
    private http: HttpClient  // Añadir esta línea
  ) { }

  // Obtener todas las categorías
  getCategories(): Observable<Category[]> {
    return this.httpBase.get<Category[]>(`${this.apiUrl}/categories`);
  }

  // Obtener una categoría por ID
  getCategory(id: number): Observable<Category> {
    return this.httpBase.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  // Solo para administradores
  createCategory(formData: FormData, categoryId?: number): Observable<Category> {
    const url = categoryId 
      ? `${this.apiUrl}/categories/${categoryId}` 
      : `${this.apiUrl}/categories`;
    
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.post<Category>(url, formData, { 
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

  // Actualizar categoría usando el nuevo método
  updateCategory(id: number, formData: FormData): Observable<Category> {
    // Simulando PUT con POST para mejor compatibilidad con FormData en Laravel
    formData.append('_method', 'PUT');
    
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.post<Category>(`${this.apiUrl}/categories/${id}`, formData, {
      headers: headers,
      withCredentials: true
    });
  }

  deleteCategory(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.delete<any>(`${this.apiUrl}/categories/${id}`, {
      headers: headers,
      withCredentials: true
    });
  }
}