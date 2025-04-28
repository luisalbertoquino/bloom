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
            'site_title' => 'required|string|max:255',
            'primary_color' => 'required|string|max:20',
            'secondary_color' => 'required|string|max:20',
            'whatsapp_number' => 'required|string|max:20',
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Guardar cada configuración
        foreach ($request->except(['banner_image', 'logo', '_token']) as $key => $value) {
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

        return response()->json(['message' => 'Configuraciones guardadas con éxito']);
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