// src/app/shared/components/app-loader/app-loader.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    <div class="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div class="flex flex-col items-center">
        <div class="w-16 h-16 border-t-4 border-b-4 border-primary rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-700">Cargando aplicación...</p>
      </div>
    </div>
  `
})
export class AppLoaderComponent {}