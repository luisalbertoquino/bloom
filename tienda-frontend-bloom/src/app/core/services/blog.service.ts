// src/app/core/services/blog.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, retry, delay } from 'rxjs/operators';
import { CookieManagerService } from './cookie-manager.service';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  banner_image: string;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = environment.apiUrl;

  constructor(
    private httpBase: HttpBaseService,
    private http: HttpClient,
    private cookieManager: CookieManagerService
  ) { }

  // Obtener todas las entradas de blog con reintentos automáticos
  getPosts(): Observable<BlogPost[]> {
    return this.httpBase.get<BlogPost[]>(`${this.apiUrl}/blog-posts`).pipe(
      catchError((error) => {
        console.error('Error al obtener entradas de blog:', error);
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          // Limpiar cookies antes de reintentar
          this.cookieManager.cleanRouteCookies();
          console.log('Reintentando obtener entradas de blog después de limpiar cookies...');
          return of([]).pipe(
            delay(800),
            retry(1)
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  // Obtener entradas destacadas
  getFeaturedPosts(): Observable<BlogPost[]> {
    return this.httpBase.get<BlogPost[]>(`${this.apiUrl}/blog-posts/featured`);
  }

  // Obtener una entrada por ID
  getPost(id: number): Observable<BlogPost> {
    return this.httpBase.get<BlogPost>(`${this.apiUrl}/blog-posts/${id}`);
  }

  // Crear entrada (simplificado usando httpBase)
  createPost(formData: FormData): Observable<BlogPost> {
    return this.httpBase.post<BlogPost>(`${this.apiUrl}/blog-posts`, formData);
  }

  // Actualizar entrada (simplificado usando httpBase)
  updatePost(id: number, formData: FormData): Observable<BlogPost> {
    formData.append('_method', 'PUT');
    return this.httpBase.post<BlogPost>(`${this.apiUrl}/blog-posts/${id}`, formData);
  }

  // Eliminar entrada (simplificado usando httpBase)
  deletePost(id: number): Observable<any> {
    return this.httpBase.delete<any>(`${this.apiUrl}/blog-posts/${id}`);
  }
}