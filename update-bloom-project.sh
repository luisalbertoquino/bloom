#!/bin/bash
# Script para actualizar el proyecto Bloom desde GitHub (frontend y backend)

# Colores para salida
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración
REPO_URL="https://github.com/luisalbertoquino/bloom.git"
REPO_NAME="bloom"
TEMP_DIR="/tmp/bloom-update-$(date +%s)"
PROJECT_DIR="/var/www/bloom"
FRONTEND_DIR="$PROJECT_DIR/tienda-frontend-bloom"
BACKEND_DIR="$PROJECT_DIR/tienda-backend-bloom"

echo -e "${BLUE}=== Actualizando proyecto Bloom desde GitHub ===${NC}"

# 1. Crear directorio temporal
echo -e "${BLUE}Creando directorio temporal...${NC}"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR" || { echo -e "${RED}Error: No se pudo crear el directorio temporal${NC}"; exit 1; }

# 2. Clonar repositorio
echo -e "${BLUE}Clonando repositorio desde GitHub...${NC}"
git clone "$REPO_URL" "$REPO_NAME"
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: No se pudo clonar el repositorio${NC}"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# 3. Verificar que la estructura sea correcta
cd "$REPO_NAME" || { echo -e "${RED}Error: No se pudo acceder al repositorio clonado${NC}"; exit 1; }
if [ ! -d "tienda-frontend-bloom" ] || [ ! -d "tienda-backend-bloom" ]; then
  echo -e "${RED}Error: La estructura del repositorio no coincide con lo esperado${NC}"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# 4. Actualizar el directorio frontend (preservando archivos críticos)
echo -e "${BLUE}Actualizando el directorio frontend...${NC}"

# 4.1. Notar el contenido del index.html actual
echo -e "${YELLOW}Observando el index.html actual antes de actualizar...${NC}"
if [ -f "$FRONTEND_DIR/src/index.html" ]; then
  # Crear directorio para referencia
  mkdir -p "$TEMP_DIR/reference_files"

  # Guardar el index.html actual como referencia
  CURRENT_INDEX="$TEMP_DIR/reference_files/index.html.previous"
  cp "$FRONTEND_DIR/src/index.html" "$CURRENT_INDEX"

  # Mostrar parte del contenido para referencia
  echo -e "${BLUE}Contenido del index.html actual (primeras líneas):${NC}"
  head -n 5 "$CURRENT_INDEX"

  echo -e "${GREEN}✓ Este index.html será reemplazado por la versión de GitHub${NC}"
fi

# 4.2 Backup ESPECIAL para otros archivos personalizados críticos
echo -e "${YELLOW}Respaldo especial para otros archivos personalizados...${NC}"
CUSTOM_FILES=(
  "src/environments/environment.ts"
  "src/styles.css"
  # Añade aquí otros archivos personalizados si los hay
)

for file in "${CUSTOM_FILES[@]}"; do
  if [ -f "$FRONTEND_DIR/$file" ]; then
    mkdir -p "$(dirname "$TEMP_DIR/custom_backup/$file")"
    cp "$FRONTEND_DIR/$file" "$TEMP_DIR/custom_backup/$file"
    echo -e "  ${GREEN}✓ Backup de $file creado${NC}"
  fi
done

# 4.3 Crear backup de archivos críticos
echo -e "${YELLOW}Respaldando archivos críticos del frontend...${NC}"
FRONTEND_BACKUP_DIR="$TEMP_DIR/frontend-backup"
mkdir -p "$FRONTEND_BACKUP_DIR"

# Lista de archivos críticos a preservar en el frontend
CRITICAL_FILES=(
  "package.json"
  "package-lock.json"
  "angular.json"
  "proxy.conf.json"
  "tsconfig.json"
  "tsconfig.app.json"
  "tsconfig.spec.json"
  "update-angular.sh"
  ".env"
  "src/assets"
)

# Crear backup de archivos críticos (excluyendo los personalizados)
for file in "${CRITICAL_FILES[@]}"; do
  if [ -e "$FRONTEND_DIR/$file" ]; then
    echo "  - Respaldando $file"
    mkdir -p "$(dirname "$FRONTEND_BACKUP_DIR/$file")"
    cp -a "$FRONTEND_DIR/$file" "$FRONTEND_BACKUP_DIR/$file"
  fi
