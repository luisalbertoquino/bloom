// src/app/features/admin/marketing/marketing-layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-marketing-layout',
  template: `
    <div class="bg-white shadow-sm rounded-lg">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h1 class="text-xl font-semibold text-gray-800">Marketing</h1>
        <p class="text-gray-600 mt-1">Gestiona banners, popups, barras promocionales y estadísticas</p>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px px-6" aria-label="Tabs">
          <a routerLink="/admin/marketing/banners"
             routerLinkActive="border-primary text-primary"
             class="whitespace-nowrap py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Banners
            </div>
          </a>

          <a routerLink="/admin/marketing/popup"
             routerLinkActive="border-primary text-primary"
             class="whitespace-nowrap py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Popup
            </div>
          </a>

          <a routerLink="/admin/marketing/barra-superior"
             routerLinkActive="border-primary text-primary"
             class="whitespace-nowrap py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Barra Superior
            </div>
          </a>

          <a routerLink="/admin/marketing/analytics"
             routerLinkActive="border-primary text-primary"
             class="whitespace-nowrap py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </div>
          </a>
        </nav>
      </div>

      <!-- Content Area -->
      <div class="p-6">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class MarketingLayoutComponent {}
