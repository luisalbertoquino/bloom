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
        Schema::create('popup_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('active')->default(false);
            $table->string('title')->nullable();
            $table->text('content')->nullable();
            $table->string('image')->nullable();
            $table->string('button_text')->nullable();
            $table->string('button_link')->nullable();
            $table->string('show_frequency')->default('once_per_session'); // once, always, once_per_day, once_per_session
            $table->integer('delay_seconds')->default(3);
            $table->timestamps();
        });

        // Insertar configuración inicial
        DB::table('popup_settings')->insert([
            'active' => false,
            'title' => '¡Bienvenido!',
            'content' => 'Aprovecha nuestras ofertas especiales',
            'button_text' => 'Ver ofertas',
            'button_link' => '/productos',
            'show_frequency' => 'once_per_session',
            'delay_seconds' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('popup_settings');
    }
};