done

# 4.4 Actualizar el código fuente del frontend
echo -e "${BLUE}Copiando nuevos archivos del frontend...${NC}"

# Usar rsync con exclusiones específicas
rsync -a --delete \
      --exclude="node_modules" \
      --exclude="dist" \
      --exclude=".git" \
      --exclude=".angular" \
      "$TEMP_DIR/$REPO_NAME/tienda-frontend-bloom/" "$FRONTEND_DIR/"

# 4.5 Verificación del index.html de GitHub
echo -e "${YELLOW}Verificando el index.html del repositorio...${NC}"
if [ -f "$FRONTEND_DIR/src/index.html" ]; then
  echo -e "${BLUE}Contenido del index.html del repositorio (parcial):${NC}"
  head -n 5 "$FRONTEND_DIR/src/index.html"

  echo -e "${GREEN}✓ Usando index.html del repositorio GitHub sin modificaciones${NC}"
else
  echo -e "${RED}ERROR: No se encontró el index.html en el directorio fuente${NC}"
fi

# 4.6 Restauración de otros archivos personalizados
echo -e "${YELLOW}Restaurando otros archivos personalizados...${NC}"
for file in "${CUSTOM_FILES[@]}"; do
  if [ -f "$TEMP_DIR/custom_backup/$file" ]; then
    mkdir -p "$(dirname "$FRONTEND_DIR/$file")"
    cp "$TEMP_DIR/custom_backup/$file" "$FRONTEND_DIR/$file"
    echo -e "  ${GREEN}✓ Restaurado $file${NC}"

    # Aplicar permisos seguros
    chown www-data:www-data "$FRONTEND_DIR/$file"
    chmod 644 "$FRONTEND_DIR/$file"
  fi
done

# 4.7 Restaurar archivos críticos regulares
echo -e "${BLUE}Restaurando archivos críticos del frontend...${NC}"
for file in "${CRITICAL_FILES[@]}"; do
  if [ -e "$FRONTEND_BACKUP_DIR/$file" ]; then
    echo "  - Restaurando $file"
    mkdir -p "$(dirname "$FRONTEND_DIR/$file")"
    cp -a "$FRONTEND_BACKUP_DIR/$file" "$FRONTEND_DIR/$file"
  fi
done

# 5. Actualizar el directorio backend (preservando archivos críticos)
echo -e "${BLUE}=== Actualizando el directorio backend ===${NC}"

# 5.1 Crear backup de archivos críticos del backend
echo -e "${YELLOW}Respaldando archivos críticos del backend...${NC}"
BACKEND_BACKUP_DIR="$TEMP_DIR/backend-backup"
mkdir -p "$BACKEND_BACKUP_DIR"

# NOTA: config/sanctum.php y config/cors.php NO están en esta lista
# porque queremos que se actualicen desde GitHub
BACKEND_CRITICAL_FILES=(
  ".env"
  "routes/api.php"
  "config/app.php"
  "config/database.php"
  "config/filesystems.php"
  "storage"
  "public/storage"
  "bootstrap/cache"
  "vendor"
  "composer.lock"
  "artisan"
  "database/seeders/AdminSeeder.php"
  "database/seeders/UserSeeder.php"
  "app/Http/Middleware/TrustProxies.php"
  "public/.htaccess"
)

# Crear backup de archivos críticos del backend
for file in "${BACKEND_CRITICAL_FILES[@]}"; do
  if [ -e "$BACKEND_DIR/$file" ]; then
    echo "  - Respaldando $file"
    mkdir -p "$(dirname "$BACKEND_BACKUP_DIR/$file")"
    cp -a "$BACKEND_DIR/$file" "$BACKEND_BACKUP_DIR/$file"
  fi
done

# 5.2 Actualizar el código fuente del backend
echo -e "${BLUE}Copiando nuevos archivos del backend...${NC}"

