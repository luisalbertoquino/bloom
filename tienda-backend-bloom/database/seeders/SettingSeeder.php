<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'site_title',
                'value' => 'Bloom Accesorios'
            ],
            [
                'key' => 'primary_color',
                'value' => '#fc6280'  // Rosa/fucsia
            ],
            [
                'key' => 'secondary_color',
                'value' => '#f8a5c2'  // Rosa claro
            ],
            [
                'key' => 'facebook',
                'value' => 'tuempresa'  // Solo el nombre de usuario, sin la URL completa
            ],
            [
                'key' => 'instagram',
                'value' => 'tuempresa'  // Solo el nombre de usuario, sin la URL completa
            ],
            [
                'key' => 'twitter',
                'value' => 'tuempresa'  // Solo el nombre de usuario, sin la URL completa
            ],
            [
                'key' => 'youtube',
                'value' => 'channel/UC123456'  // ID del canal o usuario
            ],
            [
                'key' => 'whatsapp_number',
                'value' => '+1234567890'  // Número con formato internacional
            ],
            [
                'key' => 'banner_image',
                'value' => 'settings/banner.jpg'
            ],
            [
                'key' => 'logo',
                'value' => 'settings/logo.png'
            ],
            [
                'key' => 'footer_text',
                'value' => 'Bloom Accesorios - Tu tienda de accesorios favorita'
            ],
            [
                'key' => 'address',
                'value' => 'Calle Principal #123, Ciudad'
            ],
            [
                'key' => 'phone',
                'value' => '(123) 456-7890'
            ],
            [
                'key' => 'email',
                'value' => 'info@bloomaccesorios.com'
            ],
            [
                'key' => 'favicon',
                'value' => 'settings/favicon.ico'
            ]
            
        ];

        foreach ($settings as $setting) {
            Setting::create([
                'key' => $setting['key'],
                'value' => $setting['value']
            ]);
        }
    }
}