<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TreatmentPlanItem extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['treatment_plan_id', 'procedure_name', 'tooth_number', 'session_number', 'cost'];

    public function treatmentPlan()
    {
        return $this->belongsTo(TreatmentPlan::class);
    }
}
