<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReceptionistPermissionsTest extends TestCase
{
    use RefreshDatabase;

    private Patient $patient;

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

        $this->patient = Patient::create([
            'full_name' => 'Sample Patient',
            'gender' => 'female',
            'phone' => '555-0100',
        ]);
    }

    public function test_receptionist_can_view_basic_patient_and_read_only_clinical_records(): void
    {
        $this->getJson("/api/v1/patients/{$this->patient->id}")
            ->assertOk()
            ->assertJsonPath('full_name', 'Sample Patient')
            ->assertJsonMissingPath('medical_history')
            ->assertJsonMissingPath('dental_chart_records')
            ->assertJsonMissingPath('treatment_plans');

        $this->getJson("/api/v1/patients/{$this->patient->id}/dental-chart")->assertOk();
        $this->getJson("/api/v1/patients/{$this->patient->id}/treatment-plans")->assertOk();
        $this->getJson("/api/v1/patients/{$this->patient->id}/invoices")->assertOk();
        $this->getJson("/api/v1/patients/{$this->patient->id}/insurance")->assertOk();
        $this->getJson('/api/v1/appointments')->assertOk();
    }

    public function test_receptionist_cannot_access_private_clinical_records_reports_or_admin_tools(): void
    {
        $this->getJson("/api/v1/patients/{$this->patient->id}/medical-history")->assertForbidden();
        $this->getJson("/api/v1/patients/{$this->patient->id}/visits")->assertForbidden();
        $this->getJson("/api/v1/patients/{$this->patient->id}/attachments")->assertForbidden();
        $this->postJson("/api/v1/patients/{$this->patient->id}/dental-chart", [])->assertForbidden();
        $this->postJson('/api/v1/treatment-plans', [])->assertForbidden();
        $this->postJson('/api/v1/visits', [])->assertForbidden();
        $this->getJson('/api/v1/reports/revenue')->assertForbidden();
        $this->getJson('/api/v1/reports/patient-stats')->assertForbidden();
        $this->getJson('/api/v1/users')->assertForbidden();
        $this->getJson('/api/v1/roles')->assertForbidden();
    }
}
