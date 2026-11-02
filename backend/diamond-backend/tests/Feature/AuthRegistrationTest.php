<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create([
            'name' => 'receptionist',
            'display_name' => 'Receptionist',
        ]);
    }

    public function test_registration_creates_an_inactive_receptionist_account(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'full_name' => 'New Staff Member',
            'email' => 'new.staff@example.test',
            'password' => 'secure-password',
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Account created. Your account is pending administrator approval.');

        $user = User::where('email', 'new.staff@example.test')->firstOrFail();

        $this->assertSame('New Staff Member', $user->full_name);
        $this->assertSame('receptionist', $user->role->name);
        $this->assertFalse($user->is_active);
        $this->assertTrue(Hash::check('secure-password', $user->password));
    }

    public function test_registered_account_cannot_log_in_until_activated(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'full_name' => 'New Staff Member',
            'email' => 'new.staff@example.test',
            'password' => 'secure-password',
        ])->assertCreated();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'new.staff@example.test',
            'password' => 'secure-password',
        ])->assertUnprocessable();

        User::where('email', 'new.staff@example.test')->update(['is_active' => true]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'new.staff@example.test',
            'password' => 'secure-password',
        ])->assertOk()
            ->assertJsonPath('user.email', 'new.staff@example.test');
    }

    public function test_registration_validates_required_fields_and_unique_email(): void
    {
        $payload = [
            'full_name' => 'New Staff Member',
            'email' => 'new.staff@example.test',
            'password' => 'secure-password',
        ];

        $this->postJson('/api/v1/auth/register', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['full_name', 'email', 'password']);

        $this->postJson('/api/v1/auth/register', $payload)->assertCreated();
        $this->postJson('/api/v1/auth/register', $payload)->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }
}
