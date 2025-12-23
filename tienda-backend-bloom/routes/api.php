<?php

use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\BlogPostController;
use App\Http\Controllers\API\SettingController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\BannerController;
use App\Http\Controllers\API\PopupController;
use App\Http\Controllers\API\AnalyticsController;
use App\Http\Controllers\API\AccountingController;
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

// Banners públicos (solo activos)
Route::get('banners/active', [BannerController::class, 'active']);

// Popup público
Route::get('popup', [PopupController::class, 'index']);

// Analytics públicos (tracking)
Route::post('analytics/track', [AnalyticsController::class, 'track']);
Route::put('analytics/duration/{visitId}', [AnalyticsController::class, 'updateDuration']);

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
    Route::patch('products/{product}/adjust-stock', [ProductController::class, 'adjustStock']);
    
    // Blog Posts
    Route::post('blog-posts', [BlogPostController::class, 'store']);
    Route::put('blog-posts/{blogPost}', [BlogPostController::class, 'update']);
    Route::delete('blog-posts/{blogPost}', [BlogPostController::class, 'destroy']);
    
    // Configuraciones
    Route::post('settings', [SettingController::class, 'store']);

    // Banners (CRUD completo para admin)
    Route::get('banners', [BannerController::class, 'index']);
    Route::post('banners', [BannerController::class, 'store']);
    Route::get('banners/{banner}', [BannerController::class, 'show']);
    Route::post('banners/{banner}', [BannerController::class, 'update']); // POST porque enviamos FormData con imagen
    Route::delete('banners/{banner}', [BannerController::class, 'destroy']);
    Route::post('banners/update-order', [BannerController::class, 'updateOrder']);

    // Popup
    Route::post('popup', [PopupController::class, 'update']);

    // Analytics dashboard
    Route::get('analytics/dashboard', [AnalyticsController::class, 'dashboard']);

    // Accounting - Product Costs
    Route::get('products/{product}/costs', [AccountingController::class, 'getProductCosts']);
    Route::post('product-costs', [AccountingController::class, 'storeProductCost']);
    Route::put('product-costs/{productCost}', [AccountingController::class, 'updateProductCost']);
    Route::delete('product-costs/{productCost}', [AccountingController::class, 'deleteProductCost']);

    // Accounting - Expenses
    Route::get('expenses', [AccountingController::class, 'getExpenses']);
    Route::post('expenses', [AccountingController::class, 'storeExpense']);
    Route::put('expenses/{expense}', [AccountingController::class, 'updateExpense']);
    Route::delete('expenses/{expense}', [AccountingController::class, 'deleteExpense']);

    // Accounting - Dashboard
    Route::get('accounting/dashboard', [AccountingController::class, 'dashboard']);
    Route::get('accounting/products-without-costs', [AccountingController::class, 'getProductsWithoutCosts']);
});