// src/app/shared/components/promotional-popup/promotional-popup.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopupService, PopupSetting } from '../../../core/services/popup.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-promotional-popup',
  templateUrl: './promotional-popup.component.html',
  styleUrls: ['./promotional-popup.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class PromotionalPopupComponent implements OnInit {
  popup: PopupSetting | null = null;
  isVisible = false;
  storageUrl = environment.storageUrl;

  constructor(private popupService: PopupService) {}

  ngOnInit(): void {
    this.loadPopup();
  }

  loadPopup(): void {
    this.popupService.getPopupSettings().subscribe({
      next: (popup) => {
        if (popup && popup.active) {
          this.popup = popup;
          this.schedulePopup(popup);
        }
      },
      error: (error) => {
        console.error('Error loading popup:', error);
      }
    });
  }

  schedulePopup(popup: PopupSetting): void {
    // Verificar si debemos mostrar el popup según la frecuencia
    if (!this.shouldShowPopup(popup.show_frequency)) {
      return;
    }

    // Mostrar el popup después del retraso configurado
    setTimeout(() => {
      this.isVisible = true;
      this.markPopupAsShown(popup.show_frequency);
    }, popup.delay_seconds * 1000);
  }

  shouldShowPopup(frequency: string): boolean {
    const now = new Date().getTime();

    switch (frequency) {
      case 'once':
        // Una vez por usuario (localStorage permanente)
        return !localStorage.getItem('popup_shown_once');

      case 'once_per_session':
        // Una vez por sesión (sessionStorage)
        return !sessionStorage.getItem('popup_shown_session');

      case 'once_per_day':
        // Una vez por día
        const lastShown = localStorage.getItem('popup_last_shown');
        if (!lastShown) return true;
        const dayInMs = 24 * 60 * 60 * 1000;
        return now - parseInt(lastShown) > dayInMs;

      case 'always':
        // Siempre mostrar
        return true;

      default:
        return true;
    }
  }

  markPopupAsShown(frequency: string): void {
    const now = new Date().getTime();

    switch (frequency) {
      case 'once':
        localStorage.setItem('popup_shown_once', 'true');
        break;

      case 'once_per_session':
        sessionStorage.setItem('popup_shown_session', 'true');
        break;

      case 'once_per_day':
        localStorage.setItem('popup_last_shown', now.toString());
        break;

      case 'always':
        // No marcar nada
        break;
    }
  }

  close(): void {
    this.isVisible = false;
  }

  onButtonClick(): void {
    if (this.popup?.button_link) {
      window.location.href = this.popup.button_link;
    }
    this.close();
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    return this.storageUrl + path;
  }

  hasOnlyImage(): boolean {
    // Retorna true si el modo solo imagen está activado O si no hay título, contenido ni botón
    return this.popup?.image_only_mode === true ||
           (!this.popup?.title && !this.popup?.content && !this.popup?.button_text);
  }
}
