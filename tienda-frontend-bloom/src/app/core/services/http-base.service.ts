import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Definir una interfaz para las opciones HTTP
interface HttpOptions {
  headers?: HttpHeaders | {[header: string]: string | string[]};
  context?: HttpContext;
  observe?: 'body';
  params?: HttpParams | {[param: string]: string | number | boolean | readonly (string | number | boolean)[]};
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HttpBaseService {
  private apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}
  
  get<T>(url: string, options: HttpOptions = {}): Observable<T> {
    const requestOptions: HttpOptions = { 
      ...options, 
      withCredentials: true
    };
    
    return this.http.get<T>(url, requestOptions);
  }
  
  post<T>(url: string, body: any = {}, options: HttpOptions = {}): Observable<T> {
    const requestOptions: HttpOptions = { 
      ...options, 
      withCredentials: true
    };
    
    return this.http.post<T>(url, body, requestOptions);
  }
  
  put<T>(url: string, body: any = {}, options: HttpOptions = {}): Observable<T> {
    const requestOptions: HttpOptions = { 
      ...options, 
      withCredentials: true
    };
    
    return this.http.put<T>(url, body, requestOptions);
  }
  
  patch<T>(url: string, body: any = {}, options: HttpOptions = {}): Observable<T> {
    const requestOptions: HttpOptions = { 
      ...options, 
      withCredentials: true
    };
    
    return this.http.patch<T>(url, body, requestOptions);
  }
  
  delete<T>(url: string, options: HttpOptions = {}): Observable<T> {
    const requestOptions: HttpOptions = { 
      ...options, 
      withCredentials: true
    };
    
    return this.http.delete<T>(url, requestOptions);
  }
}