# NOTA: config/sanctum.php y config/cors.php NO están excluidos
# para permitir que se actualicen desde GitHub
rsync -a --delete \
      --exclude="vendor" \
      --exclude="node_modules" \
      --exclude=".env" \
      --exclude="routes/api.php" \
      --exclude="storage/app/*" \
      --exclude="storage/framework/cache/*" \
      --exclude="storage/framework/sessions/*" \
      --exclude="storage/framework/views/*" \
      --exclude="storage/logs/*" \
      --exclude="bootstrap/cache/*" \
      --exclude="public/storage" \
      "$TEMP_DIR/$REPO_NAME/tienda-backend-bloom/" "$BACKEND_DIR/"

# 5.3 Restaurar archivos críticos del backend
echo -e "${BLUE}Restaurando archivos críticos del backend...${NC}"
for file in "${BACKEND_CRITICAL_FILES[@]}"; do
  if [ -e "$BACKEND_BACKUP_DIR/$file" ]; then
    echo "  - Restaurando $file"
    if [ -d "$BACKEND_BACKUP_DIR/$file" ]; then
      mkdir -p "$BACKEND_DIR/$file"
      if [[ "$file" == "storage" ]]; then
        rsync -a --include="*/" --exclude="*" "$BACKEND_BACKUP_DIR/$file/" "$BACKEND_DIR/$file/"
        cp -a "$BACKEND_BACKUP_DIR/storage/app" "$BACKEND_DIR/storage/" 2>/dev/null || true
      else
        cp -a "$BACKEND_BACKUP_DIR/$file/." "$BACKEND_DIR/$file/" 2>/dev/null || true
      fi
    else
      mkdir -p "$(dirname "$BACKEND_DIR/$file")"
      cp -a "$BACKEND_BACKUP_DIR/$file" "$BACKEND_DIR/$file"
    fi
  fi
done

# 5.4 Verificar que los archivos de configuración se actualizaron
echo -e "${BLUE}Verificando archivos de configuración actualizados...${NC}"
if grep -q "store.invite-art.com" "$BACKEND_DIR/config/cors.php"; then
  echo -e "${GREEN}✓ config/cors.php actualizado correctamente${NC}"
else
  echo -e "${YELLOW}⚠ Advertencia: config/cors.php puede no tener la configuración de producción${NC}"
fi

if grep -q "store.invite-art.com" "$BACKEND_DIR/config/sanctum.php"; then
  echo -e "${GREEN}✓ config/sanctum.php actualizado correctamente${NC}"
else
  echo -e "${YELLOW}⚠ Advertencia: config/sanctum.php puede no tener la configuración de producción${NC}"
fi

# 6. Compilar el frontend
echo -e "${BLUE}Compilando el frontend con Angular...${NC}"
cd "$FRONTEND_DIR" || { echo -e "${RED}Error: No se pudo acceder al directorio frontend${NC}"; exit 1; }

# 6.0 Verificación FINAL del index.html antes de compilar
echo -e "${YELLOW}VERIFICACIÓN FINAL de index.html antes de compilar...${NC}"
echo -e "${GREEN}✓ Usando index.html del repositorio GitHub para la compilación${NC}"
if [ -f "$FRONTEND_DIR/src/index.html" ]; then
  echo -e "${BLUE}Primeras líneas del index.html a compilar:${NC}"
  head -n 5 "$FRONTEND_DIR/src/index.html"
else
  echo -e "${RED}ALERTA: No se encontró index.html! La compilación puede fallar.${NC}"
fi

# 6.1 Crear environment.prod.ts temporal
echo -e "${YELLOW}Creando environment.prod.ts temporal...${NC}"
cat > "$FRONTEND_DIR/src/environments/environment.prod.ts" << 'EOF'
export const environment = {
  production: true,
  baseUrl: 'https://store.invite-art.com',
  apiUrl: 'https://store.invite-art.com/api',
  storageUrl: 'https://store.invite-art.com/storage/'
};
EOF

# 6.2 Instalar dependencias y compilar
npm install
ng build --configuration production
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: La compilación del frontend falló${NC}"
  # Limpiar environment.prod.ts temporal si falla
  rm -f "$FRONTEND_DIR/src/environments/environment.prod.ts"
  exit 1
fi

# 6.3 Eliminar environment.prod.ts temporal después de la compilación
echo -e "${YELLOW}Limpiando environment.prod.ts temporal...${NC}"
rm -f "$FRONTEND_DIR/src/environments/environment.prod.ts"
echo -e "${GREEN}✓ Archivo temporal eliminado${NC}"

