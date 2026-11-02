# Diamond — React + Tailwind frontend

A single-page app covering all 5 modules, built against the Laravel API
delivered earlier. Built with Vite + React Router + Tailwind + Recharts.

## Setup

```bash
npm install
cp .env.example .env      # point VITE_API_URL at your running Laravel backend
npm run dev                # http://localhost:3000
```

Log in with the seeded admin (`admin@diamond-clinic.test` / `password`), or
any user you create via the backend seeder / Users page.

## Structure

```
src/
  api/client.js            axios instance — attaches the bearer token, redirects to
                            /login on 401
  context/AuthContext.jsx  login/logout state, current user + role
  context/LocaleContext.jsx English/Arabic translations, locale formatting, and RTL
  components/
    Layout.jsx              responsive, toggleable sidebar + language switch
    ProtectedRoute.jsx      route guard (auth + optional role restriction)
    ui.jsx                  shared Button/Input/Select/Card/Badge/Modal/EmptyState
  pages/
    Login.jsx
    ReceptionistDashboard.jsx daily appointment overview and front-desk shortcuts
    patients/PatientsList.jsx    module 1 — search, register, archive
    patients/PatientDetail.jsx   modules 1, 3, 4 — tabs: overview & medical
                                 history, dental chart, treatment plans &
                                 visits & prescriptions, billing & insurance
    appointments/AppointmentsPage.jsx   module 2 — daily schedule, booking,
                                        status changes
    reports/ReportsPage.jsx      module 5 — revenue chart, patient stats (admin)
    users/UsersPage.jsx          module 5 — user & role management (admin)
```

Patient-centric modules (medical history, dental chart, treatment plans,
visits, prescriptions, invoices, insurance, attachments) live in tabs inside
`PatientDetail`. The app can be switched between English/LTR and Arabic/RTL;
the language preference is saved in the browser and date/number formatting
follows the selected locale. The sidebar can be toggled and becomes an overlay
on small screens.

Receptionists land on a dedicated dashboard and can access patient basics,
appointments, invoices, payments, and insurance. Dental charts and treatment
plans are available to receptionists as read-only views. Medical history,
diagnoses, visits, prescriptions, attachments, reports/statistics, and user
management are not available to receptionists. Doctors do not see billing;
reports and user management remain admin-only.

Also included, on top of the original build:
- **Edit patient** — pencil icon next to the patient's name opens the same
  form as registration, pre-filled, `PUT /patients/{id}`.
- **Archive / reactivate** — button next to the status badge,
  `PATCH /patients/{id}/archive`.
- **Edit user** — pencil icon per row on the Users page, `PUT /users/{id}`.
- **Insurance** — its own section in "Billing & insurance": link a patient to
  an insurance company/policy, and submit an insurance claim against an
  invoice (computes company/patient split from the policy's coverage %).
- **X-ray/photo uploads** — a small upload form in "Treatment & visits"
  (`POST /patients/{id}/attachments`, multipart), with thumbnails and an
  in-page lightbox preview for images (non-images still open in a new tab).
- **Pagination** on the patients list — "Showing X–Y of Z" with Previous/Next,
  driven by Laravel's paginator response.
- **Calendar month view** for appointments, alongside the original day view —
  toggle between them; clicking a day in month view jumps to that day's
  schedule. The backend returns every appointment in the range for this (not
  paginated) when `from`/`to` are both supplied.
- **Printing** — a Print button on invoices and on each prescription opens a
  formatted, letterhead-branded print window (`src/utils/print.js`).

## Access control in the UI

The sidebar and patient tabs are filtered by role, and protected routes are
guarded in the frontend. This is a UX convenience, not the real security
boundary: Laravel's `role:` middleware enforces API access. The receptionist
patient-detail response also omits clinical relations, and clinical write,
diagnosis, prescription, reporting, and administration endpoints return 403
for that role.

## What's light-depth here (same spirit as the backend)

- No form library (React Hook Form / Zod) — plain `useState` + inline
  validation error display from the API's 422 response.
- No global state manager — React Context for auth, plain `useState`/`useEffect`
  per page for data fetching.
- PDF/document attachments still just open in a new tab (no in-app PDF
  viewer) — only images get the lightbox treatment.
- Laravel feature tests cover receptionist access boundaries
  (`php artisan test --filter=ReceptionistPermissionsTest`).

## Next

Ready to move on to running/deploying this, or want anything else added
first?
