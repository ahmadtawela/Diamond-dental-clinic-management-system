<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrescriptionItem extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['prescription_id', 'medicine_name', 'dosage', 'frequency', 'duration'];

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }
}
