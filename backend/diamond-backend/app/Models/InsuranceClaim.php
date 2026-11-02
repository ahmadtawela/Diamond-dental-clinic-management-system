<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InsuranceClaim extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id', 'patient_insurance_id', 'claim_amount', 'company_share', 'patient_share', 'status',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function patientInsurance()
    {
        return $this->belongsTo(PatientInsurance::class);
    }
}
