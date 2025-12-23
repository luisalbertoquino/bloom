import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../../environments/environment';

export interface AnalyticsStats {
  visits_today: number;
  visits_week: number;
  visits_month: number;
  avg_duration: number;
  top_pages: Array<{ page_url: string; count: number }>;
  top_referrers: Array<{ referrer: string; count: number }>;
  visits_by_day: Array<{ date: string; count: number }>;
}

export interface VisitTrackingData {
  page_url: string;
  referrer: string;
  session_id: string;
}

export interface VisitResponse {
  visit_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = environment.apiUrl;
  private sessionId: string;

  constructor(private httpBase: HttpBaseService) {
    // Generar o recuperar session_id desde localStorage
    const existingSessionId = localStorage.getItem('analytics_session_id');
    if (existingSessionId) {
      this.sessionId = existingSessionId;
    } else {
      this.sessionId = this.generateSessionId();
      localStorage.setItem('analytics_session_id', this.sessionId);
    }
  }

  // Generar un ID de sesión único
  private generateSessionId(): string {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Obtener el session ID actual
  getSessionId(): string {
    return this.sessionId;
  }

  // Rastrear visita a una página
  trackPageVisit(pageUrl: string, referrer: string = ''): Observable<VisitResponse | null> {
    const data: VisitTrackingData = {
      page_url: pageUrl,
      referrer: referrer || document.referrer,
      session_id: this.sessionId
    };

    return this.httpBase.post<VisitResponse>(`${this.apiUrl}/analytics/track`, data).pipe(
      catchError(error => {
        console.error('Error tracking page visit:', error);
        return of(null);
      })
    );
  }

  // Actualizar duración de la visita
  updateVisitDuration(visitId: number, duration: number): Observable<any> {
    return this.httpBase.put<any>(`${this.apiUrl}/analytics/duration/${visitId}`, { visit_duration: duration }).pipe(
      catchError(error => {
        console.error('Error updating visit duration:', error);
        return of(null);
      })
    );
  }

  // Obtener estadísticas del dashboard (solo para admin)
  getDashboardStats(): Observable<AnalyticsStats | null> {
    return this.httpBase.get<AnalyticsStats>(`${this.apiUrl}/analytics/dashboard`).pipe(
      catchError(error => {
        console.error('Error loading analytics dashboard:', error);
        return of(null);
      })
    );
  }

  // Formatear duración en segundos a formato legible
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  // Obtener nombre legible del referrer
  getReferrerName(referrer: string): string {
    if (!referrer || referrer === '') {
      return 'Directo';
    }

    try {
      const url = new URL(referrer);
      const hostname = url.hostname.replace('www.', '');

      // Detectar redes sociales comunes
      if (hostname.includes('facebook.com')) return 'Facebook';
      if (hostname.includes('instagram.com')) return 'Instagram';
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter/X';
      if (hostname.includes('linkedin.com')) return 'LinkedIn';
      if (hostname.includes('tiktok.com')) return 'TikTok';
      if (hostname.includes('youtube.com')) return 'YouTube';
      if (hostname.includes('pinterest.com')) return 'Pinterest';
      if (hostname.includes('reddit.com')) return 'Reddit';

      // Detectar motores de búsqueda
      if (hostname.includes('google.com')) return 'Google';
      if (hostname.includes('bing.com')) return 'Bing';
      if (hostname.includes('yahoo.com')) return 'Yahoo';
      if (hostname.includes('duckduckgo.com')) return 'DuckDuckGo';

      return hostname;
    } catch {
      return 'Otro';
    }
  }
}
