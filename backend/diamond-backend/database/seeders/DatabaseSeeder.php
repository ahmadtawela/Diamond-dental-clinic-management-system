<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        // A default admin account so you can log in on a fresh install.
        User::firstOrCreate(
            ['email' => 'admin@diamond-clinic.test'],
            [
                'full_name' => 'System Administrator',
                'password' => Hash::make('12345678'),
                'role_id' => Role::where('name', 'admin')->value('id'),
                'is_active' => true,
            ]
        );

           User::firstOrCreate(
            ['email' => 'doctor@diamond-clinic.test'],
            [
                'full_name' => 'doctor ',
                'password' => Hash::make('123456789'),
                'role_id' => Role::where('name', 'doctor')->value('id'),
                'is_active' => true,
            ]
        );

        
        

    }
}
