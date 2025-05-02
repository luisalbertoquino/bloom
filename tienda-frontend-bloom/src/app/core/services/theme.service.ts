// src/app/core/services/theme.service.ts
import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  constructor(private settingsService: SettingsService) { }

  initializeTheme(): void {
    this.settingsService.getSettings().pipe(
      catchError(error => {
        console.error('Error loading theme settings', error);
        return of({}); // Devolver un objeto vacío en caso de error
      })
    ).subscribe(settings => {
      if (settings.primary_color) {
        // Aplicar color primario
        document.documentElement.style.setProperty('--color-primary', settings.primary_color);
        
        // Calcular una versión más oscura para hover
        document.documentElement.style.setProperty('--color-primary-dark', this.darkenColor(settings.primary_color, 15));
        
        // Añadir versión RGB para usar en gradientes y transparencias
        const rgbValues = this.hexToRgb(settings.primary_color);
        if (rgbValues) {
          document.documentElement.style.setProperty('--primary-color-rgb', `${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b}`);
        }
      }
      
      if (settings.secondary_color) {
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
    });
  }

  // Añadir un método para convertir hex a RGB
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


  
}


