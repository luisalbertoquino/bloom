// src/app/features/admin/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { environment } from '../../../../environments/enviroment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  logoUrl: string | null = null;
  
  // Información de contacto fija
  whatsappNumber: string = '+573042483977';
  contactEmail: string = 'luisalbertoquino@gmail.com';
  
  // Para manejar las suscripciones y evitar memory leaks
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private settingsService: SettingsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Inicializar el formulario
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Redirigir si ya está autenticado
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/admin']);
      return;
    }
    
    // Cargar solo el logo desde las configuraciones
    this.loadLogo();
    
    // Limpiar mensajes de error cuando el usuario modifica el formulario
    const formChanges = this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = '';
      }
    });
    
    this.subscriptions.push(formChanges);
  }
  
  ngOnDestroy(): void {
    // Limpiar todas las suscripciones cuando el componente se destruye
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.isSubmitting = false;
    this.errorMessage = '';
  }
  
  // Método para generar el enlace de WhatsApp
  getWhatsappHelpLink(): string {
    // Formatear el número para el enlace de WhatsApp (eliminar caracteres no numéricos)
    const formattedNumber = this.whatsappNumber.replace(/[^0-9+]/g, '');
    
    // Crear el mensaje predefinido
    const message = encodeURIComponent('Hola, tengo problemas para ingresar a mi tienda. ¿Podrías ayudarme?');
    
    // Construir el enlace completo
    return `https://wa.me/${formattedNumber}?text=${message}`;
  }
  
  // Método para generar el enlace de correo
  getEmailHelpLink(): string {
    const subject = encodeURIComponent('Problemas para ingresar a mi tienda');
    const body = encodeURIComponent('Hola,\n\nEstoy teniendo problemas para ingresar a mi tienda. ¿Podrías ayudarme?\n\nGracias.');
    
    return `mailto:${this.contactEmail}?subject=${subject}&body=${body}`;
  }
  
  // Cargar el logo del sitio
  loadLogo(): void {
    const logoSub = this.settingsService.getSettings().subscribe({
      next: settings => {
        if (settings.logo) {
          this.logoUrl = environment.storageUrl + settings.logo;
        }
      },
      error: error => {
        console.error('Error loading logo', error);
      }
    });
    
    this.subscriptions.push(logoSub);
  }

  // Método para enviar el formulario
  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    const loginSub = this.authService.login(email, password).subscribe({
      next: () => {
        // La redirección se maneja ahora en el AuthService
        console.log('Login exitoso');
      },
      error: (error) => {
        this.isSubmitting = false;
        
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.error && error.error.errors) {
          if (error.error.errors.email) {
            this.errorMessage = error.error.errors.email[0];
          } else if (error.error.errors.password) {
            this.errorMessage = error.error.errors.password[0];
          } else {
            this.errorMessage = 'Error de validación. Por favor, verifica tus datos.';
          }
        } else {
          this.errorMessage = 'Error al iniciar sesión. Por favor, intenta de nuevo.';
        }
        
        console.error('Error de login:', error);
      }
    });
    
    this.subscriptions.push(loginSub);
  }

  // Getters para acceder fácilmente a los campos del formulario y su estado
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  
  // Helpers para verificar los estados de los campos
  hasEmailErrors(): boolean {
    return !!(this.email?.invalid && (this.email?.dirty || this.email?.touched));
  }
  
  hasPasswordErrors(): boolean {
    return !!(this.password?.invalid && (this.password?.dirty || this.password?.touched));
  }
  
  getEmailErrorMessage(): string {
    if (this.email?.errors?.['required']) {
      return 'El correo electrónico es obligatorio';
    }
    if (this.email?.errors?.['email']) {
      return 'Por favor, ingresa un correo electrónico válido';
    }
    return '';
  }
  
  getPasswordErrorMessage(): string {
    if (this.password?.errors?.['required']) {
      return 'La contraseña es obligatoria';
    }
    if (this.password?.errors?.['minlength']) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }
}