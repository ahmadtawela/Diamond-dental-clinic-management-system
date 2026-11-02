<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PatientAgeValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create([
            'name' => 'receptionist',
            'display_name' => 'Receptionist',
        ]);
        Sanctum::actingAs(User::create([
            'role_id' => $role->id,
            'full_name' => 'Front Desk',
            'email' => 'receptionist@example.test',
            'password' => 'password',
            'is_active' => true,
        ]));
    }

    public function test_patient_must_be_at_least_15_years_old_when_created_or_updated(): void
    {
        $patientData = [
            'full_name' => 'Young Patient',
            'gender' => 'female',
            'phone' => '555-0100',
        ];

        $this->postJson('/api/v1/patients', $patientData + [
            'date_of_birth' => Carbon::today()->toDateString(),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['date_of_birth']);

        $patient = Patient::create($patientData);

        $this->putJson("/api/v1/patients/{$patient->id}", [
            'date_of_birth' => Carbon::today()->toDateString(),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['date_of_birth']);
    }

    public function test_patient_who_turns_15_today_is_allowed(): void
    {
        $this->postJson('/api/v1/patients', [
            'full_name' => 'Fifteen Year Old',
            'gender' => 'female',
            'phone' => '555-0101',
            'date_of_birth' => Carbon::today()->subYears(15)->toDateString(),
        ])->assertCreated();
    }
}
