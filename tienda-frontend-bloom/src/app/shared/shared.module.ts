// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { CartPopupComponent } from '../features/store/cart-popup/cart-popup.component';
// Importa otros componentes compartidos

@NgModule({
  
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FooterComponent,
    CartPopupComponent
  ],
  exports: [
    NavbarComponent,
    FooterComponent,
    CartPopupComponent
    // Exporta otros componentes compartidos
  ]
})
export class SharedModule { }