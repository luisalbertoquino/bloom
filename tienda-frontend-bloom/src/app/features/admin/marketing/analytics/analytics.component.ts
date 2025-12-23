// src/app/features/admin/marketing/analytics/analytics.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, AnalyticsStats } from '../../../../core/services/analytics.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AnalyticsComponent implements OnInit {
  stats: AnalyticsStats | null = null;
  isLoading = true;
  errorMessage = '';
  autoRetrying = false;

  constructor(
    private analyticsService: AnalyticsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.analyticsService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
        this.autoRetrying = false;
      },
      error: (error) => {
        console.error('Error loading analytics', error);
        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Serás redirigido a la página de inicio de sesión.';
          this.handleSessionExpired();
        } else {
          this.errorMessage = 'Error al cargar las estadísticas. Inténtalo de nuevo más tarde.';

          // Reintento automático para errores de conexión
          if ((error.status === 0 || error.status === 431 || error.status === 419) && !this.autoRetrying) {
            this.autoRetrying = true;
            this.errorMessage = 'Reestableciendo conexión...';
            setTimeout(() => {
              this.autoRetrying = false;
              this.loadAnalytics();
            }, 1000);
          }
        }
      }
    });
  }

  refreshAnalytics(): void {
    this.loadAnalytics();
  }

  private handleSessionExpired(): void {
    setTimeout(() => {
      this.authService.logout().subscribe({
        next: () => {
          // La redirección se maneja en el servicio AuthService
        },
        error: () => {
          window.location.href = '/login';
        }
      });
    }, 2000);
  }

  formatDuration(seconds: number): string {
    return this.analyticsService.formatDuration(seconds);
  }

  getReferrerName(referrer: string): string {
    return this.analyticsService.getReferrerName(referrer);
  }

  getReferrerIcon(referrer: string): string {
    const name = this.getReferrerName(referrer).toLowerCase();

    // Retornar clases de color según el referrer
    if (name === 'facebook') return 'text-blue-600';
    if (name === 'instagram') return 'text-pink-600';
    if (name === 'twitter/x') return 'text-sky-500';
    if (name === 'linkedin') return 'text-blue-700';
    if (name === 'google') return 'text-red-500';
    if (name === 'directo') return 'text-green-600';

    return 'text-gray-600';
  }

  getMaxCount(items: Array<{ count: number }>): number {
    if (!items || items.length === 0) return 0;
    return Math.max(...items.map(item => item.count));
  }

  getBarWidth(count: number, maxCount: number): number {
    if (maxCount === 0) return 0;
    return (count / maxCount) * 100;
  }
}
