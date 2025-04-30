# Bloom Accesorios - Tienda Online

![Bloom Accesorios Logo](/assets/images/logo.png)

## 📝 Descripción

Bloom Accesorios es una tienda online completa para la venta de accesorios y joyería, desarrollada con Angular para el frontend y Laravel para el backend. La plataforma ofrece una experiencia de compra intuitiva y moderna, con un diseño adaptable a dispositivos móviles y funcionalidades avanzadas.

## ✨ Características

### Para clientes
- **Navegación de productos** por categorías
- **Vista rápida** de productos sin cambiar de página
- **Página detallada** de cada producto con descripción completa
- **Carrito de compras** para gestionar productos seleccionados
- **Compra directa** con integración a WhatsApp
- **Blog** con artículos sobre tendencias y novedades
- **Búsqueda** de productos por nombre o características
- **Diseño responsive** adaptado a todo tipo de dispositivos

### Para administradores
- **Panel administrativo** con estadísticas y resumen
- **Gestión de productos** (crear, editar, eliminar, cambiar disponibilidad)
- **Gestión de categorías** para organizar productos
- **Blog** para publicar artículos y novedades
- **Configuraciones generales** del sitio (logo, colores, información de contacto)

## 🛠️ Tecnologías utilizadas

### Frontend
- **Angular 17**: Framework principal con componentes standalone
- **Tailwind CSS**: Framework CSS para el diseño
- **RxJS**: Programación reactiva para las operaciones asíncronas
- **Angular Router**: Gestión de rutas y navegación
- **Forms Module**: Para formularios reactivos

### Backend
- **Laravel 10**: Framework PHP para la API
- **Sanctum**: Sistema de autenticación
- **Eloquent ORM**: Mapper objeto-relacional para la base de datos
- **MySQL**: Base de datos relacional
- **API RESTful**: Endpoints para todas las operaciones CRUD

## 🚀 Instalación y configuración

### Requisitos previos
- Node.js (v16.x o superior)
- npm o yarn
- PHP 8.1 o superior
- Composer
- MySQL o MariaDB

### Instalación del Frontend (Angular)

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/tienda-frontend-bloom.git
cd tienda-frontend-bloom
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
   - Duplicar el archivo `enviroments/enviroment.example.ts` a `enviroments/enviroment.ts`
   - Ajustar las URLs de API y almacenamiento según tu entorno

4. Iniciar el servidor de desarrollo:
```bash
ng serve
```

### Instalación del Backend (Laravel)

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/tienda-backend-bloom.git
cd tienda-backend-bloom
```

2. Instalar dependencias:
```bash
composer install
```

3. Configurar variables de entorno:
   - Duplicar el archivo `.env.example` a `.env`
   - Configurar la conexión a la base de datos y otras variables

4. Generar clave de aplicación:
```bash
php artisan key:generate
```

5. Ejecutar migraciones y semillas:
```bash
php artisan migrate --seed
```

6. Crear enlace simbólico para almacenamiento:
```bash
php artisan storage:link
```

7. Iniciar el servidor de desarrollo:
```bash
php artisan serve
```

## 📂 Estructura del proyecto

### Frontend (Angular)

```
src/
├── app/
│   ├── core/                 # Servicios, guardias e interceptores
│   │   ├── guards/           # Guardias de rutas (AuthGuard)
│   │   ├── interceptors/     # Interceptores HTTP
│   │   └── services/         # Servicios principales
│   ├── features/             # Componentes por funcionalidad
│   │   ├── admin/            # Componentes del área administrativa
│   │   └── store/            # Componentes de la tienda
│   └── shared/               # Componentes compartidos
│       └── components/       # (Navbar, Footer, etc.)
├── assets/                   # Recursos estáticos
└── environments/             # Variables de entorno
```

### Backend (Laravel)

```
app/
├── Http/
│   ├── Controllers/          # Controladores de la API
│   │   └── API/              # Controladores específicos para la API
│   └── Middleware/           # Middlewares personalizados
├── Models/                   # Modelos de datos
└── Providers/                # Proveedores de servicios
database/
├── migrations/               # Migraciones de la base de datos
└── seeders/                  # Semillas para datos iniciales
routes/
└── api.php                   # Definición de rutas de la API
storage/
└── app/
    └── public/               # Almacenamiento de imágenes
```

## 🔄 Flujo de trabajo Git recomendado

1. Crear una rama para cada característica:
```bash
git checkout -b feature/nombre-caracteristica
```

2. Realizar cambios y commits:
```bash
git add .
git commit -m "Descripción detallada del cambio"
```

3. Subir la rama y crear un Pull Request:
```bash
git push origin feature/nombre-caracteristica
```

4. Después de la revisión, fusionar en la rama principal.

## 🔒 Seguridad

- Las contraseñas se almacenan utilizando bcrypt en Laravel
- Autenticación mediante tokens (Laravel Sanctum)
- Validación de datos tanto en frontend como en backend
- Protección CSRF en formularios


## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 📞 Contacto

Si tienes preguntas o sugerencias, no dudes en contactarnos:
- Email: alberto.1203@hotmail.com
- WhatsApp: +573042483977