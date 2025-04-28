<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'active' => 'boolean'
        ]);

        $category = new Category();
        $category->name = $request->name;
        $category->slug = Str::slug($request->name);
        $category->active = $request->active ?? true;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('categories', 'public');
            $category->image = $path;
        }

        $category->save();

        return response()->json($category, 201);
    }

    public function show(Category $category)
    {
        return response()->json($category);
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'active' => 'boolean'
        ]);

        $category->name = $request->name;
        $category->slug = Str::slug($request->name);
        $category->active = $request->active ?? $category->active;

        if ($request->hasFile('image')) {
            // Eliminar imagen anterior si existe
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $path = $request->file('image')->store('categories', 'public');
            $category->image = $path;
        }

        $category->save();

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        // Eliminar imagen si existe
        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return response()->json(null, 204);
    }
}