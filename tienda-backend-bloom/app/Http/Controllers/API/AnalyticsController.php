<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PageVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Track page visit (público)
     */
    public function track(Request $request)
    {
        $visit = PageVisit::create([
            'page_url' => $request->input('page_url'),
            'referrer' => $request->input('referrer'),
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
            'session_id' => $request->input('session_id'),
            'visit_duration' => 0
        ]);

        return response()->json(['visit_id' => $visit->id]);
    }

    /**
     * Update visit duration (público)
     */
    public function updateDuration(Request $request, $visitId)
    {
        $visit = PageVisit::find($visitId);
        if ($visit) {
            $visit->visit_duration = $request->input('duration', 0);
            $visit->save();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get dashboard stats (admin)
     */
    public function dashboard()
    {
        $today = Carbon::today();
        $weekAgo = Carbon::now()->subDays(7);

        // Visitas hoy, esta semana, este mes
        $stats = [
            'visits_today' => PageVisit::whereDate('created_at', $today)->count(),
            'visits_week' => PageVisit::where('created_at', '>=', $weekAgo)->count(),
            'visits_month' => PageVisit::where('created_at', '>=', Carbon::now()->subDays(30))->count(),
            'avg_duration' => round(PageVisit::where('visit_duration', '>', 0)->avg('visit_duration') ?? 0),

            // Top páginas
            'top_pages' => PageVisit::select('page_url', DB::raw('count(*) as visits'))
                ->groupBy('page_url')
                ->orderByDesc('visits')
                ->limit(5)
                ->get(),

            // Top referrers
            'top_referrers' => PageVisit::select('referrer', DB::raw('count(*) as visits'))
                ->whereNotNull('referrer')
                ->where('referrer', '!=', '')
                ->groupBy('referrer')
                ->orderByDesc('visits')
                ->limit(5)
                ->get(),

            // Visitas por día (últimos 7 días)
            'visits_by_day' => PageVisit::select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('count(*) as visits')
                )
                ->where('created_at', '>=', $weekAgo)
                ->groupBy('date')
                ->orderBy('date')
                ->get()
        ];

        return response()->json($stats);
    }
}
