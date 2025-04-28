// src/app/core/services/blog.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../enviroments/enviroment';

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

  constructor(private httpBase: HttpBaseService) { }

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
    return this.httpBase.post<BlogPost>(`${this.apiUrl}/blog-posts`, postData);
  }

  updatePost(id: number, postData: FormData): Observable<BlogPost> {
    return this.httpBase.put<BlogPost>(`${this.apiUrl}/blog-posts/${id}`, postData);
  }

  deletePost(id: number): Observable<any> {
    return this.httpBase.delete<any>(`${this.apiUrl}/blog-posts/${id}`);
  }
}