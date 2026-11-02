<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppointmentReminder extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['appointment_id', 'channel', 'scheduled_at', 'sent_at', 'status'];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
