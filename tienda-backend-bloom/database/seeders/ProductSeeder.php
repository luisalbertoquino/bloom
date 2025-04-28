<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // Collares (categoría 1)
            [
                'category_id' => 1,
                'name' => 'Collar Plateado Elegante',
                'description' => 'Hermoso collar plateado con diseño elegante, perfecto para ocasiones especiales.',
                'price' => 29.99,
                'main_image' => 'products/collar1.jpg',
                'available' => true,
                'stock' => 15
            ],
            [
                'category_id' => 1,
                'name' => 'Collar Dorado con Piedras',
                'description' => 'Collar dorado con incrustaciones de piedras preciosas artificiales.',
                'price' => 34.99,
                'main_image' => 'products/collar2.jpg',
                'available' => true,
                'stock' => 8
            ],
            [
                'category_id' => 1,
                'name' => 'Collar Minimalista',
                'description' => 'Collar de diseño minimalista, ideal para uso diario.',
                'price' => 19.99,
                'main_image' => 'products/collar3.jpg',
                'available' => true,
                'stock' => 20
            ],
            
            // Pulseras (categoría 2)
            [
                'category_id' => 2,
                'name' => 'Pulsera de Perlas',
                'description' => 'Elegante pulsera de perlas artificiales, perfecta para eventos formales.',
                'price' => 24.99,
                'main_image' => 'products/pulsera1.jpg',
                'available' => true,
                'stock' => 12
            ],
            [
                'category_id' => 2,
                'name' => 'Pulsera de Cuero',
                'description' => 'Pulsera de cuero sintético con detalles plateados, estilo casual.',
                'price' => 15.99,
                'main_image' => 'products/pulsera2.jpg',
                'available' => true,
                'stock' => 18
            ],
            
            // Aretes (categoría 3)
            [
                'category_id' => 3,
                'name' => 'Aretes Colgantes',
                'description' => 'Aretes colgantes con diseño floral, ideales para primavera y verano.',
                'price' => 22.99,
                'main_image' => 'products/aretes1.jpg',
                'available' => true,
                'stock' => 10
            ],
            [
                'category_id' => 3,
                'name' => 'Aretes de Botón',
                'description' => 'Aretes de botón con cristales, elegantes y sutiles.',
                'price' => 18.99,
                'main_image' => 'products/aretes2.jpg',
                'available' => true,
                'stock' => 14
            ],
            
            // Anillos (categoría 4)
            [
                'category_id' => 4,
                'name' => 'Anillo Ajustable',
                'description' => 'Anillo ajustable con diseño moderno, se adapta a cualquier tamaño de dedo.',
                'price' => 12.99,
                'main_image' => 'products/anillo1.jpg',
                'available' => true,
                'stock' => 25
            ],
            [
                'category_id' => 4,
                'name' => 'Set de Anillos',
                'description' => 'Set de 3 anillos combinables, perfectos para cualquier ocasión.',
                'price' => 28.99,
                'main_image' => 'products/anillo2.jpg',
                'available' => true,
                'stock' => 7
            ],
            
            // Tobilleras (categoría 5)
            [
                'category_id' => 5,
                'name' => 'Tobillera con Dijes',
                'description' => 'Tobillera con pequeños dijes, ideal para lucir en la playa.',
                'price' => 14.99,
                'main_image' => 'products/tobillera1.jpg',
                'available' => true,
                'stock' => 15
            ],
            
            // Sets (categoría 6)
            [
                'category_id' => 6,
                'name' => 'Set Collar y Aretes',
                'description' => 'Hermoso set que incluye collar y aretes a juego, perfecto para regalo.',
                'price' => 45.99,
                'main_image' => 'products/set1.jpg',
                'available' => true,
                'stock' => 5
            ],
            [
                'category_id' => 6,
                'name' => 'Set Completo',
                'description' => 'Set completo que incluye collar, aretes, pulsera y anillo, ideal para eventos especiales.',
                'price' => 79.99,
                'main_image' => 'products/set2.jpg',
                'available' => false,
                'stock' => 0
            ]
        ];

        foreach ($products as $productData) {
            $product = Product::create([
                'category_id' => $productData['category_id'],
                'name' => $productData['name'],
                'slug' => Str::slug($productData['name']),
                'description' => $productData['description'],
                'price' => $productData['price'],
                'main_image' => $productData['main_image'],
                'available' => $productData['available'],
                'stock' => $productData['stock']
            ]);

            // Creamos imágenes adicionales (2 por producto)
            for ($i = 1; $i <= 2; $i++) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => 'products/additional_' . $product->id . '_' . $i . '.jpg',
                    'order' => $i
                ]);
            }
        }
    }
}