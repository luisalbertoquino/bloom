// src/app/shared/components/top-bar/top-bar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopBarService, TopBarSettings } from '../../../core/services/top-bar.service';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TopBarComponent implements OnInit, OnDestroy {
  settings: TopBarSettings | null = null;
  countdown: { days: number; hours: number; minutes: number; seconds: number } | null = null;
  countdownInterval: any;
  isVisible = false;

  constructor(private topBarService: TopBarService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  loadSettings(): void {
    this.topBarService.getTopBarSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.isVisible = settings.active;

        if (settings.active && settings.countdown_enabled && settings.countdown_date) {
          this.startCountdown();
        }
      },
      error: (error) => {
        console.error('Error loading top bar settings:', error);
        this.isVisible = false;
      }
    });
  }

  startCountdown(): void {
    // Actualizar contador cada segundo
    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown(): void {
    if (!this.settings || !this.settings.countdown_date) {
      this.countdown = null;
      return;
    }

    this.countdown = this.topBarService.getCountdownTime(this.settings.countdown_date);

    // Si el countdown llegó a cero, detener el intervalo
    if (this.countdown && this.countdown.days === 0 && this.countdown.hours === 0 &&
        this.countdown.minutes === 0 && this.countdown.seconds === 0) {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    }
  }

  formatCountdown(): string {
    if (!this.countdown) return '';
    return this.topBarService.formatCountdown(this.countdown);
  }

  close(): void {
    this.isVisible = false;
  }
}
