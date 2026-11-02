<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatment_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained();
            $table->string('title', 150);
            $table->decimal('estimated_cost', 10, 2)->default(0);
            $table->unsignedSmallInteger('estimated_sessions')->default(1);
            $table->enum('status', ['proposed', 'accepted', 'in_progress', 'completed', 'cancelled'])->default('proposed');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treatment_plans');
    }
};
