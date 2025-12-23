<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_url',
        'referrer',
        'user_agent',
        'ip_address',
        'session_id',
        'visit_duration'
    ];

    protected $casts = [
        'visit_duration' => 'integer'
    ];
}
