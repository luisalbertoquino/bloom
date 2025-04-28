// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Rutas públicas
  {
    path: '',
    loadComponent: () => import('./features/store/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/admin/login/login.component').then(m => m.LoginComponent)
  },
  // ¡IMPORTANTE! - Ruta de categoría antes de la ruta de detalle por ID
  {
    path: 'productos/categoria/:id',
    loadComponent: () => import('./features/store/product-category/product-category.component').then(m => m.ProductCategoryComponent)
  },
  {
    path: 'productos/:id',
    loadComponent: () => import('./features/store/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'productos',
    loadComponent: () => import('./features/store/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'blog/:id',
    loadComponent: () => import('./features/store/blog-detail/blog-detail.component').then(m => m.BlogDetailComponent)
  },
  {
    path: 'blog',
    // Puedes crear un componente blog-list para listar todos los artículos
    loadComponent: () => import('./features/store/blog-list/blog-list.component').then(m => m.BlogListComponent)
  },
  {
    path: 'carrito',
    loadComponent: () => import('./features/store/cart/cart.component').then(m => m.CartComponent)
  },
  
  // Rutas administrativas protegidas por AuthGuard
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [AuthGuard]
  },
  
  // Ruta por defecto
  {
    path: '**',
    redirectTo: ''
  }
];