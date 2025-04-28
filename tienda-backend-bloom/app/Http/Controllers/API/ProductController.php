<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('category')->get();
        return response()->json($products);
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'main_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'available' => 'boolean',
            'stock' => 'integer|min:0',
            'additional_images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $product = new Product();
        $product->category_id = $request->category_id;
        $product->name = $request->name;
        $product->slug = Str::slug($request->name);
        $product->description = $request->description;
        $product->price = $request->price;
        $product->available = $request->available ?? true;
        $product->stock = $request->stock ?? 0;

        if ($request->hasFile('main_image')) {
            $path = $request->file('main_image')->store('products', 'public');
            $product->main_image = $path;
        }

        $product->save();

        // Guardar imágenes adicionales si existen
        if ($request->hasFile('additional_images')) {
            $order = 1;
            foreach ($request->file('additional_images') as $image) {
                $path = $image->store('products', 'public');
                
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path,
                    'order' => $order++
                ]);
            }
        }

        return response()->json($product->load('images'), 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['category', 'images']));
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'main_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'available' => 'boolean',
            'stock' => 'integer|min:0',
            'additional_images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $product->category_id = $request->category_id;
        $product->name = $request->name;
        $product->slug = Str::slug($request->name);
        $product->description = $request->description;
        $product->price = $request->price;
        $product->available = $request->has('available') ? $request->available : $product->available;
        $product->stock = $request->stock ?? $product->stock;

        if ($request->hasFile('main_image')) {
            // Eliminar imagen anterior si existe
            if ($product->main_image) {
                Storage::disk('public')->delete($product->main_image);
            }
            $path = $request->file('main_image')->store('products', 'public');
            $product->main_image = $path;
        }

        $product->save();

        // Guardar imágenes adicionales si existen
        if ($request->hasFile('additional_images')) {
            $order = $product->images->max('order') + 1 ?? 1;
            foreach ($request->file('additional_images') as $image) {
                $path = $image->store('products', 'public');
                
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path,
                    'order' => $order++
                ]);
            }
        }

        return response()->json($product->load(['category', 'images']));
    }

    public function destroy(Product $product)
    {
        // Eliminar imagen principal si existe
        if ($product->main_image) {
            Storage::disk('public')->delete($product->main_image);
        }

        // Eliminar imágenes adicionales
        foreach ($product->images as $image) {
            Storage::disk('public')->delete($image->image_path);
            $image->delete();
        }

        $product->delete();

        return response()->json(null, 204);
    }
    
    public function toggleAvailability(Product $product)
    {
        $product->available = !$product->available;
        $product->save();
        
        return response()->json(['available' => $product->available]);
    }
}