<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductCost extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'cost_price',
        'sale_price',
        'profit_margin',
        'effective_date',
        'notes'
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'profit_margin' => 'decimal:2',
        'effective_date' => 'date'
    ];

    // Relación con producto
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Calcular margen de ganancia automáticamente
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($productCost) {
            if ($productCost->cost_price > 0) {
                $productCost->profit_margin = (($productCost->sale_price - $productCost->cost_price) / $productCost->cost_price) * 100;
            }
        });
    }
}
