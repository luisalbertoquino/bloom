// src/app/core/services/loader.service.ts
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
  })
  export class LoaderService {
    private loaderVisibleSubject = new BehaviorSubject<boolean>(false);
    private loaderMessageSubject = new BehaviorSubject<string>('Cargando...');
    
    public loaderVisible$ = this.loaderVisibleSubject.asObservable();
    public loaderMessage$ = this.loaderMessageSubject.asObservable();
  
    public show(message: string = 'Cargando...'): void {
      console.log('Loader SHOW con mensaje:', message);
      this.loaderMessageSubject.next(message);
      this.loaderVisibleSubject.next(true);
    }
  
    public hide(): void {
      console.log('Loader HIDE');
      this.loaderVisibleSubject.next(false);
    }
  
    public showForDuration(durationMs: number = 3000, message: string = 'Cargando...'): void {
      console.log(`Loader SHOW por ${durationMs}ms con mensaje:`, message);
      this.show(message);
      setTimeout(() => {
        this.hide();
      }, durationMs);
    }
  }