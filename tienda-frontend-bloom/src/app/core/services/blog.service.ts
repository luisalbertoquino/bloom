// src/app/core/services/blog.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  private readonly PUBLIC_ENDPOINTS = [
    `${this.apiUrl}/blog-posts`,
    `${this.apiUrl}/blog-posts/featured`,
    `${this.apiUrl}/blog-posts/\\d+` // Para rutas como /blog-posts/1
  ];

  constructor(
    private http: HttpClient,
    private cookieManager: CookieManagerService
  ) { }

  // ==================== MÉTODOS PÚBLICOS (GET) ====================
  getPosts(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(`${this.apiUrl}/blog-posts`, {
      headers: this.getPublicHeaders(),
      withCredentials: false // Importante: no enviar cookies en GET públicos
    });
  }

  getFeaturedPosts(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(`${this.apiUrl}/blog-posts/featured`, {
      headers: this.getPublicHeaders(),
      withCredentials: false
    });
  }

  getPost(id: number): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.apiUrl}/blog-posts/${id}`, {
      headers: this.getPublicHeaders(),
      withCredentials: false
    });
  }

  // ==================== MÉTODOS ADMINISTRATIVOS (CRUD) ====================
  createPost(postData: FormData): Observable<BlogPost> {
    this.cookieManager.cleanNonEssentialCookies();
    return this.http.post<BlogPost>(`${this.apiUrl}/blog-posts`, postData, {
      headers: this.getAdminHeaders(),
      withCredentials: true // Solo necesario para operaciones que requieren autenticación
    });
  }

  updatePost(id: number, postData: FormData): Observable<BlogPost> {
    this.cookieManager.cleanNonEssentialCookies();
    postData.append('_method', 'PUT');
    return this.http.post<BlogPost>(`${this.apiUrl}/blog-posts/${id}`, postData, {
      headers: this.getAdminHeaders(),
      withCredentials: true
    });
  }

  deletePost(id: number): Observable<any> {
    this.cookieManager.cleanNonEssentialCookies();
    return this.http.delete<any>(`${this.apiUrl}/blog-posts/${id}`, {
      headers: this.getAdminHeaders(),
      withCredentials: true
    });
  }

  // ==================== HELPERS ====================
  private getPublicHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });
  }

  private getAdminHeaders(): HttpHeaders {
    const token = this.cookieManager.getToken();
    return new HttpHeaders({
      'X-XSRF-TOKEN': token || '',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json'
    });
  }

  // Verifica si una URL es pública (para uso en interceptores)
  isPublicEndpoint(url: string): boolean {
    return this.PUBLIC_ENDPOINTS.some(pattern => {
      const regex = new RegExp(`^${pattern.replace(/\d+/g, '\\d+')}$`);
      return regex.test(url);
    });
  }
}