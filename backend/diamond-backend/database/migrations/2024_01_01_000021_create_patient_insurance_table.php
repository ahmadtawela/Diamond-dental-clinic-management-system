<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_insurance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('insurance_company_id')->constrained();
            $table->string('policy_number', 50);
            $table->decimal('coverage_percentage', 5, 2)->default(0);
            $table->date('valid_until')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_insurance');
    }
};
