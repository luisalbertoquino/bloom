<?php

use Illuminate\Support\Str;

return [
    'driver' => env('SESSION_DRIVER', 'file'), // Cambiar a 'file' o 'database' en producción
    'lifetime' => env('SESSION_LIFETIME', 120), // 120 minutos
    'expire_on_close' => true, // Cambiar a true para que expire al cerrar el navegador
    'encrypt' => false,
    'files' => storage_path('framework/sessions'),
    'connection' => env('SESSION_CONNECTION'),
    'table' => 'sessions',
    'store' => env('SESSION_STORE'),
    'lottery' => [2, 100], // Limpieza más frecuente
    'cookie' => 'bloom_session',
    'path' => '/',
    'domain' => env('SESSION_DOMAIN', null),
    'secure' => env('SESSION_SECURE_COOKIE', false), // True en producción con HTTPS
    'http_only' => true,
    'same_site' => 'lax',
    'partitioned' => false,
];