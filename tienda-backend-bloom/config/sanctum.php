<?php

use Laravel\Sanctum\Sanctum;

return [
    // Dominios que recibirán cookies de autenticación estatales
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,localhost:8000,::1,localhost:4200',
        Sanctum::currentApplicationUrlWithPort()
    ))),

    // Guards de autenticación que Sanctum verificará
    'guard' => ['web'],

    // Tiempo de expiración del token en minutos
    // null = no expira. Cambia a un valor como 60 * 24 (24 horas) para una mayor seguridad
    'expiration' => 60 * 24, // 24 horas

    // Prefijo para los tokens nuevos
    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    // Middleware utilizado por Sanctum
    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
    ],
];