# 7. Copiar archivos compilados al backend (actualizado para Angular 17+)
echo -e "${BLUE}Copiando archivos compilados al backend...${NC}"
ANGULAR_DIST_DIR="$FRONTEND_DIR/dist/tienda-frontend-bloom/browser"
LARAVEL_PUBLIC_DIR="$BACKEND_DIR/public"

# Verificar que existe el directorio browser
if [ ! -d "$ANGULAR_DIST_DIR" ]; then
  echo -e "${RED}Error: No se encontró el directorio browser en la compilación${NC}"
  echo -e "${YELLOW}Contenido de dist/tienda-frontend-bloom:${NC}"
  ls -la "$FRONTEND_DIR/dist/tienda-frontend-bloom"
  exit 1
fi

# Limpiar directorio público (excepto archivos críticos)
echo -e "${YELLOW}Limpiando directorio público...${NC}"
find "$LARAVEL_PUBLIC_DIR" -mindepth 1 \
     -not -name '.htaccess' \
     -not -name 'storage' \
     -not -name 'index.php' \
     -not -name 'server.php' \
     -not -name 'robots.txt' \
     -delete

# Copiar nuevos archivos compilados desde el directorio browser
echo -e "${YELLOW}Copiando archivos desde $ANGULAR_DIST_DIR...${NC}"
cp -a "$ANGULAR_DIST_DIR"/* "$LARAVEL_PUBLIC_DIR/"

# 8. Ejecutar comandos de Laravel
echo -e "${BLUE}Ejecutando comandos de Laravel...${NC}"
cd "$BACKEND_DIR" || { echo -e "${RED}Error: No se pudo acceder al directorio backend${NC}"; exit 1; }

php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

php artisan config:cache
php artisan route:cache

PENDING_MIGRATIONS=$(php artisan migrate:status | grep "| No " | wc -l)
if [ "$PENDING_MIGRATIONS" -gt 0 ]; then
  echo -e "${YELLOW}¡ATENCIÓN! Hay $PENDING_MIGRATIONS migraciones pendientes.${NC}"
  echo -e "${YELLOW}Para ejecutarlas manualmente, usa: 'php artisan migrate'${NC}"
fi

# 9. Establecer permisos
echo -e "${BLUE}Estableciendo permisos correctos...${NC}"
sudo chown -R www-data:www-data "$BACKEND_DIR/storage"
sudo chown -R www-data:www-data "$BACKEND_DIR/bootstrap/cache"
sudo chmod -R 775 "$BACKEND_DIR/storage"
sudo chmod -R 775 "$BACKEND_DIR/bootstrap/cache"

# 10. Guardar una copia del index.html de GitHub para referencia
echo -e "${BLUE}Guardando una copia del index.html de GitHub...${NC}"
BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"
if [ -f "$FRONTEND_DIR/src/index.html" ]; then
  cp "$FRONTEND_DIR/src/index.html" "$BACKUP_DIR/index.html.github"
  echo -e "${GREEN}✓ Copia del index.html de GitHub guardada en $BACKUP_DIR/index.html.github${NC}"
fi

# 11. Limpieza y verificación final
echo -e "${BLUE}Limpiando archivos temporales...${NC}"
rm -rf "$TEMP_DIR"

echo -e "${GREEN}=== Actualización completada con éxito ===${NC}"
echo -e "${BLUE}=== Verificación final ===${NC}"
echo -e "${YELLOW}Contenido del directorio público:${NC}"
ls -la "$LARAVEL_PUBLIC_DIR"

# Verificación específica para index.html
echo -e "${YELLOW}Contenido final de index.html:${NC}"
if [ -f "$FRONTEND_DIR/src/index.html" ]; then
  grep -A5 "<app-root>" "$FRONTEND_DIR/src/index.html" 2>/dev/null || echo "⚠️ No se encontró <app-root> en index.html"
fi

echo -e "${GREEN}=== Proceso completado exitosamente ===${NC}"
echo -e "${BLUE}Se utilizó el index.html del repositorio GitHub para la compilación${NC}"
echo -e "${GREEN}✓ Archivos de configuración CORS y Sanctum actualizados desde GitHub${NC}"
