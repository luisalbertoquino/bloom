<?php

use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\BlogPostController;
use App\Http\Controllers\API\SettingController;
use App\Http\Controllers\API\AuthController;
use Illuminate\Support\Facades\Route;

// Manejo de solicitudes OPTIONS para CORS
Route::options('/{any}', function() {
    return response('', 200)
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, X-XSRF-TOKEN')
        ->header('Access-Control-Allow-Origin', 'http://localhost:4200')
        ->header('Access-Control-Allow-Credentials', 'true');
})->where('any', '.*');

Route::get('/csrf-test', function() {
    return response()->json(['message' => 'CSRF token refreshed']);
});

// Rutas públicas
Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category}', [CategoryController::class, 'show']);

Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product}', [ProductController::class, 'show']);

Route::get('blog-posts', [BlogPostController::class, 'index']);
Route::get('blog-posts/featured', [BlogPostController::class, 'featured']);
Route::get('blog-posts/{blogPost}', [BlogPostController::class, 'show']);

Route::get('settings', [SettingController::class, 'index']);
Route::get('settings/{key}', [SettingController::class, 'show']);

// Rutas de autenticación
Route::post('login', [AuthController::class, 'login']);

// Rutas protegidas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
   // Rutas de autenticación
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);

    // Categorías
    Route::post('categories', [CategoryController::class, 'store']);
    Route::put('categories/{category}', [CategoryController::class, 'update']);
    Route::delete('categories/{category}', [CategoryController::class, 'destroy']);
    
    // Productos
    Route::post('products', [ProductController::class, 'store']);
    Route::put('products/{product}', [ProductController::class, 'update']);
    Route::delete('products/{product}', [ProductController::class, 'destroy']);
    Route::patch('products/{product}/toggle-availability', [ProductController::class, 'toggleAvailability']);
    
    // Blog Posts
    Route::post('blog-posts', [BlogPostController::class, 'store']);
    Route::put('blog-posts/{blogPost}', [BlogPostController::class, 'update']);
    Route::delete('blog-posts/{blogPost}', [BlogPostController::class, 'destroy']);
    
    // Configuraciones
    Route::post('settings', [SettingController::class, 'store']);
});