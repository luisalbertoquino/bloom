// src/app/shared/components/footer/footer.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class FooterComponent implements OnInit {
  siteTitle = 'Bloom Accesorios';
  footerText = 'Tu tienda de accesorios favorita con los diseños más modernos y elegantes.';
  address = 'Calle Principal #123, Ciudad';
  phone = '(123) 456-7890';
  email = 'info@bloomaccesorios.com';
  currentYear = new Date().getFullYear();
  
  // Redes sociales
  facebook: string | null = null;
  instagram: string | null = null;
  twitter: string | null = null;
  youtube: string | null = null;
  whatsapp: string | null = null;

  constructor(private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.settingsService.getSettings().subscribe(
      settings => {
        if (settings.site_title) {
          this.siteTitle = settings.site_title;
        }
        if (settings.footer_text) {
          this.footerText = settings.footer_text;
        }
        if (settings.address) {
          this.address = settings.address;
        }
        if (settings.phone) {
          this.phone = settings.phone;
        }
        if (settings.email) {
          this.email = settings.email;
        }
        
        // Cargar redes sociales
        this.facebook = settings.facebook || null;
        this.instagram = settings.instagram || null;
        this.twitter = settings.twitter || null;
        this.youtube = settings.youtube || null;
        this.whatsapp = settings.whatsapp_number || null;
      },
      error => {
        console.error('Error loading settings', error);
      }
    );
  }
  
  // Método para construir URL completa de Facebook
  getFacebookUrl(): string {
    return this.facebook ? `https://facebook.com/${this.facebook}` : '#';
  }
  
  // Método para construir URL completa de Instagram
  getInstagramUrl(): string {
    return this.instagram ? `https://instagram.com/${this.instagram}` : '#';
  }
  
  // Método para construir URL completa de Twitter
  getTwitterUrl(): string {
    return this.twitter ? `https://twitter.com/${this.twitter}` : '#';
  }
  
  // Método para construir URL completa de YouTube
  getYoutubeUrl(): string {
    return this.youtube ? `https://youtube.com/${this.youtube}` : '#';
  }
  
  // Método para construir URL de WhatsApp
  getWhatsappUrl(): string {
    return this.whatsapp ? `https://wa.me/${this.whatsapp.replace(/[+\s()-]/g, '')}` : '#';
  }
}