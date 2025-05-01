<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Closure;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // No usamos excepciones para resolver el problema correctamente
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // Limpiamos cookies duplicadas o innecesarias para evitar headers grandes
        $this->cleanupExcessCookies($request);
        
        // Añadir logs para depuración
        if ($request->is('api/*') && $request->isMethod('POST')) {
            Log::info('CSRF Verification', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'has_csrf_token' => $request->header('X-XSRF-TOKEN') ? 'Yes' : 'No',
                'csrf_token_in_session' => $request->session()->token() ? Str::substr($request->session()->token(), 0, 10) . '...' : 'None',
                'csrf_header' => $request->header('X-XSRF-TOKEN') ? Str::substr($request->header('X-XSRF-TOKEN'), 0, 10) . '...' : 'None',
            ]);
        }
        
        // Continuamos con el manejo estándar
        return parent::handle($request, $next);
    }

    /**
     * Add the CSRF token to the response cookies.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Symfony\Component\HttpFoundation\Response  $response
     * @return \Symfony\Component\HttpFoundation\Response
     */
    protected function addCookieToResponse($request, $response)
    {
        $config = config('session');
        
        // Usamos el token CSRF completo - NO LO ACORTAMOS
        // Este era el problema principal
        $token = $request->session()->token();
        
        $cookie = new \Symfony\Component\HttpFoundation\Cookie(
            'XSRF-TOKEN',
            $token,
            $this->availableAt(60 * $config['lifetime']),
            $config['path'],
            $config['domain'],
            $config['secure'],
            false,
            false,
            $config['same_site'] ?? null
        );
        
        $response->headers->setCookie($cookie);
        
        // Log del token que se está enviando en la cookie
        Log::info('Setting CSRF cookie', [
            'token_length' => strlen($token),
            'token_start' => Str::substr($token, 0, 10) . '...',
        ]);
        
        return $response;
    }
    
    /**
     * Determine if the request has a URI that should pass through CSRF verification.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function shouldPassThrough($request)
    {
        $shouldPass = parent::shouldPassThrough($request);
        
        if ($shouldPass && $request->is('api/*')) {
            Log::info('CSRF check bypassed for:', [
                'url' => $request->fullUrl(),
                'method' => $request->method()
            ]);
        }
        
        return $shouldPass;
    }
    
    /**
     * Limpia cookies excesivas para evitar headers HTTP demasiado grandes
     *
     * @param  \Illuminate\Http\Request  $request
     * @return void
     */
    protected function cleanupExcessCookies($request)
    {
        if (!$request->cookies->has('bloom_session')) {
            return;
        }
        
        // Limpiar cookies de sesión innecesarias o duplicadas
        $cookiesToRemove = [];
        
        foreach ($request->cookies as $name => $value) {
            // Eliminar cookies de sesión duplicadas o antiguas
            if (Str::startsWith($name, 'laravel_session_') || 
                (Str::startsWith($name, 'laravel_') && $name !== 'laravel_session') ||
                Str::contains($name, 'remember_web_') && $name !== $this->getRememberCookieName()) {
                $cookiesToRemove[] = $name;
            }
        }
        
        // Aplicar eliminación de cookies
        foreach ($cookiesToRemove as $cookieName) {
            cookie()->queue(
                cookie()->forget($cookieName)
            );
        }
    }
    
    /**
     * Obtiene el nombre de la cookie de recordar
     * 
     * @return string
     */
    protected function getRememberCookieName()
    {
        return 'remember_web_' . sha1('web');
    }
}