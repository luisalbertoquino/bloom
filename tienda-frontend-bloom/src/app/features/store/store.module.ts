// src/app/features/store/store.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CartPopupComponent } from './cart-popup/cart-popup.component';

import { SharedModule } from '../../shared/shared.module';

import { HomeComponent } from './home/home.component';
// Importa otros componentes de la tienda aquí

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    HomeComponent,
    CartPopupComponent,
  ],
  exports: [
    HomeComponent
    // Exporta otros componentes si es necesario
  ]
})
export class StoreModule { }