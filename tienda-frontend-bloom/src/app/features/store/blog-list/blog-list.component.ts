// src/app/features/store/blog-list/blog-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { BlogService, BlogPost } from '../../../core/services/blog.service';
import { environment } from '../../../../environments/environment';
import { CookieManagerService } from '../../../core/services/cookie-manager.service';

import { WhatsappButtonComponent } from '../../../shared/components/whatsapp-button/whatsapp-button.component';

@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FooterComponent,
    WhatsappButtonComponent
  ]
})
export class BlogListComponent implements OnInit {
  blogPosts: BlogPost[] = [];
  isLoading = true;
  storageUrl = environment.storageUrl;
  private readonly ALLOWED_COOKIES = ['bloom_session', 'XSRF-TOKEN'];

  constructor(
    private blogService: BlogService,
    private cookieManager: CookieManagerService
  ) { }

  ngOnInit(): void {
    this.cleanNonEssentialCookies();
    this.loadBlogPosts();
  }

  private cleanNonEssentialCookies(): void {
    // Limpieza agresiva de cookies no esenciales
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name && !this.ALLOWED_COOKIES.includes(name)) {
        this.deleteCookie(name);
      }
    });
  }

  private deleteCookie(name: string): void {
    // Eliminar cookie en todos los dominios y rutas posibles
    const domains = [
      window.location.hostname,
      '.' + window.location.hostname,
      'localhost',
      ''
    ];

    const paths = ['/', '/blog', '/api', ''];

    domains.forEach(domain => {
      paths.forEach(path => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
      });
    });
  }

  loadBlogPosts(): void {
    this.isLoading = true;
    this.blogService.getPosts().subscribe({
      next: (posts: BlogPost[]) => {
        this.blogPosts = Array.isArray(posts) ? posts : [];
        this.isLoading = false;
        
        // Limpieza post-carga por si acaso
        setTimeout(() => this.cleanNonEssentialCookies(), 100);
      },
      error: (error: any) => {
        console.error('Error loading blog posts', error);
        this.isLoading = false;
        
        // Limpieza adicional en caso de error
        this.cleanNonEssentialCookies();
        
        // Recargar si es error de cookies
        if (error.status === 431 || error.status === 419) {
          window.location.reload();
        }
      }
    });
  }

  getExcerpt(html: string): string {
    if (!html) return '';
    const text = String(html).replace(/<\/?[^>]+(>|$)/g, '');
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.storageUrl + path;
  }

  // Manejo de recarga/actualización
  onRefresh(): void {
    this.cleanNonEssentialCookies();
    this.loadBlogPosts();
  }
}