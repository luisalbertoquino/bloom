<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'description',
        'amount',
        'expense_date',
        'product_id',
        'notes',
        'user_id'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date'
    ];

    // Relación con producto (si aplica)
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Relación con usuario que registró el gasto
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
