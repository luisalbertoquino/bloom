// src/app/features/admin/marketing/top-bar-settings/top-bar-settings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TopBarService, TopBarSettings } from '../../../../core/services/top-bar.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-top-bar-settings',
  templateUrl: './top-bar-settings.component.html',
  styleUrls: ['./top-bar-settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class TopBarSettingsComponent implements OnInit {
  topBarForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  autoRetrying = false;
  currentSettings: TopBarSettings | null = null;

  // Para el preview
  previewCountdown: { days: number; hours: number; minutes: number; seconds: number } | null = null;
  previewInterval: any;

  constructor(
    private topBarService: TopBarService,
    private fb: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadTopBarSettings();
    this.startPreviewCountdown();
  }

  ngOnDestroy(): void {
    if (this.previewInterval) {
      clearInterval(this.previewInterval);
    }
  }

  initForm(): void {
    this.topBarForm = this.fb.group({
      active: [false],
      message: ['', [Validators.required, Validators.maxLength(255)]],
      countdown_enabled: [false],
      countdown_date: [''],
      background_color: ['#1F2937', [Validators.required]],
      text_color: ['#FFFFFF', [Validators.required]]
    });

    // Actualizar validación de countdown_date cuando countdown_enabled cambie
    this.topBarForm.get('countdown_enabled')?.valueChanges.subscribe(enabled => {
      const countdownDateControl = this.topBarForm.get('countdown_date');
      if (enabled) {
        countdownDateControl?.setValidators([Validators.required]);
      } else {
        countdownDateControl?.clearValidators();
      }
      countdownDateControl?.updateValueAndValidity();
    });
  }

  loadTopBarSettings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.topBarService.getTopBarSettings().subscribe({
      next: (settings) => {
        this.currentSettings = settings;
        this.topBarForm.patchValue({
          active: settings.active,
          message: settings.message,
          countdown_enabled: settings.countdown_enabled,
          countdown_date: settings.countdown_date,
          background_color: settings.background_color,
          text_color: settings.text_color
        });
        this.isLoading = false;
        this.autoRetrying = false;
      },
      error: (error) => {
        console.error('Error loading top bar settings', error);
        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Serás redirigido a la página de inicio de sesión.';
          this.handleSessionExpired();
        } else {
          this.errorMessage = 'Error al cargar la configuración de la barra superior. Inténtalo de nuevo más tarde.';

          // Reintento automático para errores de conexión
          if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
            this.autoRetrying = true;
            this.errorMessage = 'Reestableciendo conexión...';
            setTimeout(() => {
              this.autoRetrying = false;
              this.loadTopBarSettings();
            }, 1000);
          }
        }
      }
    });
  }

  startPreviewCountdown(): void {
    // Actualizar countdown preview cada segundo
    this.previewInterval = setInterval(() => {
      const countdownDate = this.topBarForm.get('countdown_date')?.value;
      if (countdownDate && this.topBarForm.get('countdown_enabled')?.value) {
        this.previewCountdown = this.topBarService.getCountdownTime(countdownDate);
      } else {
        this.previewCountdown = null;
      }
    }, 1000);
  }

  onSubmit(): void {
    if (this.topBarForm.invalid) {
      // Marcar todos los controles como tocados para mostrar errores
      Object.keys(this.topBarForm.controls).forEach(key => {
        this.topBarForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.autoRetrying = false;

    const formValue = this.topBarForm.value;
    const settings: Partial<TopBarSettings> = {
      active: formValue.active,
      message: formValue.message,
      countdown_enabled: formValue.countdown_enabled,
      countdown_date: formValue.countdown_date || '',
      background_color: formValue.background_color,
      text_color: formValue.text_color
    };

    this.topBarService.updateTopBarSettings(settings).subscribe({
      next: () => {
        this.handleSuccess('Configuración de la barra superior guardada correctamente.');
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  resetToDefaults(): void {
    if (confirm('¿Estás seguro de que deseas restaurar la configuración predeterminada?')) {
      this.topBarForm.patchValue({
        active: false,
        message: '¡Envío gratis en compras mayores a $50!',
        countdown_enabled: false,
        countdown_date: '',
        background_color: '#1F2937',
        text_color: '#FFFFFF'
      });
    }
  }

  private handleSuccess(message: string): void {
    this.isSubmitting = false;
    this.successMessage = message;
    this.loadTopBarSettings();
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

  formatCountdown(time: { days: number; hours: number; minutes: number; seconds: number }): string {
    return this.topBarService.formatCountdown(time);
  }
}
