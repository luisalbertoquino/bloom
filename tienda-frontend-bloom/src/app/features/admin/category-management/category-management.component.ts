// src/app/features/admin/category-management/category-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService, Category } from '../../../core/services/category.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
 
@Component({
  selector: 'app-category-management',
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  isLoading = true;
  showForm = false;
  isEditing = false;
  currentCategoryId: number | null = null;
  categoryForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  storageUrl = environment.storageUrl;

  // Control de errores en la carga de imágenes
  imageError: string | null = null;
  maxFileSize = 2 * 1024 * 1024; // 2MB en bytes

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    // Escuchar evento de sesión expirada
    window.addEventListener('session-expired', (event: any) => {
      // Mostrar mensaje al usuario
      this.errorMessage = event.detail.message || 'Tu sesión ha expirado. Serás redirigido al login.';
      
      // Dar tiempo para que se muestre el mensaje
      setTimeout(() => {
        this.authService.clearAuthData();
      }, 3000);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('session-expired', () => {});
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      active: [true]
    });
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories', error);
        this.errorMessage = 'Error al cargar las categorías. Por favor, inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }

  addCategory(): void {
    this.showForm = true;
    this.isEditing = false;
    this.currentCategoryId = null;
    this.resetForm();
  }

  editCategory(category: Category): void {
    this.showForm = true;
    this.isEditing = true;
    this.currentCategoryId = category.id;
    
    console.log('Categoría a editar:', category);
    
    // Limpia primero el formulario antes de asignar nuevos valores
    this.categoryForm.reset();
    
    // Asigna los valores explícitamente
    this.categoryForm.get('name')?.setValue(category.name);
    this.categoryForm.get('active')?.setValue(category.active);
    
    this.selectedFile = null;
    this.imageError = null;
  }

  cancelForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.categoryForm.reset({
      name: '',
      active: true
    });
    this.selectedFile = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.imageError = null;
  }

  // Validar tamaño del archivo
  validateFileSize(file: File): boolean {
    return file.size <= this.maxFileSize;
  }

  // Convertir bytes a MB para mensajes de error
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
    if (this.categoryForm.invalid) {
      // Marcar todos los controles como tocados para mostrar errores
      Object.keys(this.categoryForm.controls).forEach(key => {
        this.categoryForm.get(key)?.markAsTouched();
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
    formData.append('name', this.categoryForm.get('name')?.value);
    formData.append('active', this.categoryForm.get('active')?.value ? '1' : '0');
    
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    } 
 
    // Refrescar token CSRF antes de enviar datos
    // Si no estás usando la nueva versión del AuthService, quita esta parte
    // y sigue usando tu método original
    this.refreshCsrfAndSubmit(formData);
  } 
   
  // Nuevo método para refrescar CSRF y enviar datos
  // Reemplaza el método refreshCsrfAndSubmit en category-management.component.ts
  refreshCsrfAndSubmit(formData: FormData): void {
    // Mostrar mensaje al usuario de que se está procesando
    this.successMessage = 'Procesando, por favor espera...';
    
    // Refrescar token CSRF primero y luego enviar datos
    this.authService.refreshCsrfToken().pipe(
      switchMap(() => {
        // Ahora procesa según sea creación o actualización
        if (this.isEditing && this.currentCategoryId) {
          return this.categoryService.updateCategory(this.currentCategoryId, formData);
        } else {
          return this.categoryService.createCategory(formData);
        }
      })
    ).subscribe({
      next: (category) => {
        this.handleSuccess(this.isEditing ? 
          'Categoría actualizada correctamente.' : 
          'Categoría creada correctamente.');
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }


  // Método para extraer el token de las cookies
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

  toggleCategoryStatus(category: Category): void {
    const formData = new FormData();
    formData.append('name', category.name);
    formData.append('active', category.active ? '0' : '1');
    
    // Refrescar token CSRF antes de actualizar estado
    if ('refreshCsrfToken' in this.authService) {
      // @ts-ignore
      this.authService.refreshCsrfToken().pipe(
        switchMap(() => this.categoryService.updateCategory(category.id, formData))
      ).subscribe({
        next: (updatedCategory) => {
          const index = this.categories.findIndex(c => c.id === updatedCategory.id);
          if (index !== -1) {
            this.categories[index] = updatedCategory;
          }
          this.successMessage = `Estado de "${category.name}" actualizado correctamente.`;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error updating category status', error);
          this.errorMessage = `Error al actualizar el estado de "${category.name}".`;
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    } else {
      // Versión fallback
      this.categoryService.updateCategory(category.id, formData).subscribe({
        next: (updatedCategory) => {
          const index = this.categories.findIndex(c => c.id === updatedCategory.id);
          if (index !== -1) {
            this.categories[index] = updatedCategory;
          }
          this.successMessage = `Estado de "${category.name}" actualizado correctamente.`;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error updating category status', error);
          this.errorMessage = `Error al actualizar el estado de "${category.name}".`;
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`)) {
      // Refrescar token CSRF antes de eliminar
      if ('refreshCsrfToken' in this.authService) {
        // @ts-ignore
        this.authService.refreshCsrfToken().pipe(
          switchMap(() => this.categoryService.deleteCategory(category.id))
        ).subscribe({
          next: () => {
            this.categories = this.categories.filter(c => c.id !== category.id);
            this.successMessage = `Categoría "${category.name}" eliminada correctamente.`;
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error) => {
            console.error('Error deleting category', error);
            this.errorMessage = `Error al eliminar la categoría "${category.name}". Puede que tenga productos asociados.`;
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
      } else {
        // Versión fallback
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.categories = this.categories.filter(c => c.id !== category.id);
            this.successMessage = `Categoría "${category.name}" eliminada correctamente.`;
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error) => {
            console.error('Error deleting category', error);
            this.errorMessage = `Error al eliminar la categoría "${category.name}". Puede que tenga productos asociados.`;
            setTimeout(() => this.errorMessage = '', 3000);
          }
        });
      }
    }
  }

  private handleSuccess(message: string): void {
    this.isSubmitting = false;
    this.successMessage = message;
    this.showForm = false;
    this.loadCategories();
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
      this.errorMessage = 'Error al guardar la categoría. Por favor, inténtalo de nuevo.';
    }
  }

  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.storageUrl + path;
  }
}