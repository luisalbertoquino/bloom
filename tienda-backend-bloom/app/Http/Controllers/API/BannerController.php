<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BannerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $banners = Banner::ordered()->get();
        return response()->json($banners);
    }

    /**
     * Get only active banners (for public view)
     */
    public function active()
    {
        $banners = Banner::active()->ordered()->get();
        return response()->json($banners);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'link' => 'nullable|url',
            'order' => 'nullable|integer',
            'active' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('banners', 'public');
        }

        // Get the next order number if not provided
        $order = $request->input('order', Banner::max('order') + 1);

        $banner = Banner::create([
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'image' => $imagePath,
            'link' => $request->input('link'),
            'order' => $order,
            'active' => $request->input('active', true)
        ]);

        return response()->json([
            'message' => 'Banner created successfully',
            'banner' => $banner
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Banner $banner)
    {
        return response()->json($banner);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Banner $banner)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'link' => 'nullable|url',
            'order' => 'nullable|integer',
            'active' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($banner->image) {
                Storage::disk('public')->delete($banner->image);
            }
            $banner->image = $request->file('image')->store('banners', 'public');
        }

        // Update other fields
        $banner->title = $request->input('title', $banner->title);
        $banner->description = $request->input('description', $banner->description);
        $banner->link = $request->input('link', $banner->link);
        $banner->order = $request->input('order', $banner->order);
        $banner->active = $request->input('active', $banner->active);

        $banner->save();

        return response()->json([
            'message' => 'Banner updated successfully',
            'banner' => $banner
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Banner $banner)
    {
        // Delete image file
        if ($banner->image) {
            Storage::disk('public')->delete($banner->image);
        }

        $banner->delete();

        return response()->json([
            'message' => 'Banner deleted successfully'
        ]);
    }

    /**
     * Update banner order
     */
    public function updateOrder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'banners' => 'required|array',
            'banners.*.id' => 'required|exists:banners,id',
            'banners.*.order' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        foreach ($request->input('banners') as $bannerData) {
            Banner::where('id', $bannerData['id'])
                ->update(['order' => $bannerData['order']]);
        }

        return response()->json([
            'message' => 'Banner order updated successfully'
        ]);
    }
}
