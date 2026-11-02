<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // GET /api/v1/reports/revenue?period=daily|monthly|yearly
    public function revenue(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $format = match ($period) {
            'daily' => '%Y-%m-%d',
            'yearly' => '%Y',
            default => '%Y-%m',
        };

        $collected = Payment::selectRaw("DATE_FORMAT(paid_at, '{$format}') as bucket, SUM(amount) as collected")
            ->groupBy('bucket')->orderBy('bucket')->get();

        $outstanding = Invoice::where('status', '!=', 'paid')->sum(DB::raw('total_amount - paid_amount'));

        return response()->json([
            'period' => $period,
            'collected_by_period' => $collected,
            'total_outstanding' => (float) $outstanding,
        ]);
    }

    // GET /api/v1/reports/patient-stats
    public function patientStats(Request $request)
    {
        $from = $request->input('from', now()->subMonth()->toDateString());
        $to = $request->input('to', now()->toDateString());

        $newPatients = Patient::whereBetween('created_at', [$from, $to])->count();

        $topDoctors = DB::table('visits')
            ->join('doctors', 'doctors.id', '=', 'visits.doctor_id')
            ->join('users', 'users.id', '=', 'doctors.user_id')
            ->selectRaw('users.full_name as doctor, COUNT(*) as visit_count')
            ->whereBetween('visits.visit_date', [$from, $to])
            ->groupBy('users.full_name')
            ->orderByDesc('visit_count')
            ->limit(5)
            ->get();

        return response()->json([
            'range' => [$from, $to],
            'new_patients' => $newPatients,
            'most_visited_doctors' => $topDoctors,
        ]);
    }
}
