<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InsuranceController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TreatmentPlanController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VisitController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ---- Public --------------------------------------------------------
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');

    // ---- Authenticated (any role) ---------------------------------------
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // 1. Patient management — admin, doctor, receptionist all need read/write,
        //    but medical/diagnosis detail is hidden from receptionist at the resource level (see note in README).
        Route::middleware('role:admin,doctor,receptionist')->group(function () {
            Route::get('/patients', [PatientController::class, 'index']);
            Route::post('/patients', [PatientController::class, 'store']);
            Route::get('/patients/{patient}', [PatientController::class, 'show']);
            Route::put('/patients/{patient}', [PatientController::class, 'update']);
            Route::patch('/patients/{patient}/archive', [PatientController::class, 'archive']);

            // 2. Appointments — full receptionist access
            Route::get('/appointments', [AppointmentController::class, 'index']);
            Route::post('/appointments', [AppointmentController::class, 'store']);
            Route::put('/appointments/{appointment}', [AppointmentController::class, 'update']);
            Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);
            Route::get('/doctors', [AppointmentController::class, 'listDoctors']);
            Route::get('/doctors/{doctor}/availability', [AppointmentController::class, 'availability']);
        });

        // Receptionists may view dental charts and treatment plans, but may not
        // create or update clinical records.
        Route::middleware('role:admin,doctor,receptionist')->group(function () {
            Route::get('/patients/{patient}/dental-chart', [PatientController::class, 'dentalChart']);
            Route::get('/patients/{patient}/treatment-plans', [TreatmentPlanController::class, 'index']);
        });

        // Medical history, diagnosis, prescriptions, and clinical writes are
        // restricted to administrators and doctors.
        Route::middleware('role:admin,doctor')->group(function () {
            Route::get('/patients/{patient}/medical-history', [PatientController::class, 'medicalHistory']);
            Route::put('/patients/{patient}/medical-history', [PatientController::class, 'updateMedicalHistory']);
            Route::post('/patients/{patient}/dental-chart', [PatientController::class, 'addDentalChartRecord']);

            // 3. Clinical & treatment management
            Route::post('/treatment-plans', [TreatmentPlanController::class, 'store']);
            Route::put('/treatment-plans/{treatmentPlan}', [TreatmentPlanController::class, 'update']);

            Route::get('/patients/{patient}/visits', [VisitController::class, 'index']);
            Route::post('/visits', [VisitController::class, 'store']);
            Route::post('/visits/{visit}/prescriptions', [VisitController::class, 'storePrescription']);
            Route::get('/patients/{patient}/attachments', [VisitController::class, 'attachments']);
            Route::post('/patients/{patient}/attachments', [VisitController::class, 'storeAttachment']);
        });

        // 4. Billing & financials — admin + receptionist only (not doctor)
        Route::middleware('role:admin,receptionist')->group(function () {
            Route::get('/patients/{patient}/invoices', [InvoiceController::class, 'index']);
            Route::post('/invoices', [InvoiceController::class, 'store']);
            Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
            Route::post('/invoices/{invoice}/payments', [InvoiceController::class, 'storePayment']);

            Route::get('/insurance-companies', [InsuranceController::class, 'companies']);
            Route::get('/patients/{patient}/insurance', [InsuranceController::class, 'listPolicies']);
            Route::post('/patients/{patient}/insurance', [InsuranceController::class, 'linkPatient']);
            Route::post('/invoices/{invoice}/insurance-claims', [InsuranceController::class, 'submitClaim']);
        });

        // 5. Reports & admin — admin only
        Route::middleware('role:admin')->group(function () {
            Route::get('/reports/revenue', [ReportController::class, 'revenue']);
            Route::get('/reports/patient-stats', [ReportController::class, 'patientStats']);

            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::get('/roles', [UserController::class, 'roles']);
        });
    });
});
