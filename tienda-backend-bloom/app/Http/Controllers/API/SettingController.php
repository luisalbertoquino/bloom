<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function store(Request $request)
    {
        $request->validate([
            'site_title' => 'nullable|string|max:255',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'whatsapp_number' => 'nullable|string|max:20',
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'favicon' => 'nullable|file|mimes:jpeg,png,jpg,gif,ico|max:2048',
            // Top Bar settings
            'top_bar_active' => 'nullable|string',
            'top_bar_message' => 'nullable|string|max:255',
            'top_bar_countdown_enabled' => 'nullable|string',
            'top_bar_countdown_date' => 'nullable|string',
            'top_bar_background_color' => 'nullable|string|max:20',
            'top_bar_text_color' => 'nullable|string|max:20',
        ]);

        // Guardar cada configuración
        foreach ($request->except(['banner_image', 'logo', 'favicon', '_token']) as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        // Manejar imagen del banner
        if ($request->hasFile('banner_image')) {
            $bannerSetting = Setting::where('key', 'banner_image')->first();
            
            // Eliminar imagen anterior si existe
            if ($bannerSetting && $bannerSetting->value) {
                Storage::disk('public')->delete($bannerSetting->value);
            }
            
            $path = $request->file('banner_image')->store('settings', 'public');
            
            Setting::updateOrCreate(
                ['key' => 'banner_image'],
                ['value' => $path]
            );
        }

        // Manejar el logo
        if ($request->hasFile('logo')) {
            $logoSetting = Setting::where('key', 'logo')->first();
            
            // Eliminar imagen anterior si existe
            if ($logoSetting && $logoSetting->value) {
                Storage::disk('public')->delete($logoSetting->value);
            }
            
            $path = $request->file('logo')->store('settings', 'public');
            
            Setting::updateOrCreate(
                ['key' => 'logo'],
                ['value' => $path]
            );
        }

        // Manejar el favicon
        if ($request->hasFile('favicon')) {
            $faviconSetting = Setting::where('key', 'favicon')->first();
            
            // Eliminar imagen anterior si existe
            if ($faviconSetting && $faviconSetting->value) {
                Storage::disk('public')->delete($faviconSetting->value);
            }
            
            $path = $request->file('favicon')->store('settings', 'public');
            
            Setting::updateOrCreate(
                ['key' => 'favicon'],
                ['value' => $path]
            );
        }

        $updatedSettings = Setting::all()->pluck('value', 'key');
        return response()->json([
            'message' => 'Configuraciones guardadas con éxito',
            'settings' => $updatedSettings
        ]);
    }

    public function show($key)
    {
        $setting = Setting::where('key', $key)->first();
        
        if (!$setting) {
            return response()->json(['message' => 'Configuración no encontrada'], 404);
        }
        
        return response()->json($setting);
    }
}