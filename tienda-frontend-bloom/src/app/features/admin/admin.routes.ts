// src/app/features/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'categorias',
        loadComponent: () => import('./category-management/category-management.component').then(m => m.CategoryManagementComponent)
      },
      {
        path: 'productos',
        loadComponent: () => import('./product-management/product-management.component').then(m => m.ProductManagementComponent)
      },
      {
        path: 'blog',
        loadComponent: () => import('./blog-management/blog-management.component').then(m => m.BlogManagementComponent)
      },
      {
        path: 'marketing',
        loadComponent: () => import('./marketing/marketing-layout.component').then(m => m.MarketingLayoutComponent),
        children: [
          {
            path: '',
            redirectTo: 'banners',
            pathMatch: 'full'
          },
          {
            path: 'banners',
            loadComponent: () => import('./marketing/banner-management/banner-management.component').then(m => m.BannerManagementComponent)
          },
          {
            path: 'popup',
            loadComponent: () => import('./marketing/popup-settings/popup-settings.component').then(m => m.PopupSettingsComponent)
          },
          {
            path: 'barra-superior',
            loadComponent: () => import('./marketing/top-bar-settings/top-bar-settings.component').then(m => m.TopBarSettingsComponent)
          },
          {
            path: 'analytics',
            loadComponent: () => import('./marketing/analytics/analytics.component').then(m => m.AnalyticsComponent)
          }
        ]
      },
      {
        path: 'ajustes',
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  }
];