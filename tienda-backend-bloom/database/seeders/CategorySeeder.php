<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Collares',
                'image' => 'categories/collares.jpg',
                'active' => true
            ],
            [
                'name' => 'Pulseras',
                'image' => 'categories/pulseras.jpg',
                'active' => true
            ],
            [
                'name' => 'Aretes',
                'image' => 'categories/aretes.jpg',
                'active' => true
            ],
            [
                'name' => 'Anillos',
                'image' => 'categories/anillos.jpg',
                'active' => true
            ],
            [
                'name' => 'Tobilleras',
                'image' => 'categories/tobilleras.jpg',
                'active' => true
            ],
            [
                'name' => 'Sets',
                'image' => 'categories/sets.jpg',
                'active' => true
            ]
        ];

        foreach ($categories as $category) {
            Category::create([
                'name' => $category['name'],
                'slug' => Str::slug($category['name']),
                'image' => $category['image'],
                'active' => $category['active']
            ]);
        }
    }
}