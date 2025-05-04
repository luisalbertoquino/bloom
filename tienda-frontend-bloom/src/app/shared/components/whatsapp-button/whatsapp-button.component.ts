// src/app/shared/components/whatsapp-button/whatsapp-button.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-whatsapp-button',
  templateUrl: './whatsapp-button.component.html',
  styleUrls: ['./whatsapp-button.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class WhatsappButtonComponent implements OnInit {
  whatsappNumber: string | null = null;
  showTooltip = false;
  message = '¡Hola! Me interesa un producto de tu tienda. 😊';

  constructor(private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.loadWhatsappNumber();
  }

  private loadWhatsappNumber(): void {
    this.settingsService.getSettings().subscribe(
      settings => {
        this.whatsappNumber = settings.whatsapp_number || null;
      },
      error => {
        console.error('Error loading WhatsApp number:', error);
      }
    );
  }

  getWhatsappUrl(): string {
    if (!this.whatsappNumber) return '#';
    // Eliminar caracteres no numéricos (paréntesis, espacios, guiones)
    const cleanNumber = this.whatsappNumber.replace(/[+\s()-]/g, '');
    // Añadir mensaje predeterminado
    const encodedMessage = encodeURIComponent(this.message);
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }

  toggleTooltip(show: boolean): void {
    this.showTooltip = show;
  }
}