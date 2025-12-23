// src/app/features/admin/marketing/popup-settings/popup-settings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PopupService, PopupSetting } from '../../../../core/services/popup.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-popup-settings',
  templateUrl: './popup-settings.component.html',
  styleUrls: ['./popup-settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PopupSettingsComponent implements OnInit {
  popupForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  storageUrl = environment.storageUrl;
  autoRetrying = false;
  currentPopup: PopupSetting | null = null;

  // Control de errores en la carga de imágenes
  imageError: string | null = null;
  maxFileSize = 2 * 1024 * 1024; // 2MB en bytes

  // Preview de imagen
  imagePreview: string | null = null;

  // Opciones de frecuencia
  frequencyOptions = [
    { value: 'once', label: 'Una vez por usuario' },
    { value: 'once_per_session', label: 'Una vez por sesión' },
    { value: 'once_per_day', label: 'Una vez por día' },
    { value: 'always', label: 'Siempre' }
  ];

  constructor(
    private popupService: PopupService,
    private fb: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadPopupSettings();
  }

  initForm(): void {
    this.popupForm = this.fb.group({
      active: [false],
      title: ['', [Validators.maxLength(255)]],
      content: [''],
      button_text: ['', [Validators.maxLength(100)]],
      button_link: ['', [Validators.maxLength(255)]],
      show_frequency: ['once_per_session', [Validators.required]],
      delay_seconds: [3, [Validators.required, Validators.min(0), Validators.max(60)]]
    });
  }

  loadPopupSettings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.popupService.getPopupSettings().subscribe({
      next: (popup) => {
        this.currentPopup = popup;
        if (popup) {
          this.popupForm.patchValue({
            active: popup.active,
            title: popup.title || '',
            content: popup.content || '',
            button_text: popup.button_text || '',
            button_link: popup.button_link || '',
            show_frequency: popup.show_frequency || 'once_per_session',
            delay_seconds: popup.delay_seconds || 3
          });

          // Establecer preview de imagen existente
          if (popup.image) {
            this.imagePreview = this.getImageUrl(popup.image);
          }
        }
        this.isLoading = false;
        this.autoRetrying = false;
      },
      error: (error) => {
        console.error('Error loading popup settings', error);
        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Serás redirigido a la página de inicio de sesión.';
          this.handleSessionExpired();
        } else {
          this.errorMessage = 'Error al cargar la configuración del popup. Inténtalo de nuevo más tarde.';

          // Reintento automático para errores de conexión
          if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
            this.autoRetrying = true;
            this.errorMessage = 'Reestableciendo conexión...';
            setTimeout(() => {
              this.autoRetrying = false;
              this.loadPopupSettings();
            }, 1000);
          }
        }
      }
    });
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

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = null;

    // Limpiar el input file
    const fileInput = document.getElementById('popup-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.popupForm.invalid) {
      // Marcar todos los controles como tocados para mostrar errores
      Object.keys(this.popupForm.controls).forEach(key => {
        this.popupForm.get(key)?.markAsTouched();
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
    this.autoRetrying = false;

    const formData = new FormData();
    formData.append('active', this.popupForm.get('active')?.value ? '1' : '0');

    const title = this.popupForm.get('title')?.value;
    const content = this.popupForm.get('content')?.value;
    const buttonText = this.popupForm.get('button_text')?.value;
    const buttonLink = this.popupForm.get('button_link')?.value;

    if (title) formData.append('title', title);
    if (content) formData.append('content', content);
    if (buttonText) formData.append('button_text', buttonText);
    if (buttonLink) formData.append('button_link', buttonLink);

    formData.append('show_frequency', this.popupForm.get('show_frequency')?.value);
    formData.append('delay_seconds', this.popupForm.get('delay_seconds')?.value);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.popupService.updatePopupSettings(formData).subscribe({
      next: () => {
        this.handleSuccess('Configuración del popup guardada correctamente.');
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  private handleSuccess(message: string): void {
    this.isSubmitting = false;
    this.successMessage = message;
    this.loadPopupSettings();
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
      this.errorMessage = 'Error al guardar la configuración. Por favor, inténtalo de nuevo más tarde.';
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

  getFrequencyLabel(): string {
    const frequency = this.popupForm.get('show_frequency')?.value;
    const option = this.frequencyOptions.find(f => f.value === frequency);
    return option ? option.label : '';
  }
}
