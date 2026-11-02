<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InsuranceClaim;
use App\Models\InsuranceCompany;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\PatientInsurance;
use Illuminate\Http\Request;

class InsuranceController extends Controller
{
    public function companies()
    {
        return response()->json(InsuranceCompany::orderBy('name')->get());
    }

    public function listPolicies(Patient $patient)
    {
        return response()->json($patient->insurancePolicies()->with('company')->get());
    }

    public function linkPatient(Request $request, Patient $patient)
    {
        $data = $request->validate([
            'insurance_company_id' => ['required', 'exists:insurance_companies,id'],
            'policy_number' => ['required', 'string', 'max:50'],
            'coverage_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'valid_until' => ['nullable', 'date'],
        ]);

        $data['patient_id'] = $patient->id;
        $policy = PatientInsurance::create($data);

        return response()->json($policy->load('company'), 201);
    }

    public function submitClaim(Request $request, Invoice $invoice)
    {
        $data = $request->validate([
            'patient_insurance_id' => ['required', 'exists:patient_insurance,id'],
        ]);

        $policy = PatientInsurance::findOrFail($data['patient_insurance_id']);

        $companyShare = round($invoice->total_amount * ($policy->coverage_percentage / 100), 2);
        $patientShare = round($invoice->total_amount - $companyShare, 2);

        $claim = InsuranceClaim::create([
            'invoice_id' => $invoice->id,
            'patient_insurance_id' => $policy->id,
            'claim_amount' => $invoice->total_amount,
            'company_share' => $companyShare,
            'patient_share' => $patientShare,
            'status' => 'submitted',
        ]);

        return response()->json($claim, 201);
    }
}
