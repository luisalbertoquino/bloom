// src/app/core/services/popup.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/environment';

export interface PopupSetting {
  id: number;
  active: boolean;
  image_only_mode?: boolean;
  title?: string;
  content?: string;
  image?: string;
  button_text?: string;
  button_link?: string;
  show_frequency: string; // once, always, once_per_day, once_per_session
  delay_seconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private apiUrl = environment.apiUrl;

  constructor(private httpBase: HttpBaseService) {}

  /**
   * Obtener configuración del popup (público)
   */
  getPopupSettings(): Observable<PopupSetting | null> {
    return this.httpBase.get<PopupSetting>(`${this.apiUrl}/popup`).pipe(
      catchError(error => {
        console.error('Error loading popup settings:', error);
        return of(null);
      })
    );
  }

  /**
   * Actualizar configuración del popup (admin)
   */
  updatePopupSettings(formData: FormData): Observable<any> {
    return this.httpBase.post<any>(`${this.apiUrl}/popup`, formData);
  }
}
