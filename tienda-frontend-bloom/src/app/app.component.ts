import { Component, OnInit, Inject, PLATFORM_ID, APP_INITIALIZER } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ThemeService } from './core/services/theme.service';
import { SettingsService } from './core/services/settings.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  private isBrowser: boolean;
  public settingsLoaded = false;
  
  constructor(
    private themeService: ThemeService,
    private settingsService: SettingsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit(): Promise<void> {
    if (this.isBrowser) {
      try {
        // Cargar configuraciones primero y esperar a que completen
        const settings = await firstValueFrom(this.settingsService.getSettings());
        
        // Una vez cargada la configuración, aplicar tema y otros ajustes
        this.themeService.initializeTheme();
        
        if (settings.site_title) {
          document.title = settings.site_title;
        }
        
        if (settings.banner_image) {
          this.settingsService.setFavicon(settings.banner_image);
        }
        
        this.settingsLoaded = true;
      } catch (error) {
        console.error('Error initializing application:', error);
        // Aún así marcamos como cargado para que la UI muestre algo
        this.settingsLoaded = true;
      }
    }
  }
}