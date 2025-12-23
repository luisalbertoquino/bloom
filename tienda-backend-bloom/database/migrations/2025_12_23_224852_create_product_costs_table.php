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
        Schema::create('product_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->decimal('cost_price', 10, 2); // Precio de compra/costo
            $table->decimal('sale_price', 10, 2); // Precio de venta (referencia)
            $table->decimal('profit_margin', 10, 2)->nullable(); // Margen de ganancia calculado
            $table->date('effective_date'); // Fecha efectiva del costo
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('product_id');
            $table->index('effective_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_costs');
    }
};
