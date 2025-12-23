<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insertar configuraciones de Top Bar
        DB::table('settings')->insert([
            ['key' => 'top_bar_active', 'value' => 'false', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'top_bar_message', 'value' => '¡Envío gratis en compras mayores a $50!', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'top_bar_countdown_enabled', 'value' => 'false', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'top_bar_countdown_date', 'value' => '', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'top_bar_background_color', 'value' => '#1F2937', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'top_bar_text_color', 'value' => '#FFFFFF', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'top_bar_active',
            'top_bar_message',
            'top_bar_countdown_enabled',
            'top_bar_countdown_date',
            'top_bar_background_color',
            'top_bar_text_color'
        ])->delete();
    }
};
