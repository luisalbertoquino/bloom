// src/app/core/services/auth-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private authCheckCompleted = new BehaviorSubject<boolean>(false);
  authCheckCompleted$ = this.authCheckCompleted.asObservable();

  setAuthCheckCompleted(completed: boolean) {
    this.authCheckCompleted.next(completed);
  }
}