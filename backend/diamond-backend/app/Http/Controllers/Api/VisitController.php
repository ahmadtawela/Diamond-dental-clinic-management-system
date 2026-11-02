<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Visit;
use Illuminate\Http\Request;

class VisitController extends Controller
{
    public function index(Patient $patient)
    {
        return response()->json(
            $patient->visits()->with('doctor.user', 'prescriptions.items')->latest('visit_date')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'doctor_id' => ['required', 'exists:doctors,id'],
            'appointment_id' => ['nullable', 'exists:appointments,id'],
            'visit_date' => ['required', 'date'],
            'symptoms' => ['nullable', 'string'],
            'diagnosis' => ['nullable', 'string'],
            'procedure_performed' => ['nullable', 'string'],
            'recommendations' => ['nullable', 'string'],
        ]);

        $visit = Visit::create($data);

        if (! empty($data['appointment_id'])) {
            $visit->appointment()->update(['status' => 'attended']);
        }

        return response()->json($visit, 201);
    }

    public function storePrescription(Request $request, Visit $visit)
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicine_name' => ['required', 'string', 'max:150'],
            'items.*.dosage' => ['required', 'string', 'max:100'],
            'items.*.frequency' => ['required', 'string', 'max:100'],
            'items.*.duration' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $prescription = Prescription::create([
            'visit_id' => $visit->id,
            'patient_id' => $visit->patient_id,
            'doctor_id' => $visit->doctor_id,
            'issued_at' => now(),
            'notes' => $data['notes'] ?? null,
        ]);

        $prescription->items()->createMany($data['items']);

        return response()->json($prescription->load('items'), 201);
    }

    public function attachments(Patient $patient)
    {
        return response()->json($patient->attachments()->latest('uploaded_at')->get());
    }

    public function storeAttachment(Request $request, Patient $patient)
    {
        $data = $request->validate([
            'visit_id' => ['nullable', 'exists:visits,id'],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf,dcm', 'max:20480'],
            'file_type' => ['required', 'in:xray,photo,document'],
        ]);

        $path = $request->file('file')->store("patients/{$patient->id}/attachments", 'public');

        $attachment = Attachment::create([
            'patient_id' => $patient->id,
            'visit_id' => $data['visit_id'] ?? null,
            'file_path' => $path,
            'file_type' => $data['file_type'],
            'uploaded_by' => $request->user()->id,
            'uploaded_at' => now(),
        ]);

        return response()->json($attachment, 201);
    }
}
