import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';



@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Método para peticiones GET
  get<T>(endpoint: string, options = {}): Observable<T> {
    console.log(`Making GET request to: ${this.apiUrl}/${endpoint}`);

    const requestOptions = {
      withCredentials: true,
      ...options
    };
    
    // Detección robusta de entorno de servidor
    const isServer = typeof window === 'undefined' || 
                     (typeof process !== 'undefined' && process.versions && process.versions.node);
    
    // Si estamos en el servidor durante SSR, devuelve datos de prueba
    if (isServer) {
      console.log('Server environment detected, returning mock data');
      return of({} as T);
    }
    
    // En navegador, haz la petición real
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, requestOptions)
    .pipe(catchError(error => {
      console.error(`Error in GET request to ${endpoint}:`, error);
      return of({} as T);
    }));
  }

  // Método para peticiones POST
post<T>(endpoint: string, data: any, options = {}): Observable<T> {
  const requestOptions = {
    withCredentials: true,
    ...options
  };
  
  return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data, requestOptions);
}

// Método para peticiones PUT
put<T>(endpoint: string, data: any, options = {}): Observable<T> {
  const requestOptions = {
    withCredentials: true,
    ...options
  };
  
  return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data, requestOptions);
}

// Método para peticiones DELETE
delete<T>(endpoint: string, options = {}): Observable<T> {
  const requestOptions = {
    withCredentials: true,
    ...options
  };
  
  return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, requestOptions);
}

// Método para peticiones PATCH
patch<T>(endpoint: string, data: any, options = {}): Observable<T> {
  const requestOptions = {
    withCredentials: true,
    ...options
  };
  
  return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, data, requestOptions);
}
}