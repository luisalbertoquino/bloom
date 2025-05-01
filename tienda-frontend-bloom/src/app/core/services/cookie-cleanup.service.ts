import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieCleanupService {
  
  constructor() {}

  /**
   * Limpia cookies antiguas o innecesarias para evitar el error 431
   * @returns {number} El número de cookies eliminadas
   */
  cleanupCookies(): number {
    // Obtener todas las cookies
    const cookies = this.getAllCookies();
    const initialCount = Object.keys(cookies).length;
    
    // Verificar el tamaño total de las cookies
    const totalSize = this.calculateCookiesSize(cookies);
    console.log(`Tamaño total de cookies: ${totalSize} bytes, Cantidad: ${initialCount}`);
    
    // Si el tamaño es grande, comenzar a limpiar cookies no esenciales
    if (totalSize > 3000) { // 3KB umbral para limpieza
      this.removeNonEssentialCookies(cookies);
    }
    
    // Comprimir cookies grandes que no pueden eliminarse
    this.compressLargeCookies();
    
    const finalCount = Object.keys(this.getAllCookies()).length;
    const removed = initialCount - finalCount;
    
    console.log(`Cookie cleanup completado. Cookies eliminadas: ${removed}, Tamaño actual: ${this.calculateCookiesSize(this.getAllCookies())} bytes`);
    return removed;
  }

  /**
   * Obtiene todas las cookies como un objeto
   */
  getAllCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (typeof document === 'undefined') return cookies; // Prevenir errores en SSR
    
    document.cookie.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length < 2) return;
      
      const name = parts[0].trim();
      // Unir todas las partes después del primer = para manejar valores con =
      const value = parts.slice(1).join('=');
      
      if (name) cookies[name] = value || '';
    });
    return cookies;
  }

  /**
   * Calcula el tamaño aproximado de las cookies en bytes
   */
  calculateCookiesSize(cookies: Record<string, string>): number {
    let size = 0;
    for (const name in cookies) {
      // Nombre + igual + valor + punto y coma + espacio
      size += name.length + 1 + (cookies[name]?.length || 0) + 2;
    }
    return size;
  }

  /**
   * Elimina cookies que no son esenciales para el funcionamiento de la aplicación
   */
  removeNonEssentialCookies(cookies: Record<string, string>): void {
    // Preservar cookies críticas para autenticación y CSRF
    const essentialCookies = [
      'XSRF-TOKEN', 
      'laravel_session', 
      'auth_token', 
      'auth._token.local', 
      'auth._token_expiration.local'
    ];
    
    const cookiesToKeep = [
      'XSRF-TOKEN',
      'laravel_session'
    ];
    
    let removedCount = 0;
    
    for (const name in cookies) {
      // Mantener las cookies esenciales
      if (cookiesToKeep.includes(name)) {
        continue;
      }
      
      // Mantener otras cookies relacionadas con autenticación y CSRF
      if (!essentialCookies.includes(name) && 
          !name.toLowerCase().includes('csrf') && 
          !name.toLowerCase().includes('xsrf') && 
          !name.toLowerCase().includes('token') && 
          !name.toLowerCase().includes('auth')) {
        this.deleteCookie(name);
        removedCount++;
      }
    }
    
    console.log(`Cookies no esenciales eliminadas: ${removedCount}`);
  }

  /**
   * Elimina una cookie específica
   */
  deleteCookie(name: string): void {
    if (typeof document === 'undefined') return; // Prevenir errores en SSR
    
    // Eliminar en el path raíz
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    // Intentar eliminar en otros paths comunes por si acaso
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/admin;`;
    
    // Si tienes un dominio específico, también puedes intentar eliminarlo con ese dominio
    // document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=tudominio.com;`;
  }

  /**
   * Limpia cookies relacionadas con el almacenamiento de datos de producto
   */
  cleanupProductCookies(): void {
    const allCookies = this.getAllCookies();
    let removedCount = 0;
    
    for (const name in allCookies) {
      // Buscar cookies relacionadas con productos, carrito, items o caché
      const lowerName = name.toLowerCase();
      if ((lowerName.includes('product') || 
           lowerName.includes('cart') || 
           lowerName.includes('item') || 
           lowerName.includes('cache') ||
           lowerName.includes('category') ||
           lowerName.includes('filter') ||
           lowerName.includes('data')) && 
          !lowerName.includes('token') &&
          !lowerName.includes('auth')) {
        this.deleteCookie(name);
        removedCount++;
      }
    }
    
    console.log(`Cookies de producto eliminadas: ${removedCount}`);
  }

  /**
   * Comprimir cookies grandes que no pueden ser eliminadas
   */
  compressLargeCookies(): void {
    const allCookies = this.getAllCookies();
    let compressedCount = 0;
    
    for (const name in allCookies) {
      const value = allCookies[name];
      
      // Ignorar cookies ya comprimidas (que empiecen con eyJ u otras marcas de compresión)
      if (value && value.length > 1000 && !value.startsWith('eyJ')) {
        try {
          // Comprimir la cookie
          const compressed = this.compressValue(value);
          
          // Solo actualizar si realmente se redujo el tamaño
          if (compressed.length < value.length) {
            this.setCookie(name, compressed);
            compressedCount++;
            console.log(`Cookie ${name} comprimida: ${value.length} -> ${compressed.length} bytes`);
          }
        } catch (error) {
          console.error(`Error al comprimir cookie ${name}:`, error);
        }
      }
    }
    
    console.log(`Cookies grandes comprimidas: ${compressedCount}`);
  }

  /**
   * Limpia datos antiguos del localStorage que pueden estar causando problemas
   */
  cleanupLocalStorage(): void {
    if (typeof localStorage === 'undefined') return; // Prevenir errores en SSR
    
    // Lista de claves que podrían acumular datos innecesarios
    const keysToCheck = [
      'recentProducts', 
      'viewHistory', 
      'filters', 
      'tempData', 
      'cache', 
      'lastViewed',
      'form',
      'state',
      'data'
    ];
    
    let removedCount = 0;
    
    // Verificar todas las claves en localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Verificar si la clave contiene alguno de los patrones a revisar
      const shouldCheck = keysToCheck.some(pattern => 
        key.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (shouldCheck) {
        try {
          const data = localStorage.getItem(key);
          
          // Si el elemento es muy grande, eliminarlo
          if (data && data.length > 5000) {
            localStorage.removeItem(key);
            removedCount++;
            console.log(`Elemento grande de localStorage eliminado: ${key} (${data.length} bytes)`);
          }
        } catch (error) {
          console.error(`Error al procesar localStorage ${key}:`, error);
        }
      }
    }
    
    console.log(`Items de localStorage eliminados: ${removedCount}`);
  }

  /**
   * Comprime un string para reducir tamaño
   */
  private compressValue(value: string): string {
    try {
      // Compresión básica con btoa (Base64)
      return btoa(encodeURIComponent(value));
    } catch (error) {
      console.error('Error al comprimir valor:', error);
      return value;
    }
  }

  /**
   * Descomprime un valor previamente comprimido
   */
  private decompressValue(compressed: string): string {
    try {
      return decodeURIComponent(atob(compressed));
    } catch (error) {
      console.error('Error al descomprimir valor:', error);
      return compressed;
    }
  }

  /**
   * Establece una cookie con opciones estándar
   */
  private setCookie(name: string, value: string, days: number = 7): void {
    if (typeof document === 'undefined') return; // Prevenir errores en SSR
    
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
  }
  
  /**
   * Limpia todas las cookies no críticas (para casos extremos)
   * CUIDADO: Usar solo en caso de error 431 persistente
   */
  cleanupAllNonCriticalCookies(): void {
    const allCookies = this.getAllCookies();
    let preservedCount = 0;
    let removedCount = 0;
    
    // Solo preservar las cookies absolutamente esenciales
    const criticalCookies = ['XSRF-TOKEN', 'laravel_session'];
    
    for (const name in allCookies) {
      if (criticalCookies.includes(name)) {
        preservedCount++;
        continue;
      }
      
      this.deleteCookie(name);
      removedCount++;
    }
    
    console.log(`Limpieza extrema: ${removedCount} cookies eliminadas, ${preservedCount} preservadas`);
  }
}