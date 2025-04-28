<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class BlogPostController extends Controller
{
    public function index()
    {
        $posts = BlogPost::all();
        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'banner_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'featured' => 'boolean'
        ]);

        $post = new BlogPost();
        $post->title = $request->title;
        $post->slug = Str::slug($request->title);
        $post->content = $request->content;
        $post->featured = $request->featured ?? false;

        if ($request->hasFile('banner_image')) {
            $path = $request->file('banner_image')->store('blog', 'public');
            $post->banner_image = $path;
        }

        $post->save();

        return response()->json($post, 201);
    }

    public function show(BlogPost $blogPost)
    {
        return response()->json($blogPost);
    }

    public function update(Request $request, BlogPost $blogPost)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'featured' => 'boolean'
        ]);

        $blogPost->title = $request->title;
        $blogPost->slug = Str::slug($request->title);
        $blogPost->content = $request->content;
        $blogPost->featured = $request->featured ?? $blogPost->featured;

        if ($request->hasFile('banner_image')) {
            // Eliminar imagen anterior si existe
            if ($blogPost->banner_image) {
                Storage::disk('public')->delete($blogPost->banner_image);
            }
            $path = $request->file('banner_image')->store('blog', 'public');
            $blogPost->banner_image = $path;
        }

        $blogPost->save();

        return response()->json($blogPost);
    }

    public function destroy(BlogPost $blogPost)
    {
        // Eliminar imagen si existe
        if ($blogPost->banner_image) {
            Storage::disk('public')->delete($blogPost->banner_image);
        }

        $blogPost->delete();

        return response()->json(null, 204);
    }
    
    public function featured()
    {
        $featuredPosts = BlogPost::where('featured', true)->take(3)->get();
        return response()->json($featuredPosts);
    }
}