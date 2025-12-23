import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, delay, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ProductCost {
  id: number;
  product_id: number;
  cost_price: number;
  sale_price: number;
  profit_margin: number;
  effective_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: number;
  type: 'shipping' | 'packaging' | 'advertising' | 'utilities' | 'rent' | 'salaries' | 'other';
  description: string;
  amount: number;
  expense_date: string;
  product_id?: number;
  notes?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  product?: any;
  user?: any;
}

export interface AccountingDashboard {
  period: {
    from: string;
    to: string;
  };
  summary: {
    total_sales: number;
    total_cost: number;
    gross_profit: number;
    total_expenses: number;
    net_profit: number;
    net_profit_margin: number;
  };
  expenses_by_type: { [key: string]: number };
  product_sales: Array<{
    product_name: string;
    quantity_sold: number;
    sales_total: number;
    cost_total: number;
    profit: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getTokenFromCookie(): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const parts = cookie.trim().split('=');
        if (parts.length > 1 && parts[0] === 'XSRF-TOKEN') {
          return decodeURIComponent(parts[1]);
        }
      }
    } catch (e) {
      console.warn('Error al obtener token CSRF:', e);
    }
    return null;
  }

  private createHeaders(): HttpHeaders {
    const token = this.getTokenFromCookie();
    return new HttpHeaders({
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'X-XSRF-TOKEN': token } : {})
    });
  }

  // =========== PRODUCT COSTS ===========

  getProductCosts(productId: number): Observable<ProductCost[]> {
    const headers = this.createHeaders();
    return this.http.get<ProductCost[]>(`${this.apiUrl}/products/${productId}/costs`, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al obtener costos del producto:', error);
        return throwError(() => error);
      })
    );
  }

  createProductCost(cost: Partial<ProductCost>): Observable<ProductCost> {
    const headers = this.createHeaders();
    return this.http.post<ProductCost>(`${this.apiUrl}/product-costs`, cost, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al crear costo:', error);
        return throwError(() => error);
      })
    );
  }

  updateProductCost(id: number, cost: Partial<ProductCost>): Observable<ProductCost> {
    const headers = this.createHeaders();
    return this.http.put<ProductCost>(`${this.apiUrl}/product-costs/${id}`, cost, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al actualizar costo:', error);
        return throwError(() => error);
      })
    );
  }

  deleteProductCost(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.delete(`${this.apiUrl}/product-costs/${id}`, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al eliminar costo:', error);
        return throwError(() => error);
      })
    );
  }

  // =========== EXPENSES ===========

  getExpenses(filters?: {
    type?: string;
    from_date?: string;
    to_date?: string;
    product_id?: number;
  }): Observable<Expense[]> {
    const headers = this.createHeaders();
    let params = new HttpParams();

    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.from_date) params = params.set('from_date', filters.from_date);
      if (filters.to_date) params = params.set('to_date', filters.to_date);
      if (filters.product_id) params = params.set('product_id', filters.product_id.toString());
    }

    return this.http.get<Expense[]>(`${this.apiUrl}/expenses`, {
      headers,
      params,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al obtener gastos:', error);
        return throwError(() => error);
      })
    );
  }

  createExpense(expense: Partial<Expense>): Observable<Expense> {
    const headers = this.createHeaders();
    return this.http.post<Expense>(`${this.apiUrl}/expenses`, expense, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al crear gasto:', error);
        return throwError(() => error);
      })
    );
  }

  updateExpense(id: number, expense: Partial<Expense>): Observable<Expense> {
    const headers = this.createHeaders();
    return this.http.put<Expense>(`${this.apiUrl}/expenses/${id}`, expense, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al actualizar gasto:', error);
        return throwError(() => error);
      })
    );
  }

  deleteExpense(id: number): Observable<any> {
    const headers = this.createHeaders();
    return this.http.delete(`${this.apiUrl}/expenses/${id}`, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al eliminar gasto:', error);
        return throwError(() => error);
      })
    );
  }

  // =========== DASHBOARD ===========

  getDashboard(fromDate?: string, toDate?: string): Observable<AccountingDashboard> {
    const headers = this.createHeaders();
    let params = new HttpParams();

    if (fromDate) params = params.set('from_date', fromDate);
    if (toDate) params = params.set('to_date', toDate);

    return this.http.get<AccountingDashboard>(`${this.apiUrl}/accounting/dashboard`, {
      headers,
      params,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al obtener dashboard:', error);
        return throwError(() => error);
      })
    );
  }

  getProductsWithoutCosts(): Observable<any[]> {
    const headers = this.createHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/accounting/products-without-costs`, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error al obtener productos sin costos:', error);
        return throwError(() => error);
      })
    );
  }
}
