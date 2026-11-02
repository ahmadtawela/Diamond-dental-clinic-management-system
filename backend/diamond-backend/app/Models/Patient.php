<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name', 'national_id', 'date_of_birth', 'gender', 'phone', 'address', 'status',
    ];

    public function medicalHistory()
    {
        return $this->hasOne(MedicalHistory::class);
    }

    public function dentalChartRecords()
    {
        return $this->hasMany(DentalChartRecord::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function treatmentPlans()
    {
        return $this->hasMany(TreatmentPlan::class);
    }

    public function visits()
    {
        return $this->hasMany(Visit::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function insurancePolicies()
    {
        return $this->hasMany(PatientInsurance::class);
    }

    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
}
