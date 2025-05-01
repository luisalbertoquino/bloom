// src/app/core/services/blog.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
    private http: HttpClient
  ) { }

  // Obtener todos los posts
  getPosts(): Observable<BlogPost[]> {
    return this.httpBase.get<BlogPost[]>(`${this.apiUrl}/blog-posts`);
  }

  // Obtener posts destacados
  getFeaturedPosts(): Observable<BlogPost[]> {
    return this.httpBase.get<BlogPost[]>(`${this.apiUrl}/blog-posts/featured`);
  }

  // Obtener un post por ID
  getPost(id: number): Observable<BlogPost> {
    return this.httpBase.get<BlogPost>(`${this.apiUrl}/blog-posts/${id}`);
  }

  // Solo para administradores
  createPost(postData: FormData): Observable<BlogPost> {
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.post<BlogPost>(`${this.apiUrl}/blog-posts`, postData, {
      headers: headers,
      withCredentials: true
    });
  }

  updatePost(id: number, postData: FormData): Observable<BlogPost> {
    // Simulando PUT con POST para mejor compatibilidad con FormData en Laravel
    postData.append('_method', 'PUT');
    
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.post<BlogPost>(`${this.apiUrl}/blog-posts/${id}`, postData, {
      headers: headers,
      withCredentials: true
    });
  }

  deletePost(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': decodeURIComponent(this.getTokenFromCookie('XSRF-TOKEN') || ''),
      'X-Requested-With': 'XMLHttpRequest'
    });
    
    return this.http.delete<any>(`${this.apiUrl}/blog-posts/${id}`, {
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