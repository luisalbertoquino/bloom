import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, any>();
  private expirations = new Map<string, number>();
  
  get(key: string): any {
    if (this.hasValidCacheFor(key)) {
      return this.cache.get(key);
    }
    return null;
  }
  
  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, data);
    this.expirations.set(key, Date.now() + ttlMs);
  }
  
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.expirations.delete(key);
    } else {
      this.cache.clear();
      this.expirations.clear();
    }
  }
  
  private hasValidCacheFor(key: string): boolean {
    if (!this.cache.has(key)) return false;
    
    const expiration = this.expirations.get(key);
    if (!expiration) return true;
    
    return Date.now() < expiration;
  }
}
