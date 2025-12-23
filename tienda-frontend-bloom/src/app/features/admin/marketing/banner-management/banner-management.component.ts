// src/app/features/admin/marketing/banner-management/banner-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BannerService, Banner } from '../../../../core/services/banner.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-banner-management',
  templateUrl: './banner-management.component.html',
  styleUrls: ['./banner-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class BannerManagementComponent implements OnInit {
  banners: Banner[] = [];
  filteredBanners: Banner[] = [];
  isLoading = true;
  showForm = false;
  isEditing = false;
  currentBannerId: number | null = null;
  bannerForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  storageUrl = environment.storageUrl;
  searchTerm = '';
  autoRetrying = false;

  // Control de errores en la carga de imágenes
  imageError: string | null = null;
  maxFileSize = 2 * 1024 * 1024; // 2MB en bytes

  // Preview de imagen
  imagePreview: string | null = null;

  constructor(
    private bannerService: BannerService,
    private fb: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadBanners();
  }

  initForm(): void {
    this.bannerForm = this.fb.group({
      title: ['', [Validators.maxLength(255)]],
      description: [''],
      link: [''],
      order: [0, [Validators.required, Validators.min(0)]],
      active: [true]
    });
  }

  loadBanners(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.bannerService.getAllBanners().subscribe({
      next: (banners) => {
        this.banners = banners;
        this.applyFilters();
        this.isLoading = false;
        this.autoRetrying = false;
      },
      error: (error) => {
        console.error('Error loading banners', error);
        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Serás redirigido a la página de inicio de sesión.';
          this.handleSessionExpired();
        } else {
          this.errorMessage = 'Error al cargar los banners. Inténtalo de nuevo más tarde.';

          // Reintento automático para errores de conexión
          if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
            this.autoRetrying = true;
            this.errorMessage = 'Reestableciendo conexión...';
            setTimeout(() => {
              this.autoRetrying = false;
              this.loadBanners();
            }, 1000);
          }
        }
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.banners];

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(b =>
        (b.title && b.title.toLowerCase().includes(term)) ||
        (b.description && b.description.toLowerCase().includes(term))
      );
    }

    this.filteredBanners = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  addBanner(): void {
    this.showForm = true;
    this.isEditing = false;
    this.currentBannerId = null;
    this.resetForm();
  }

  editBanner(banner: Banner): void {
    this.showForm = true;
    this.isEditing = true;
    this.currentBannerId = banner.id;

    this.bannerForm.patchValue({
      title: banner.title || '',
      description: banner.description || '',
      link: banner.link || '',
      order: banner.order,
      active: banner.active
    });

    // Establecer preview de imagen existente
    if (banner.image) {
      this.imagePreview = this.getImageUrl(banner.image);
    }

    this.selectedFile = null;
    this.imageError = null;
  }

  cancelForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.bannerForm.reset({
      title: '',
      description: '',
      link: '',
      order: 0,
      active: true
    });
    this.selectedFile = null;
    this.imagePreview = null;
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
        this.imagePreview = null;
        element.value = ''; // Limpiar el input
        return;
      }

      this.imageError = null;
      this.selectedFile = file;

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.bannerForm.invalid) {
      // Marcar todos los controles como tocados para mostrar errores
      Object.keys(this.bannerForm.controls).forEach(key => {
        this.bannerForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Verificar si hay error en la imagen
    if (this.imageError) {
      this.errorMessage = 'Por favor, corrige los errores en la imagen antes de continuar.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    // Validar que exista una imagen para banners nuevos
    if (!this.isEditing && !this.selectedFile) {
      this.errorMessage = 'La imagen es obligatoria para nuevos banners.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.autoRetrying = false;

    const formData = new FormData();
    const title = this.bannerForm.get('title')?.value;
    const description = this.bannerForm.get('description')?.value;
    const link = this.bannerForm.get('link')?.value;

    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (link) formData.append('link', link);
    formData.append('order', this.bannerForm.get('order')?.value);
    formData.append('active', this.bannerForm.get('active')?.value ? '1' : '0');

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    if (this.isEditing && this.currentBannerId) {
      // Actualizar banner existente
      this.bannerService.updateBanner(this.currentBannerId, formData).subscribe({
        next: () => {
          this.handleSuccess('Banner actualizado correctamente.');
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    } else {
      // Crear nuevo banner
      this.bannerService.createBanner(formData).subscribe({
        next: () => {
          this.handleSuccess('Banner creado correctamente.');
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    }
  }

  toggleBannerStatus(banner: Banner): void {
    const formData = new FormData();
    formData.append('active', banner.active ? '0' : '1');
    if (banner.title) formData.append('title', banner.title);
    if (banner.description) formData.append('description', banner.description);
    if (banner.link) formData.append('link', banner.link);
    formData.append('order', banner.order.toString());

    this.bannerService.updateBanner(banner.id, formData).subscribe({
      next: () => {
        banner.active = !banner.active;
        this.successMessage = `Banner "${banner.title || 'Sin título'}" ${banner.active ? 'activado' : 'desactivado'} correctamente.`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error toggling banner status', error);
        this.errorMessage = `Error al actualizar el estado del banner.`;

        // Reintento automático para errores de conexión
        if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
          this.autoRetrying = true;
          this.errorMessage = 'Reestableciendo conexión...';
          setTimeout(() => {
            this.autoRetrying = false;
            this.toggleBannerStatus(banner);
          }, 1000);
        } else {
          setTimeout(() => this.errorMessage = '', 3000);
        }
      }
    });
  }

  deleteBanner(banner: Banner): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el banner "${banner.title || 'Sin título'}"?`)) {
      this.bannerService.deleteBanner(banner.id).subscribe({
        next: () => {
          this.banners = this.banners.filter(b => b.id !== banner.id);
          this.applyFilters();
          this.successMessage = `Banner "${banner.title || 'Sin título'}" eliminado correctamente.`;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error deleting banner', error);
          this.errorMessage = `Error al eliminar el banner.`;

          // Reintento automático para errores de conexión
          if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
            this.autoRetrying = true;
            this.errorMessage = 'Reestableciendo conexión...';
            setTimeout(() => {
              this.autoRetrying = false;
              this.deleteBanner(banner);
            }, 1000);
          } else {
            setTimeout(() => this.errorMessage = '', 3000);
          }
        }
      });
    }
  }

  moveUp(banner: Banner): void {
    const index = this.banners.indexOf(banner);
    if (index > 0) {
      const previousBanner = this.banners[index - 1];
      const tempOrder = banner.order;

      // Actualizar órdenes
      this.updateBannerOrder(banner, previousBanner.order);
      this.updateBannerOrder(previousBanner, tempOrder);
    }
  }

  moveDown(banner: Banner): void {
    const index = this.banners.indexOf(banner);
    if (index < this.banners.length - 1) {
      const nextBanner = this.banners[index + 1];
      const tempOrder = banner.order;

      // Actualizar órdenes
      this.updateBannerOrder(banner, nextBanner.order);
      this.updateBannerOrder(nextBanner, tempOrder);
    }
  }

  private updateBannerOrder(banner: Banner, newOrder: number): void {
    const formData = new FormData();
    formData.append('order', newOrder.toString());
    formData.append('active', banner.active ? '1' : '0');
    if (banner.title) formData.append('title', banner.title);
    if (banner.description) formData.append('description', banner.description);
    if (banner.link) formData.append('link', banner.link);

    this.bannerService.updateBanner(banner.id, formData).subscribe({
      next: () => {
        banner.order = newOrder;
        this.loadBanners(); // Recargar para reflejar el nuevo orden
      },
      error: (error) => {
        console.error('Error updating banner order', error);
        this.errorMessage = 'Error al actualizar el orden del banner.';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  private handleSuccess(message: string): void {
    this.isSubmitting = false;
    this.successMessage = message;
    this.showForm = false;
    this.loadBanners();
    setTimeout(() => this.successMessage = '', 3000);
  }

  private handleError(error: any): void {
    this.isSubmitting = false;
    console.error('Error submitting form', error);

    if (error.status === 401) {
      this.errorMessage = 'Tu sesión ha expirado. Serás redirigido a la página de inicio de sesión.';
      this.handleSessionExpired();
    } else if (error.status === 422) {
      if (error.error && error.error.errors) {
        const firstError = Object.values(error.error.errors)[0];
        this.errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
      } else {
        this.errorMessage = 'Error de validación. Por favor, revisa los datos ingresados.';
      }
    } else if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
      this.autoRetrying = true;
      this.errorMessage = 'Reestableciendo conexión...';
      setTimeout(() => {
        this.autoRetrying = false;
        this.onSubmit();
      }, 1000);
    } else {
      this.errorMessage = 'Error al guardar el banner. Por favor, inténtalo de nuevo más tarde.';
    }
  }

  private handleSessionExpired(): void {
    setTimeout(() => {
      this.authService.logout().subscribe({
        next: () => {
          // La redirección se maneja en el servicio AuthService
        },
        error: () => {
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
