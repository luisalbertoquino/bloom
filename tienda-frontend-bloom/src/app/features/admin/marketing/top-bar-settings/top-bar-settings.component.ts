// src/app/features/admin/marketing/top-bar-settings/top-bar-settings.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-bar-settings',
  template: `
    <div class="text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Configuración de Barra Superior</h3>
      <p class="text-gray-600">Próximamente: Crea barras promocionales con contador de ofertas</p>
    </div>
  `,
  standalone: true,
  imports: [CommonModule]
})
export class TopBarSettingsComponent {}
