import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SettingsService } from './settings.service';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/environment';

export interface TopBarSettings {
  active: boolean;
  message: string;
  countdown_enabled: boolean;
  countdown_date: string;
  background_color: string;
  text_color: string;
}

@Injectable({
  providedIn: 'root'
})
export class TopBarService {
  private apiUrl = environment.apiUrl;

  constructor(
    private settingsService: SettingsService,
    private httpBase: HttpBaseService
  ) {}

  // Obtener configuración de la top bar desde settings
  getTopBarSettings(): Observable<TopBarSettings> {
    return this.settingsService.getSettings().pipe(
      map(settings => {
        return {
          active: settings.top_bar_active === 'true' || settings.top_bar_active === true,
          message: settings.top_bar_message || '¡Envío gratis en compras mayores a $50!',
          countdown_enabled: settings.top_bar_countdown_enabled === 'true' || settings.top_bar_countdown_enabled === true,
          countdown_date: settings.top_bar_countdown_date || '',
          background_color: settings.top_bar_background_color || '#1F2937',
          text_color: settings.top_bar_text_color || '#FFFFFF'
        };
      }),
      catchError(error => {
        console.error('Error loading top bar settings:', error);
        // Retornar configuración por defecto
        return of({
          active: false,
          message: '¡Envío gratis en compras mayores a $50!',
          countdown_enabled: false,
          countdown_date: '',
          background_color: '#1F2937',
          text_color: '#FFFFFF'
        });
      })
    );
  }

  // Actualizar configuración de la top bar
  updateTopBarSettings(settings: Partial<TopBarSettings>): Observable<any> {
    const formData = new FormData();

    if (settings.active !== undefined) {
      formData.append('top_bar_active', settings.active ? 'true' : 'false');
    }
    if (settings.message !== undefined) {
      formData.append('top_bar_message', settings.message);
    }
    if (settings.countdown_enabled !== undefined) {
      formData.append('top_bar_countdown_enabled', settings.countdown_enabled ? 'true' : 'false');
    }
    if (settings.countdown_date !== undefined) {
      formData.append('top_bar_countdown_date', settings.countdown_date);
    }
    if (settings.background_color !== undefined) {
      formData.append('top_bar_background_color', settings.background_color);
    }
    if (settings.text_color !== undefined) {
      formData.append('top_bar_text_color', settings.text_color);
    }

    return this.settingsService.updateSettings(formData);
  }

  // Calcular tiempo restante para el countdown
  getCountdownTime(targetDate: string): { days: number; hours: number; minutes: number; seconds: number } | null {
    if (!targetDate) return null;

    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }

  // Formatear tiempo de countdown
  formatCountdown(time: { days: number; hours: number; minutes: number; seconds: number }): string {
    const parts: string[] = [];

    if (time.days > 0) {
      parts.push(`${time.days}d`);
    }
    if (time.hours > 0 || time.days > 0) {
      parts.push(`${time.hours.toString().padStart(2, '0')}h`);
    }
    parts.push(`${time.minutes.toString().padStart(2, '0')}m`);
    parts.push(`${time.seconds.toString().padStart(2, '0')}s`);

    return parts.join(' ');
  }
}
