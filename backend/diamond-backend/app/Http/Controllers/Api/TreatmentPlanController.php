<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\TreatmentPlan;
use Illuminate\Http\Request;

class TreatmentPlanController extends Controller
{
    public function index(Patient $patient)
    {
        return response()->json($patient->treatmentPlans()->with('items', 'doctor.user')->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'doctor_id' => ['required', 'exists:doctors,id'],
            'title' => ['required', 'string', 'max:150'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.procedure_name' => ['required', 'string', 'max:150'],
            'items.*.tooth_number' => ['nullable', 'integer', 'between:11,48'],
            'items.*.session_number' => ['nullable', 'integer', 'min:1'],
            'items.*.cost' => ['required', 'numeric', 'min:0'],
        ]);

        $plan = TreatmentPlan::create([
            'patient_id' => $data['patient_id'],
            'doctor_id' => $data['doctor_id'],
            'title' => $data['title'],
            'estimated_cost' => collect($data['items'])->sum('cost'),
            'estimated_sessions' => collect($data['items'])->max('session_number') ?? 1,
        ]);

        $plan->items()->createMany($data['items']);

        return response()->json($plan->load('items'), 201);
    }

    public function update(Request $request, TreatmentPlan $treatmentPlan)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:150'],
            'status' => ['sometimes', 'in:proposed,accepted,in_progress,completed,cancelled'],
        ]);

        $treatmentPlan->update($data);

        return response()->json($treatmentPlan);
    }
}
