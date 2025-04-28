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
        path: 'ajustes',
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  }
];