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
        document.documentElement.style.setProperty('--color-primary', settings.primary_color);
        
        // Calcular una versión más oscura para hover
        document.documentElement.style.setProperty('--color-primary-dark', this.darkenColor(settings.primary_color, 15));
      }
      
      if (settings.secondary_color) {
        document.documentElement.style.setProperty('--color-secondary', settings.secondary_color);
      }
    });
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