// src/app/features/admin/settings/settings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { ThemeService } from '../../../core/services/theme.service';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  showUpdateConfirmation = false;
  selectedLogoFile: File | null = null;
  selectedBannerFile: File | null = null;
  selectedFaviconFile: File | null = null;
  logoPreview: string | null = null;
  bannerPreview: string | null = null;
  faviconPreview: string | null = null;
  storageUrl = environment.storageUrl;
  autoRetrying = false;
  // Configuraciones actuales
  currentSettings: any = {};

  // Errores de validación de archivos
  logoError: string | null = null;
  bannerError: string | null = null;
  faviconError: string | null = null;
  
  // Tamaño máximo de archivo (2MB en bytes)
  maxFileSize = 2 * 1024 * 1024;

  constructor(
    private settingsService: SettingsService,
    private themeService: ThemeService,
    private authService: AuthService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadSettings();
  }

  initForm(): void {
    this.settingsForm = this.fb.group({
      site_title: ['', [Validators.required]],
      primary_color: ['#4F46E5', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      secondary_color: ['#10B981', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      footer_text: ['', [Validators.required]],
      address: [''],
      phone: [''],
      email: ['', [Validators.email]],
      facebook: [''],
      instagram: [''],
      twitter: [''],
      youtube: [''],
      whatsapp_number: ['']
    });
  }

  loadSettings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.currentSettings = settings;
        
        // Actualizar el formulario con los valores obtenidos
        this.settingsForm.patchValue({
          site_title: settings.site_title || '',
          primary_color: settings.primary_color || '#4F46E5',
          secondary_color: settings.secondary_color || '#10B981',
          footer_text: settings.footer_text || '',
          address: settings.address || '',
          phone: settings.phone || '',
          email: settings.email || '',
          facebook: settings.facebook || '',
          instagram: settings.instagram || '',
          twitter: settings.twitter || '',
          youtube: settings.youtube || '',
          whatsapp_number: settings.whatsapp_number || ''
        });
        
        // Si hay logo, banner o favicon, mostrar previsualizaciones
        if (settings.logo) {
          this.logoPreview = this.storageUrl + settings.logo;
        }
        
        if (settings.banner_image) {
          this.bannerPreview = this.storageUrl + settings.banner_image;
        }
        
        if (settings.favicon) {
          this.faviconPreview = this.storageUrl + settings.favicon;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading settings', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Serás redirigido a la página de inicio de sesión.';
          this.handleSessionExpired();
        } else {
          this.errorMessage = 'Error al cargar la configuración. Inténtalo de nuevo más tarde.';
        }
      }
    });
  }

  // Método para validar el tamaño del archivo
  validateFileSize(file: File): boolean {
    return file.size <= this.maxFileSize;
  }

  // Convertir bytes a MB para mensajes de error
  formatFileSize(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  onLogoSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      
      // Validar tamaño
      if (!this.validateFileSize(file)) {
        this.logoError = `El archivo es demasiado grande (${this.formatFileSize(file.size)} MB). Máximo permitido: 2 MB.`;
        this.selectedLogoFile = null;
        element.value = ''; // Limpiar el input
        return;
      }
      
      this.logoError = null;
      this.selectedLogoFile = file;
      
      // Crear previsualización
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedLogoFile);
    }
  }

  onBannerSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      
      // Validar tamaño
      if (!this.validateFileSize(file)) {
        this.bannerError = `El archivo es demasiado grande (${this.formatFileSize(file.size)} MB). Máximo permitido: 2 MB.`;
        this.selectedBannerFile = null;
        element.value = ''; // Limpiar el input
        return;
      }
      
      this.bannerError = null;
      this.selectedBannerFile = file;
      
      // Crear previsualización
      const reader = new FileReader();
      reader.onload = () => {
        this.bannerPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedBannerFile);
    }
  }

  onFaviconSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      
      // Validar tamaño
      if (!this.validateFileSize(file)) {
        this.faviconError = `El archivo es demasiado grande (${this.formatFileSize(file.size)} MB). Máximo permitido: 2 MB.`;
        this.selectedFaviconFile = null;
        element.value = ''; // Limpiar el input
        return;
      }
      
      this.faviconError = null;
      this.selectedFaviconFile = file;
      
      // Crear previsualización
      const reader = new FileReader();
      reader.onload = () => {
        this.faviconPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFaviconFile);
    }
  }

  onSubmit(): void {
    if (this.settingsForm.invalid) {
      // Marcar todos los campos como tocados para mostrar los errores
      Object.keys(this.settingsForm.controls).forEach(key => {
        const control = this.settingsForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
  
    // Verificar si hay errores de validación de archivos
    if (this.logoError || this.bannerError || this.faviconError) {
      this.errorMessage = 'Corrige los errores en los archivos antes de continuar.';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }
  
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
  
    const formData = new FormData();
    
    // Agregar todos los campos del formulario
    Object.keys(this.settingsForm.value).forEach(key => {
      formData.append(key, this.settingsForm.get(key)?.value);
    });
    
    // Agregar archivos si fueron seleccionados
    if (this.selectedLogoFile) {
      formData.append('logo', this.selectedLogoFile);
    }
    
    if (this.selectedBannerFile) {
      formData.append('banner_image', this.selectedBannerFile);
    }
    
    if (this.selectedFaviconFile) {
      formData.append('favicon', this.selectedFaviconFile);
    }
  
    // Usar el patrón simple como en el componente de categorías
    this.settingsService.updateSettings(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Configuración actualizada correctamente.';
        
        // Actualizar el tema inmediatamente sin necesidad de recargar
        this.themeService.initializeTheme();
        
        // Recargar los settings para mostrar los cambios actualizados
        this.loadSettings();
        
        // Ocultar el mensaje después de unos segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
        
        // Eliminar las variables que ya no son necesarias
        this.showUpdateConfirmation = false; // No usaremos este diálogo
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  // Manejo de errores centralizado
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
    } else if (error.status === 419) {
      // Error específico de CSRF token mismatch
      this.errorMessage = 'Error de seguridad. Por favor, intenta de nuevo.';
    } else {
      this.errorMessage = 'Error al guardar la configuración. Por favor, inténtalo de nuevo más tarde.';
    }
    
    setTimeout(() => this.errorMessage = '', 5000);
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

  // Método para recargar la página cuando el usuario confirma
  reloadPage(): void {
    window.location.reload();
  }

  // Método para cerrar el mensaje de confirmación sin recargar
  closeConfirmation(): void {
    this.showUpdateConfirmation = false;
    this.successMessage = '';
    this.loadSettings(); // Recargar los ajustes para reflejar los últimos cambios
  }

  resetForm(): void {
    this.loadSettings();
    this.selectedLogoFile = null;
    this.selectedBannerFile = null;
    this.selectedFaviconFile = null;
    this.logoError = null;
    this.bannerError = null;
    this.faviconError = null,
    this.logoError = null;
    this.bannerError = null;
    this.faviconError = null;
    
    // Mantener las previsualizaciones actuales
    if (this.currentSettings.logo) {
      this.logoPreview = this.storageUrl + this.currentSettings.logo;
    } else {
      this.logoPreview = null;
    }
    
    if (this.currentSettings.banner_image) {
      this.bannerPreview = this.storageUrl + this.currentSettings.banner_image;
    } else {
      this.bannerPreview = null;
    }
    
    if (this.currentSettings.favicon) {
      this.faviconPreview = this.storageUrl + this.currentSettings.favicon;
    } else {
      this.faviconPreview = null;
    }
  }
}