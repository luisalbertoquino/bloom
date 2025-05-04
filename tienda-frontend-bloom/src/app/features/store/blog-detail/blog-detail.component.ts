// src/app/features/store/blog-detail/blog-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { BlogService, BlogPost } from '../../../core/services/blog.service';
import { environment } from '../../../../environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { WhatsappButtonComponent } from '../../../shared/components/whatsapp-button/whatsapp-button.component';

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, 
    NavbarComponent,
    FooterComponent,
    WhatsappButtonComponent
  ]
})
export class BlogDetailComponent implements OnInit {
  post: BlogPost | null = null;
  relatedPosts: BlogPost[] = [];
  isLoading = true;
  storageUrl = environment.storageUrl;
  sanitizedContent: SafeHtml | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadBlogPost(Number(params['id']));
      } else {
        // Redireccionar a la lista de blog si no hay ID
        this.router.navigate(['/blog']);
      }
    });
  }

  loadBlogPost(id: number): void {
    this.isLoading = true;
    this.blogService.getPost(id).subscribe({
      next: (post: BlogPost) => {
        this.post = post;
        if (post && post.content) {
          // Sanitizar el contenido HTML del post
          this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(post.content);
        }
        // Cargar posts relacionados
        this.loadRelatedPosts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading blog post', error);
        this.isLoading = false;
      }
    });
  }

  loadRelatedPosts(): void {
    this.blogService.getPosts().subscribe({
      next: (posts: BlogPost[]) => {
        // Filtrar el post actual y seleccionar algunos posts aleatorios
        this.relatedPosts = posts
          .filter(p => p.id !== this.post?.id)
          // Priorizar posts destacados si están disponibles
          .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
          .slice(0, 3);
      },
      error: (error) => {
        console.error('Error loading related posts', error);
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

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // Opciones de formato para fechas en español
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      return date.toLocaleDateString('es-ES', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  // Compartir en redes sociales
  shareOnFacebook(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  shareOnTwitter(): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(this.post?.title || '');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  }

  shareOnWhatsApp(): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(this.post?.title || '');
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  }
}