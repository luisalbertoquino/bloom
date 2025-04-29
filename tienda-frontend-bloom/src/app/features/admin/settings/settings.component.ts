// src/app/features/admin/settings/settings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { ThemeService } from '../../../core/services/theme.service';
import { environment } from '../../../../enviroments/enviroment';
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
  selectedLogoFile: File | null = null;
  selectedBannerFile: File | null = null;
  selectedFaviconFile: File | null = null;
  logoPreview: string | null = null;
  bannerPreview: string | null = null;
  faviconPreview: string | null = null;
  storageUrl = environment.storageUrl;
  
  // Configuraciones actuales
  currentSettings: any = {};

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
        this.errorMessage = 'Error al cargar la configuración. Por favor, inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }

  onLogoSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.selectedLogoFile = element.files[0];
      
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
      this.selectedBannerFile = element.files[0];
      
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
      this.selectedFaviconFile = element.files[0];
      
      // Crear previsualización
      const reader = new FileReader();
      reader.onload = () => {
        this.faviconPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFaviconFile);
    }
  }

  // Modificación del método onSubmit en SettingsComponent
onSubmit(): void {
  if (this.settingsForm.invalid) {
    // Marcar todos los campos como tocados para mostrar los errores
    Object.keys(this.settingsForm.controls).forEach(key => {
      const control = this.settingsForm.get(key);
      control?.markAsTouched();
    });
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

  this.settingsService.updateSettings(formData).subscribe({
    next: (response) => {
      this.isSubmitting = false;
      this.successMessage = 'Configuración actualizada correctamente. Recargando página...';
      
      // Actualizar el tema
      this.themeService.initializeTheme();
      
      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        // Refrescar la página completa
        window.location.reload();
      }, 1500);
    },
    error: (error) => {
      this.isSubmitting = false;
      console.error('Error updating settings', error);
      
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
        this.errorMessage = 'Error al guardar la configuración. Por favor, inténtalo de nuevo.';
      }
      
      setTimeout(() => this.errorMessage = '', 5000);
    }
  });
}

  resetForm(): void {
    this.loadSettings();
    this.selectedLogoFile = null;
    this.selectedBannerFile = null;
    this.selectedFaviconFile = null;
    
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