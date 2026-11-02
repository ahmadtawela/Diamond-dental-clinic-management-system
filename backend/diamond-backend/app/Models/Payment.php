<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['invoice_id', 'amount', 'payment_method', 'paid_at', 'received_by', 'created_at'];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
