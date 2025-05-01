// src/app/features/admin/product-management/product-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService, Product } from '../../../core/services/product.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;
  showForm = false;
  isEditing = false;
  currentProductId: number | null = null;
  productForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  storageUrl = environment.storageUrl;
  searchTerm = '';
  filterCategory = 0; // 0 significa todas las categorías
  autoRetrying = false;

  // Control de errores en la carga de imágenes
  imageError: string | null = null;
  maxFileSize = 2 * 1024 * 1024; // 2MB en bytes

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.loadProducts();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category_id: ['', [Validators.required]],
      description: [''],
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      available: [true]
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter(cat => cat.active);
      },
      error: (error) => {
        console.error('Error loading categories', error);
        this.errorMessage = 'Error al cargar las categorías. Inténtalo de nuevo más tarde.';
        
        // Reintento automático para errores de conexión
        if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
          this.autoRetrying = true;
          this.errorMessage = 'Reestableciendo conexión...';
          setTimeout(() => {
            this.autoRetrying = false;
            this.loadCategories();
          }, 1000);
        }
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.isLoading = false;
        this.autoRetrying = false;
      },
      error: (error) => {
        console.error('Error loading products', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Serás redirigido a la página de inicio de sesión.';
          this.handleSessionExpired();
        } else {
          this.errorMessage = 'Error al cargar los productos. Inténtalo de nuevo más tarde.';
          
          // Reintento automático para errores de conexión
          if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
            this.autoRetrying = true;
            this.errorMessage = 'Reestableciendo conexión...';
            setTimeout(() => {
              this.autoRetrying = false;
              this.loadProducts();
            }, 1000);
          }
        }
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.products];
    
    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term)
      );
    }
    
    // Filtrar por categoría
    if (this.filterCategory > 0) {
      filtered = filtered.filter(p => p.category_id === this.filterCategory);
    }
    
    this.filteredProducts = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onCategoryFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterCategory = Number(select.value);
    this.applyFilters();
  }

  addProduct(): void {
    this.showForm = true;
    this.isEditing = false;
    this.currentProductId = null;
    this.resetForm();
  }

  editProduct(product: Product): void {
    this.showForm = true;
    this.isEditing = true;
    this.currentProductId = product.id;
    
    this.productForm.patchValue({
      name: product.name,
      category_id: product.category_id,
      description: product.description,
      price: product.price,
      stock: product.stock,
      available: product.available
    });
    
    this.selectedFile = null;
    this.imageError = null;
  }

  cancelForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.productForm.reset({
      name: '',
      category_id: '',
      description: '',
      price: '',
      stock: 0,
      available: true
    });
    this.selectedFile = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.imageError = null;
    this.autoRetrying = false;
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
    if (this.productForm.invalid) {
      // Marcar todos los controles como tocados para mostrar errores
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Verificar si hay error en la imagen
    if (this.imageError) {
      this.errorMessage = 'Por favor, corrige los errores en la imagen antes de continuar.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    // Validar que exista una imagen principal para productos nuevos
    if (!this.isEditing && !this.selectedFile) {
      this.errorMessage = 'La imagen principal es obligatoria para nuevos productos.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.autoRetrying = false;

    const formData = new FormData();
    formData.append('name', this.productForm.get('name')?.value);
    formData.append('category_id', this.productForm.get('category_id')?.value);
    formData.append('description', this.productForm.get('description')?.value || '');
    formData.append('price', this.productForm.get('price')?.value);
    formData.append('stock', this.productForm.get('stock')?.value);
    formData.append('available', this.productForm.get('available')?.value ? '1' : '0');
    
    if (this.selectedFile) {
      formData.append('main_image', this.selectedFile);
    }

    // Ya no es necesario refrescar explícitamente el token CSRF
    // El servicio tiene reintentos automáticos incorporados
    if (this.isEditing && this.currentProductId) {
      // Actualizar producto existente
      this.productService.updateProduct(this.currentProductId, formData).subscribe({
        next: () => {
          this.handleSuccess('Producto actualizado correctamente.');
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    } else {
      // Crear nuevo producto
      this.productService.createProduct(formData).subscribe({
        next: () => {
          this.handleSuccess('Producto creado correctamente.');
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    }
  }

  toggleProductAvailability(product: Product): void {
    // Ya no es necesario refrescar explícitamente el token CSRF
    this.productService.toggleAvailability(product.id).subscribe({
      next: () => {
        // Actualizar estado del producto localmente
        product.available = !product.available;
        this.successMessage = `Estado de "${product.name}" actualizado correctamente.`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error toggling product availability', error);
        this.errorMessage = `Error al actualizar el estado de "${product.name}".`;
        
        // Reintento automático para errores de conexión
        if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
          this.autoRetrying = true;
          this.errorMessage = 'Reestableciendo conexión...';
          setTimeout(() => {
            this.autoRetrying = false;
            this.toggleProductAvailability(product);
          }, 1000);
        } else {
          setTimeout(() => this.errorMessage = '', 3000);
        }
      }
    });
  }

  deleteProduct(product: Product): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el producto "${product.name}"?`)) {
      // Ya no es necesario refrescar explícitamente el token CSRF
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
          this.applyFilters();
          this.successMessage = `Producto "${product.name}" eliminado correctamente.`;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error deleting product', error);
          this.errorMessage = `Error al eliminar el producto "${product.name}".`;
          
          // Reintento automático para errores de conexión
          if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
            this.autoRetrying = true;
            this.errorMessage = 'Reestableciendo conexión...';
            setTimeout(() => {
              this.autoRetrying = false;
              this.deleteProduct(product);
            }, 1000);
          } else {
            setTimeout(() => this.errorMessage = '', 3000);
          }
        }
      });
    }
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  }

  private handleSuccess(message: string): void {
    this.isSubmitting = false;
    this.successMessage = message;
    this.showForm = false;
    this.loadProducts();
    setTimeout(() => this.successMessage = '', 3000);
  }

  private handleError(error: any): void {
    this.isSubmitting = false;
    console.error('Error submitting form', error);
    
    // Verificar si es un error de autenticación
    if (error.status === 401) {
      this.errorMessage = 'Tu sesión ha expirado. Serás redirigido a la página de inicio de sesión.';
      this.handleSessionExpired();
    } else if (error.status === 422) {
      // Error de validación
      if (error.error && error.error.errors) {
        const firstError = Object.values(error.error.errors)[0];
        this.errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
      } else {
        this.errorMessage = 'Error de validación. Por favor, revisa los datos ingresados.';
      }
    } else if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
      // Errores de conexión o CSRF - reintentar automáticamente
      this.autoRetrying = true;
      this.errorMessage = 'Reestableciendo conexión...';
      setTimeout(() => {
        this.autoRetrying = false;
        this.onSubmit(); // Reintentar la operación
      }, 1000);
    } else {
      this.errorMessage = 'Error al guardar el producto. Por favor, inténtalo de nuevo más tarde.';
    }
  }

  private handleSessionExpired(): void {
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
  }

  getImageUrl(path: string): string {
    if (!path) return '/assets/images/placeholder.jpg';
    return this.storageUrl + path;
  }
}