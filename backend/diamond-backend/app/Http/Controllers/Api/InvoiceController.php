<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function index(Patient $patient)
    {
        return response()->json($patient->invoices()->with('items', 'payments', 'insuranceClaim')->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'visit_id' => ['nullable', 'exists:visits,id'],
            'treatment_plan_id' => ['nullable', 'exists:treatment_plans,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $items = collect($data['items'])->map(function ($item) {
            $qty = $item['quantity'] ?? 1;
            $item['quantity'] = $qty;
            $item['amount'] = $qty * $item['unit_price'];

            return $item;
        });

        $invoice = Invoice::create([
            'invoice_number' => 'INV-' . now()->format('Ymd') . '-' . Str::upper(Str::random(5)),
            'patient_id' => $data['patient_id'],
            'visit_id' => $data['visit_id'] ?? null,
            'treatment_plan_id' => $data['treatment_plan_id'] ?? null,
            'total_amount' => $items->sum('amount'),
            'status' => 'unpaid',
            'issued_at' => now(),
        ]);

        $invoice->items()->createMany($items);

        return response()->json($invoice->load('items'), 201);
    }

    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load('items', 'payments', 'patient', 'insuranceClaim'));
    }

    public function storePayment(Request $request, Invoice $invoice)
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:' . $invoice->balanceDue()],
            'payment_method' => ['required', 'in:cash,card,installment'],
        ]);

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'amount' => $data['amount'],
            'payment_method' => $data['payment_method'],
            'paid_at' => now(),
            'received_by' => $request->user()->id,
            'created_at' => now(),
        ]);

        $invoice->increment('paid_amount', $data['amount']);
        $invoice->update([
            'status' => $invoice->balanceDue() <= 0 ? 'paid' : 'partially_paid',
        ]);

        return response()->json([
            'payment' => $payment,
            'invoice' => $invoice->fresh(),
        ], 201);
    }
}
