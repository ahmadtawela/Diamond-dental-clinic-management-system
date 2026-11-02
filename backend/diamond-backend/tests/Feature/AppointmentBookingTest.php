<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AppointmentBookingTest extends TestCase
{
    use RefreshDatabase;

    private Doctor $doctor;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create([
            'name' => 'receptionist',
            'display_name' => 'Receptionist',
        ]);
        $user = User::create([
            'role_id' => $role->id,
            'full_name' => 'Front Desk',
            'email' => 'receptionist@example.test',
            'password' => 'password',
            'is_active' => true,
        ]);
        Sanctum::actingAs($user);

        $doctorUser = User::create([
            'role_id' => $role->id,
            'full_name' => 'Doctor',
            'email' => 'doctor@example.test',
            'password' => 'password',
            'is_active' => true,
        ]);
        $this->doctor = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialty' => 'Dentistry',
        ]);
        $this->patient = Patient::create([
            'full_name' => 'Sample Patient',
            'gender' => 'female',
            'phone' => '555-0100',
        ]);
    }

    public function test_pending_appointment_holds_slot_until_cancelled(): void
    {
        $payload = $this->appointmentPayload();

        $this->postJson('/api/v1/appointments', $payload)->assertCreated();
        $this->assertDatabaseHas('appointments', ['status' => 'pending']);

        $this->postJson('/api/v1/appointments', $payload)->assertUnprocessable();

        $appointment = Appointment::firstOrFail();
        $this->patchJson("/api/v1/appointments/{$appointment->id}/status", [
            'status' => 'cancelled',
        ])->assertOk();
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'cancelled',
        ]);

        $this->postJson('/api/v1/appointments', $payload)->assertCreated();
    }

    public function test_overlapping_slots_are_rejected_but_back_to_back_slots_are_allowed(): void
    {
        $this->postJson('/api/v1/appointments', $this->appointmentPayload())
            ->assertCreated();

        $this->postJson('/api/v1/appointments', $this->appointmentPayload([
            'start_time' => '09:15',
            'end_time' => '09:30',
        ]))->assertUnprocessable();

        $this->postJson('/api/v1/appointments', $this->appointmentPayload([
            'start_time' => '10:00',
            'end_time' => '10:30',
        ]))->assertCreated();
    }

    public function test_cancelled_appointment_cannot_be_reactivated_while_its_slot_is_taken(): void
    {
        $payload = $this->appointmentPayload();
        $this->postJson('/api/v1/appointments', $payload)->assertCreated();
        $appointment = Appointment::firstOrFail();

        $this->patchJson("/api/v1/appointments/{$appointment->id}/status", [
            'status' => 'cancelled',
        ])->assertOk();
        $this->postJson('/api/v1/appointments', $payload)->assertCreated();

        $this->patchJson("/api/v1/appointments/{$appointment->id}/status", [
            'status' => 'confirmed',
        ])->assertUnprocessable();
    }

    private function appointmentPayload(array $overrides = []): array
    {
        return array_merge([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'appointment_date' => Carbon::today()->addDays(3)->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
        ], $overrides);
    }
}
