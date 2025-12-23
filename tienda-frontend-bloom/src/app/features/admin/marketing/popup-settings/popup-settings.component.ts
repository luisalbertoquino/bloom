// src/app/features/admin/marketing/popup-settings/popup-settings.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-popup-settings',
  template: `
    <div class="text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Configuración de Popup</h3>
      <p class="text-gray-600">Próximamente: Gestiona popups promocionales para tu tienda</p>
    </div>
  `,
  standalone: true,
  imports: [CommonModule]
})
export class PopupSettingsComponent {}
