<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
           $table->foreignId('patient_insurance_id')->constrained('patient_insurance');
            $table->decimal('claim_amount', 10, 2);
            $table->decimal('company_share', 10, 2);
            $table->decimal('patient_share', 10, 2);
            $table->enum('status', ['submitted', 'approved', 'rejected', 'paid'])->default('submitted');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_claims');
    }
};
