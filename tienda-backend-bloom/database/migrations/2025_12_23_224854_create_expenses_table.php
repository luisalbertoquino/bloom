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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['shipping', 'packaging', 'advertising', 'utilities', 'rent', 'salaries', 'other']);
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->date('expense_date');
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('set null'); // Si el gasto está asociado a un producto específico
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Usuario que registró el gasto
            $table->timestamps();

            $table->index('type');
            $table->index('expense_date');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
