<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DentalChartRecord;
use App\Models\MedicalHistory;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $patients = Patient::query()
            ->when($request->search, fn ($q, $search) => $q->where('full_name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('national_id', 'like', "%{$search}%"))
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->orderBy('full_name')
            ->paginate(20);

        return response()->json($patients);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'national_id' => ['nullable', 'string', 'max:50', 'unique:patients,national_id'],
            'date_of_birth' => ['nullable', 'date', 'before_or_equal:'.Carbon::today()->subYears(15)->toDateString()],
            'gender' => ['required', 'in:male,female'],
            'phone' => ['required', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
        ], [
            'date_of_birth.before_or_equal' => 'The patient must be at least 15 years old.',
        ]);

        $patient = Patient::create($data);

        return response()->json($patient, 201);
    }

    public function show(Request $request, Patient $patient)
    {
        if ($request->user()->isRole('receptionist')) {
            return response()->json($patient->only([
                'id', 'full_name', 'national_id', 'date_of_birth', 'gender',
                'phone', 'address', 'status', 'created_at', 'updated_at',
            ]));
        }

        return response()->json($patient->load([
            'medicalHistory', 'dentalChartRecords', 'appointments', 'treatmentPlans',
        ]));
    }

    public function update(Request $request, Patient $patient)
    {
        $data = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:150'],
            'national_id' => ['nullable', 'string', 'max:50', 'unique:patients,national_id,'.$patient->id],
            'date_of_birth' => ['nullable', 'date', 'before_or_equal:'.Carbon::today()->subYears(15)->toDateString()],
            'gender' => ['sometimes', 'in:male,female'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
        ], [
            'date_of_birth.before_or_equal' => 'The patient must be at least 15 years old.',
        ]);

        $patient->update($data);

        return response()->json($patient);
    }

    public function archive(Patient $patient)
    {
        $patient->update([
            'status' => $patient->status === 'active' ? 'archived' : 'active',
        ]);

        return response()->json($patient);
    }

    // -- Medical history -----------------------------------------------

    public function medicalHistory(Patient $patient)
    {
        return response()->json($patient->medicalHistory);
    }

    public function updateMedicalHistory(Request $request, Patient $patient)
    {
        $data = $request->validate([
            'chronic_diseases' => ['nullable', 'string'],
            'drug_allergies' => ['nullable', 'string'],
            'previous_surgeries' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $history = MedicalHistory::updateOrCreate(['patient_id' => $patient->id], $data);

        return response()->json($history);
    }

    // -- Dental chart -----------------------------------------------------

    public function dentalChart(Patient $patient)
    {
        return response()->json($patient->dentalChartRecords()->latest('recorded_at')->get());
    }

    public function addDentalChartRecord(Request $request, Patient $patient)
    {
        $data = $request->validate([
            'doctor_id' => ['nullable', 'exists:doctors,id'],
            'tooth_number' => ['required', 'integer', 'between:11,48'],
            'condition_type' => ['required', 'in:healthy,decayed,filled,missing,crowned,implant'],
            'procedure_type' => ['nullable', 'in:filling,root_canal,extraction,implant,crown,cleaning,other'],
            'status' => ['nullable', 'in:planned,in_progress,completed'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['patient_id'] = $patient->id;
        $data['recorded_at'] = now();

        $record = DentalChartRecord::create($data);

        return response()->json($record, 201);
    }
}
