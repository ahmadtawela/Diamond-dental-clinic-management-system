<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentReminder;
use App\Models\Doctor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::with(['patient', 'doctor.user'])
            ->when($request->date, fn ($q, $date) => $q->whereDate('appointment_date', $date))
            ->when($request->doctor_id, fn ($q, $id) => $q->where('doctor_id', $id))
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->from && $request->to, fn ($q) => $q->whereBetween('appointment_date', [$request->from, $request->to]))
            ->orderBy('appointment_date')->orderBy('start_time');

        // Calendar month view needs every matching appointment in the range, not one page of 30.
        if ($request->from && $request->to) {
            return response()->json(['data' => $query->get()]);
        }

        return response()->json($query->paginate(30));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'doctor_id' => ['required', 'exists:doctors,id'],
            'appointment_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $data['created_by'] = $request->user()->id;
        $result = DB::transaction(function () use ($data) {
            Doctor::whereKey($data['doctor_id'])->lockForUpdate()->firstOrFail();

            if ($this->hasOverlappingAppointment(
                $data['doctor_id'],
                $data['appointment_date'],
                $data['start_time'],
                $data['end_time'],
            )) {
                return null;
            }

            $appointment = Appointment::create($data);

            AppointmentReminder::create([
                'appointment_id' => $appointment->id,
                'channel' => 'whatsapp',
                'scheduled_at' => Carbon::parse($data['appointment_date'].' '.$data['start_time'])->subDay(),
                'status' => 'pending',
            ]);

            return $appointment;
        });

        if ($result === null) {
            return response()->json(['message' => 'This doctor already has an appointment in that time slot.'], 422);
        }

        return response()->json($result->load('patient', 'doctor'), 201);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $data = $request->validate([
            'appointment_date' => ['sometimes', 'date'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $data = array_merge([
            'appointment_date' => $appointment->appointment_date,
            'start_time' => $appointment->start_time,
            'end_time' => $appointment->end_time,
        ], $data);

        $updated = DB::transaction(function () use ($appointment, $data) {
            Doctor::whereKey($appointment->doctor_id)->lockForUpdate()->firstOrFail();

            if ($this->hasOverlappingAppointment(
                $appointment->doctor_id,
                $data['appointment_date'],
                $data['start_time'],
                $data['end_time'],
                $appointment->id,
            )) {
                return false;
            }

            $appointment->update($data);

            return true;
        });

        if (! $updated) {
            return response()->json(['message' => 'This doctor already has an appointment in that time slot.'], 422);
        }

        return response()->json($appointment);
    }

    public function updateStatus(Request $request, Appointment $appointment)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'confirmed', 'cancelled', 'attended'])],
        ]);

        $updated = DB::transaction(function () use ($appointment, $data) {
            Doctor::whereKey($appointment->doctor_id)->lockForUpdate()->firstOrFail();

            if ($data['status'] !== 'cancelled' && $this->hasOverlappingAppointment(
                $appointment->doctor_id,
                $appointment->appointment_date,
                $appointment->start_time,
                $appointment->end_time,
                $appointment->id,
            )) {
                return false;
            }

            $appointment->update($data);

            return true;
        });

        if (! $updated) {
            return response()->json(['message' => 'This doctor already has an appointment in that time slot.'], 422);
        }

        return response()->json($appointment);
    }

    public function listDoctors()
    {
        return response()->json(Doctor::with('user:id,full_name')->get(['id', 'user_id', 'specialty']));
    }

    public function availability(Request $request, Doctor $doctor)
    {
        $date = $request->validate(['date' => ['required', 'date']])['date'];

        $booked = $doctor->appointments()
            ->where('appointment_date', $date)
            ->where('status', '!=', 'cancelled')
            ->orderBy('start_time')
            ->get(['start_time', 'end_time']);

        return response()->json([
            'doctor_id' => $doctor->id,
            'date' => $date,
            'booked_slots' => $booked,
        ]);
    }

    private function hasOverlappingAppointment(
        int $doctorId,
        string $date,
        string $startTime,
        string $endTime,
        ?int $ignoreAppointmentId = null,
    ): bool {
        return Appointment::where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->where('status', '!=', 'cancelled')
            ->when($ignoreAppointmentId, fn ($query) => $query->where('id', '!=', $ignoreAppointmentId))
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->exists();
    }
}
