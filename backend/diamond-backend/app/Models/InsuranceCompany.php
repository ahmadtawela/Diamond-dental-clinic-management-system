<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InsuranceCompany extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'contact_info'];

    public function patientPolicies()
    {
        return $this->hasMany(PatientInsurance::class);
    }
}
