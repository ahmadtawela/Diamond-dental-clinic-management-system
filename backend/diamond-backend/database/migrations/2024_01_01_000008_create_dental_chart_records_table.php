<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dental_chart_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained();
            $table->unsignedTinyInteger('tooth_number');
            $table->enum('condition_type', ['healthy', 'decayed', 'filled', 'missing', 'crowned', 'implant']);
            $table->enum('procedure_type', ['filling', 'root_canal', 'extraction', 'implant', 'crown', 'cleaning', 'other'])->nullable();
            $table->enum('status', ['planned', 'in_progress', 'completed'])->default('planned');
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dental_chart_records');
    }
};
