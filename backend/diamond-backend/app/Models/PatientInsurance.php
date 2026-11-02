<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientInsurance extends Model
{
    use HasFactory;
    protected $table = 'patient_insurance';   // ← أضف هذا السطر

    public $timestamps = false;

    protected $fillable = ['patient_id', 'insurance_company_id', 'policy_number', 'coverage_percentage', 'valid_until'];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function company()
    {
        return $this->belongsTo(InsuranceCompany::class, 'insurance_company_id');
    }

    public function claims()
    {
        return $this->hasMany(InsuranceClaim::class);
    }
}
