// src/app/features/store/blog-list/blog-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { BlogService, BlogPost } from '../../../core/services/blog.service';
import { environment } from '../../../../enviroments/enviroment';

@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FooterComponent
  ]
})
export class BlogListComponent implements OnInit {
  blogPosts: BlogPost[] = [];
  isLoading = true;
  storageUrl = environment.storageUrl;

  constructor(
    private blogService: BlogService
  ) { }

  ngOnInit(): void {
    this.loadBlogPosts();
  }

  loadBlogPosts(): void {
    this.isLoading = true;
    this.blogService.getPosts().subscribe(
      (posts: BlogPost[]) => {
        if (posts && Array.isArray(posts)) {
          this.blogPosts = posts;
        }
        this.isLoading = false;
      },
      (error: any) => {
        console.error('Error loading blog posts', error);
        this.isLoading = false;
      }
    );
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
}