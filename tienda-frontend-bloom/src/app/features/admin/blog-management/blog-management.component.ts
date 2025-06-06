// src/app/features/admin/blog-management/blog-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlogService, BlogPost } from '../../../core/services/blog.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-blog-management',
  templateUrl: './blog-management.component.html',
  styleUrls: ['./blog-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class BlogManagementComponent implements OnInit {
  blogPosts: BlogPost[] = [];
  filteredPosts: BlogPost[] = [];
  isLoading = true;
  showForm = false;
  isEditing = false;
  currentPostId: number | null = null;
  blogForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  storageUrl = environment.storageUrl;
  searchTerm = '';
  
  // Control de errores en la carga de imágenes
  imageError: string | null = null;
  maxFileSize = 2 * 1024 * 1024; // 2MB en bytes

  constructor(
    private blogService: BlogService,
    private fb: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadBlogPosts();
  }

  initForm(): void {
    this.blogForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      featured: [false]
    });
  }

  loadBlogPosts(): void {
    this.isLoading = true;
    
    this.blogService.getPosts().subscribe({
      next: (posts) => {
        this.blogPosts = posts;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading blog posts', error);
        this.errorMessage = 'Error al cargar las entradas del blog. Por favor, inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredPosts = this.blogPosts.filter(post => 
        post.title.toLowerCase().includes(term) || 
        post.content.toLowerCase().includes(term)
      );
    } else {
      this.filteredPosts = [...this.blogPosts];
    }
  }

  onSearch(): void {
    this.applyFilters();
  }

  addBlogPost(): void {
    this.showForm = true;
    this.isEditing = false;
    this.currentPostId = null;
    this.resetForm();
  }

  editBlogPost(post: BlogPost): void {
    this.showForm = true;
    this.isEditing = true;
    this.currentPostId = post.id;
    
    this.blogForm.patchValue({
      title: post.title,
      content: post.content,
      featured: post.featured
    });
    
    this.selectedFile = null;
    this.imageError = null;
  }

  cancelForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.blogForm.reset({
      title: '',
      content: '',
      featured: false
    });
    this.selectedFile = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.imageError = null;
  }

  validateFileSize(file: File): boolean {
    return file.size <= this.maxFileSize;
  }

  formatFileSize(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      
      // Validar tamaño
      if (!this.validateFileSize(file)) {
        this.imageError = `El archivo es demasiado grande (${this.formatFileSize(file.size)} MB). Máximo permitido: 2 MB.`;
        this.selectedFile = null;
        element.value = ''; // Limpiar el input
        return;
      }
      
      this.imageError = null;
      this.selectedFile = file;
    }
  }

  onSubmit(): void {
    if (this.blogForm.invalid) {
      // Marcar todos los controles como tocados para mostrar errores
      Object.keys(this.blogForm.controls).forEach(key => {
        this.blogForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Verificar si hay error en la imagen
    if (this.imageError) {
      this.errorMessage = 'Por favor, corrige los errores en la imagen antes de continuar.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('title', this.blogForm.get('title')?.value);
    formData.append('content', this.blogForm.get('content')?.value);
    formData.append('featured', this.blogForm.get('featured')?.value ? '1' : '0');
    
    if (this.selectedFile) {
      formData.append('banner_image', this.selectedFile);
    }

    // Similar al patrón que usas en el componente de categorías
    if (this.isEditing && this.currentPostId) {
      this.blogService.updatePost(this.currentPostId, formData).subscribe({
        next: (post) => {
          this.handleSuccess('Entrada actualizada correctamente.');
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    } else {
      this.blogService.createPost(formData).subscribe({
        next: (post) => {
          this.handleSuccess('Entrada creada correctamente.');
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    }
  }

  toggleFeatured(post: BlogPost): void {
    const formData = new FormData();
    formData.append('title', post.title);
    formData.append('content', post.content);
    formData.append('featured', post.featured ? '0' : '1');
    
    this.blogService.updatePost(post.id, formData).subscribe({
      next: (updatedPost) => {
        const index = this.blogPosts.findIndex(p => p.id === updatedPost.id);
        if (index !== -1) {
          this.blogPosts[index] = updatedPost;
          this.applyFilters();
        }
        this.successMessage = `Estado destacado de "${post.title}" actualizado correctamente.`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating post featured status', error);
        this.errorMessage = `Error al actualizar el estado destacado de "${post.title}".`;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  deleteBlogPost(post: BlogPost): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la entrada "${post.title}"?`)) {
      this.blogService.deletePost(post.id).subscribe({
        next: () => {
          this.blogPosts = this.blogPosts.filter(p => p.id !== post.id);
          this.applyFilters();
          this.successMessage = `Entrada "${post.title}" eliminada correctamente.`;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error deleting blog post', error);
          this.errorMessage = `Error al eliminar la entrada "${post.title}".`;
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  private handleSuccess(message: string): void {
    this.isSubmitting = false;
    this.successMessage = message;
    this.showForm = false;
    this.loadBlogPosts();
    setTimeout(() => this.successMessage = '', 3000);
  }

  private handleError(error: any): void {
    this.isSubmitting = false;
    console.error('Error submitting form', error);
    
    // Verificar si es un error de autenticación
    if (error.status === 401) {
      this.errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        this.authService.logout().subscribe({
          next: () => {
            // La redirección se maneja en el servicio AuthService
          },
          error: () => {
            // Forzar redirección en caso de error
            window.location.href = '/login';
          }
        });
      }, 2000);
    } else if (error.status === 419) {
      // Error específico de CSRF token mismatch
      this.errorMessage = 'Error de seguridad. Por favor, intenta de nuevo.';
    } else if (error.error && error.error.message) {
      this.errorMessage = error.error.message;
    } else if (error.error && error.error.errors) {
      this.errorMessage = Object.values(error.error.errors)[0] as string;
    } else {
      this.errorMessage = 'Error al guardar la entrada. Por favor, inténtalo de nuevo.';
    }
  }

  getExcerpt(html: string): string {
    if (!html) return '';
    const text = String(html).replace(/<\/?[^>]+(>|$)/g, '');
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }

  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.storageUrl + path;
  }
}