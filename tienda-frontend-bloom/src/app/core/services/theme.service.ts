// src/app/core/services/theme.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { SettingsService } from './settings.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Almacenar la configuración actual del tema
  private temaActual = {
    colorPrimario: '',
    colorSecundario: ''
  };
  private isBrowser: boolean;

  constructor(
    private settingsService: SettingsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Obtener valores actuales del tema
  get tema() {
    return { ...this.temaActual };
  }

  initializeTheme(): void {
    if (!this.isBrowser) return;

    // Primero intentamos usar la caché
    const cachedSettings = this.settingsService.getCachedSettings();
    
    // Si hay configuración en caché con colores, la aplicamos directamente
    if (cachedSettings && (cachedSettings.primary_color || cachedSettings.secondary_color)) {
      this.applyTheme(cachedSettings);
    } else {
      // Si no hay caché o no tiene colores, hacemos la solicitud
      this.settingsService.getSettings().pipe(
        catchError(error => {
          console.error('Error loading theme settings', error);
          return of({}); // Devolver un objeto vacío en caso de error
        }),
        tap(settings => {
          // Almacenar valores actuales
          if (settings.primary_color) {
            this.temaActual.colorPrimario = settings.primary_color;
          }
          if (settings.secondary_color) {
            this.temaActual.colorSecundario = settings.secondary_color;
          }
        })
      ).subscribe(settings => {
        this.applyTheme(settings);
      });
    }
  }

  // Aplicar tema sin tener que solicitar la configuración nuevamente
  applyTheme(settings: any): void {
    if (!this.isBrowser) return;

    if (settings.primary_color) {
      // Almacenar valor actual
      this.temaActual.colorPrimario = settings.primary_color;
      
      // Aplicar color primario
      document.documentElement.style.setProperty('--color-primary', settings.primary_color);
      
      // Calcular versión más oscura para hover
      document.documentElement.style.setProperty('--color-primary-dark', this.darkenColor(settings.primary_color, 15));
      
      // Añadir versión RGB para usar en gradientes y transparencias
      const rgbValues = this.hexToRgb(settings.primary_color);
      if (rgbValues) {
        document.documentElement.style.setProperty('--primary-color-rgb', `${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b}`);
      }
    }
    
    if (settings.secondary_color) {
      // Almacenar valor actual
      this.temaActual.colorSecundario = settings.secondary_color;
      
      // Aplicar color secundario
      document.documentElement.style.setProperty('--color-secondary', settings.secondary_color);
      
      // Versión oscura del secundario
      document.documentElement.style.setProperty('--color-secondary-dark', this.darkenColor(settings.secondary_color, 15));
      
      // Añadir versión RGB
      const rgbValues = this.hexToRgb(settings.secondary_color);
      if (rgbValues) {
        document.documentElement.style.setProperty('--secondary-color-rgb', `${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b}`);
      }
    }
  }

  // Método para convertir hex a RGB
  private hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    // Eliminar el # si existe
    hex = hex.replace('#', '');
    
    // Procesar formatos de 3 dígitos (ej: #FFF)
    if (hex.length === 3) {
      hex = hex.split('').map(h => h + h).join('');
    }
    
    // Verificar que sea un hex válido
    if (hex.length !== 6) {
      return null;
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  // Función para oscurecer un color hexadecimal
  private darkenColor(hex: string, percent: number): string {
    // Eliminar el # si existe
    hex = hex.replace('#', '');
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const factor = (100 - percent) / 100;
    
    const dr = Math.floor(r * factor);
    const dg = Math.floor(g * factor);
    const db = Math.floor(b * factor);
    
    return `#${this.toHex(dr)}${this.toHex(dg)}${this.toHex(db)}`;
  }
  
  private toHex(value: number): string {
    const hex = value.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  }

  // Método para aclarar un color para versiones light
  lightColor(hex: string, percent: number): string {
    // Eliminar el # si existe
    hex = hex.replace('#', '');
    
    // Convertir a RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Aclarar
    const factor = 1 + (percent / 100);
    
    // Asegurar que no supere 255
    const lr = Math.min(Math.floor(r * factor), 255);
    const lg = Math.min(Math.floor(g * factor), 255);
    const lb = Math.min(Math.floor(b * factor), 255);
    
    return `#${this.toHex(lr)}${this.toHex(lg)}${this.toHex(lb)}`;
  }

  // Método para resetear a colores por defecto
  resetToDefaults(): void {
    // Colores predeterminados
    const defaults = {
      primary_color: '#fc6280',
      secondary_color: '#f8a5c2'
    };
    
    // Aplicar colores predeterminados
    this.applyTheme(defaults);
  }
}