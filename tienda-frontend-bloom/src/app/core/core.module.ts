// src/app/core/core.module.ts
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { HttpBaseService } from './services/http-base.service';
import { SettingsService } from './services/settings.service';
import { CookieCleanupService } from './services/cookie-cleanup.service';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    AuthService,
    HttpBaseService,
    SettingsService,
    CookieCleanupService
  ]
})
export class CoreModule {
  // Constructor para prevenir la importación múltiple del módulo
  constructor(
    @Optional() @SkipSelf() parentModule: CoreModule,
    // Inyectar CookieCleanupService para inicializarlo
    private cookieCleanupService: CookieCleanupService
  ) {
    if (parentModule) {
      throw new Error(
        'CoreModule ya está cargado. Importalo solo en AppModule.'
      );
    }
    
    // Ejecutar limpieza inicial al cargar la aplicación
    this.cookieCleanupService.cleanupCookies();
  }
}