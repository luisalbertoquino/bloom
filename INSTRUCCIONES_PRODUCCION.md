# Instrucciones para Solucionar el Error 401 en Producción

## Problema Identificado

El error 401 "No autenticado" se debe a una configuración incorrecta de CORS y Sanctum que solo permitía conexiones desde `localhost`, pero no desde el dominio de producción `store.invite-art.com`.

## Archivos Modificados

1. **config/cors.php** - Actualizado para permitir el dominio de producción
2. **config/sanctum.php** - Agregado el dominio de producción a stateful domains

## Pasos para Aplicar los Cambios en Producción

### 1. Subir los Cambios a GitHub

Los archivos ya están actualizados localmente. Ejecuta:

```bash
git add .
git commit -m "Fix: Corregir configuración CORS y Sanctum para producción"
git push origin main
```

### 2. En el Servidor de Producción

Ejecuta el script de actualización:

```bash
bash update-bloom-project.sh
```

### 3. Verificar el Archivo .env en Producción

**IMPORTANTE:** El archivo `.env` en producción debe tener estas configuraciones:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://store.invite-art.com

# Sesión
SESSION_DOMAIN=store.invite-art.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

# Sanctum
SANCTUM_STATEFUL_DOMAINS=store.invite-art.com
```

Para editar el archivo .env en producción:

```bash
cd /var/www/bloom/tienda-backend-bloom
nano .env
```

Presiona `Ctrl+X`, luego `Y`, luego `Enter` para guardar.

### 4. Limpiar Caché de Laravel

Después de actualizar el .env, ejecuta:

```bash
cd /var/www/bloom/tienda-backend-bloom
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

### 5. Reiniciar Servicios (si es necesario)

```bash
sudo systemctl restart php8.2-fpm  # Ajusta la versión de PHP si es diferente
sudo systemctl restart apache2     # o nginx según tu servidor web
```

## Verificación

1. Abre tu sitio en producción: https://store.invite-art.com
2. Intenta hacer login
3. El error 401 debería estar resuelto

## Qué Cambiaron los Archivos

### cors.php
- **Antes:** Solo permitía `http://localhost:4200`
- **Ahora:** Permite tanto localhost (desarrollo) como `https://store.invite-art.com` (producción)

### sanctum.php
- **Antes:** Solo dominios localhost en stateful
- **Ahora:** Incluye `store.invite-art.com` en los dominios stateful

## Problemas Comunes

### Si Aún Tienes Error 401:

1. **Verifica que el .env tenga las configuraciones correctas**
   ```bash
   cat /var/www/bloom/tienda-backend-bloom/.env | grep -E "SESSION_|SANCTUM_|APP_URL"
   ```

2. **Limpia la caché del navegador**
   - Presiona Ctrl+Shift+Delete
   - Elimina cookies y caché

3. **Verifica los permisos de storage y bootstrap/cache**
   ```bash
   cd /var/www/bloom/tienda-backend-bloom
   sudo chown -R www-data:www-data storage bootstrap/cache
   sudo chmod -R 775 storage bootstrap/cache
   ```

4. **Revisa los logs de Laravel**
   ```bash
   tail -f /var/www/bloom/tienda-backend-bloom/storage/logs/laravel.log
   ```

## Contacto

Si los problemas persisten, revisa los logs del navegador (F12 > Console) y los logs de Laravel para más detalles sobre el error.
