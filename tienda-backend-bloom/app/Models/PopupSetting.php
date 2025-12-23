<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PopupSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'active',
        'title',
        'content',
        'image',
        'button_text',
        'button_link',
        'show_frequency',
        'delay_seconds'
    ];

    protected $casts = [
        'active' => 'boolean',
        'delay_seconds' => 'integer'
    ];
}
