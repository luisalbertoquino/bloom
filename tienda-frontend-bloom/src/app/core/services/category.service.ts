// src/app/core/services/category.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, delay } from 'rxjs/operators';
import { CookieManagerService } from './cookie-manager.service';

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = environment.apiUrl;

  constructor(
    private httpBase: HttpBaseService,
    private http: HttpClient,
    private cookieManager: CookieManagerService
  ) { }

  // Obtener todas las categorías con reintentos automáticos
  getCategories(): Observable<Category[]> {
    return this.httpBase.get<Category[]>(`${this.apiUrl}/categories`).pipe(
      catchError((error) => {
        console.error('Error al obtener categorías:', error);
        
        if (error.status === 0 || error.status === 431 || error.status === 419) {
          // Limpiar cookies antes de reintentar
          this.cookieManager.cleanRouteCookies();
          console.log('Reintentando obtener categorías después de limpiar cookies...');
          return of([]).pipe(
            delay(800),
            retry(1)
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  // Obtener una categoría por ID
  getCategory(id: number): Observable<Category> {
    return this.httpBase.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  // Crear categoría (simplificado usando httpBase)
  // Modificar createCategory en category.service.ts
createCategory(formData: FormData): Observable<Category> {
  // Asegurarse de que el token CSRF esté actualizado antes de enviar
  return this.httpBase.post<Category>(`${this.apiUrl}/categories`, formData).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Error al crear categoría:', error);
      
      // Si es un error 401, enviar evento de sesión expirada
      if (error.status === 401) {
        const expiredEvent = new CustomEvent('session-expired', {
          detail: { message: 'Tu sesión ha expirado, por favor vuelve a iniciar sesión.' }
        });
        window.dispatchEvent(expiredEvent);
      }
      
      return throwError(() => error);
    })
  );
}

/// Actualizar categoría con mejor manejo de errores y renovación de token
updateCategory(id: number, formData: FormData): Observable<Category> {
  formData.append('_method', 'PUT');
  
  // Primero intentamos obtener un token CSRF fresco
  return this.httpBase.post<Category>(`${this.apiUrl}/categories/${id}`, formData).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`Error al actualizar categoría ${id}:`, error);
      
      // Manejar errores específicos
      if (error.status === 401) {
        // Error de autenticación - sesión expirada
        const expiredEvent = new CustomEvent('session-expired', {
          detail: { message: 'Tu sesión ha expirado, por favor vuelve a iniciar sesión.' }
        });
        window.dispatchEvent(expiredEvent);
      } 
      else if (error.status === 419 || error.status === 431) {
        // Error de CSRF o encabezados - intentar renovar token
        console.log('Error CSRF/Encabezados al actualizar. Renovando token...');
        
        // Limpiar solo las cookies no esenciales
        this.cookieManager.cleanNonEssentialCookies();
        
        // No reintentar automáticamente, deja que el componente lo maneje
        const csrfEvent = new CustomEvent('csrf-error', {
          detail: { 
            message: 'Error de seguridad. Por favor, intenta de nuevo.',
            retryFunction: () => this.updateCategory(id, formData)
          }
        });
        window.dispatchEvent(csrfEvent);
      }
      
      return throwError(() => error);
    })
  );
}

// Eliminar categoría con mejor manejo de errores
deleteCategory(id: number): Observable<any> {
  return this.httpBase.delete<any>(`${this.apiUrl}/categories/${id}`).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`Error al eliminar categoría ${id}:`, error);
      
      // Manejar errores específicos
      if (error.status === 401) {
        // Error de autenticación - sesión expirada
        const expiredEvent = new CustomEvent('session-expired', {
          detail: { message: 'Tu sesión ha expirado, por favor vuelve a iniciar sesión.' }
        });
        window.dispatchEvent(expiredEvent);
      } 
      else if (error.status === 419 || error.status === 431) {
        // Error de CSRF o encabezados - intentar renovar token
        console.log('Error CSRF/Encabezados al eliminar. Renovando token...');
        
        // Limpiar solo las cookies no esenciales
        this.cookieManager.cleanNonEssentialCookies();
        
        // No reintentar automáticamente, deja que el componente lo maneje
        const csrfEvent = new CustomEvent('csrf-error', {
          detail: { 
            message: 'Error de seguridad. Por favor, intenta de nuevo.',
            retryFunction: () => this.deleteCategory(id)
          }
        });
        window.dispatchEvent(csrfEvent);
      }
      
      return throwError(() => error);
    })
  );
}
}