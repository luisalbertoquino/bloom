<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Iniciar sesión y crear token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $user = $request->user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    /**
     * Cerrar sesión (revocar token)
     */
    public function logout(Request $request)
    {
        try {
            // Verificar si el usuario está autenticado con un token personal
            $user = $request->user();
            
            if ($user) {
                // Verificar si el token es un token personal (no transitorio)
                $currentToken = $user->currentAccessToken();
                
                // Solo intentar borrar si es un token personal y no transitorio
                if ($currentToken && method_exists($currentToken, 'delete')) {
                    $currentToken->delete();
                }
            }
            
            // Cerrar sesión en la guard web también (para cookies)
            Auth::guard('web')->logout();
            
            // Invalidar la sesión
            if ($request->session()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
            
            return response()->json(['message' => 'Sesión cerrada correctamente']);
            
        } catch (\Exception $e) {
            // Loguear el error
            \Log::error('Error during logout: ' . $e->getMessage());
            
            // Devolver un mensaje amigable
            return response()->json(['message' => 'Ocurrió un error al cerrar la sesión'], 500);
        }
    }

    /**
     * Obtener usuario autenticado
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}