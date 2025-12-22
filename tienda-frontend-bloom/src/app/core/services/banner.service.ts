// src/app/core/services/banner.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/environment';

export interface Banner {
  id: number;
  title?: string;
  description?: string;
  image: string;
  link?: string;
  order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private apiUrl = environment.apiUrl;

  constructor(private httpBase: HttpBaseService) {}

  /**
   * Obtener banners activos (público)
   */
  getActiveBanners(): Observable<Banner[]> {
    return this.httpBase.get<Banner[]>(`${this.apiUrl}/banners/active`).pipe(
      catchError(error => {
        console.error('Error loading active banners:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener todos los banners (admin)
   */
  getAllBanners(): Observable<Banner[]> {
    return this.httpBase.get<Banner[]>(`${this.apiUrl}/banners`).pipe(
      catchError(error => {
        console.error('Error loading banners:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener un banner específico
   */
  getBanner(id: number): Observable<Banner> {
    return this.httpBase.get<Banner>(`${this.apiUrl}/banners/${id}`);
  }

  /**
   * Crear un nuevo banner
   */
  createBanner(formData: FormData): Observable<any> {
    return this.httpBase.post<any>(`${this.apiUrl}/banners`, formData);
  }

  /**
   * Actualizar un banner existente
   */
  updateBanner(id: number, formData: FormData): Observable<any> {
    return this.httpBase.post<any>(`${this.apiUrl}/banners/${id}`, formData);
  }

  /**
   * Eliminar un banner
   */
  deleteBanner(id: number): Observable<any> {
    return this.httpBase.delete<any>(`${this.apiUrl}/banners/${id}`);
  }

  /**
   * Actualizar el orden de los banners
   */
  updateBannersOrder(banners: { id: number; order: number }[]): Observable<any> {
    return this.httpBase.post<any>(`${this.apiUrl}/banners/update-order`, { banners });
  }
}
