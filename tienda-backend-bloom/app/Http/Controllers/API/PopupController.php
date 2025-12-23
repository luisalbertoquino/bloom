<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PopupSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PopupController extends Controller
{
    /**
     * Get popup settings (public endpoint)
     */
    public function index()
    {
        $popup = PopupSetting::first();
        return response()->json($popup);
    }

    /**
     * Update popup settings (admin only)
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'active' => 'sometimes|boolean',
            'image_only_mode' => 'sometimes|boolean',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'show_frequency' => 'sometimes|in:once,always,once_per_day,once_per_session',
            'delay_seconds' => 'sometimes|integer|min:0|max:60'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $popup = PopupSetting::first();
        if (!$popup) {
            $popup = new PopupSetting();
        }

        // Actualizar campos básicos
        if ($request->has('active')) {
            $popup->active = $request->active;
        }
        if ($request->has('image_only_mode')) {
            $popup->image_only_mode = $request->image_only_mode;
        }
        if ($request->has('title')) {
            $popup->title = $request->title;
        }
        if ($request->has('content')) {
            $popup->content = $request->content;
        }
        if ($request->has('button_text')) {
            $popup->button_text = $request->button_text;
        }
        if ($request->has('button_link')) {
            $popup->button_link = $request->button_link;
        }
        if ($request->has('show_frequency')) {
            $popup->show_frequency = $request->show_frequency;
        }
        if ($request->has('delay_seconds')) {
            $popup->delay_seconds = $request->delay_seconds;
        }

        // Manejar la imagen
        if ($request->hasFile('image')) {
            // Eliminar imagen anterior si existe
            if ($popup->image && Storage::disk('public')->exists($popup->image)) {
                Storage::disk('public')->delete($popup->image);
            }

            $image = $request->file('image');
            $imageName = time() . '_popup.' . $image->getClientOriginalExtension();
            $imagePath = $image->storeAs('popup', $imageName, 'public');
            $popup->image = $imagePath;
        }

        $popup->save();

        return response()->json([
            'message' => 'Popup actualizado correctamente',
            'popup' => $popup
        ]);
    }
}
