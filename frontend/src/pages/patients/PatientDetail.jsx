import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ClipboardList, Stethoscope, Receipt, FileText, Pencil, ShieldCheck, Paperclip, Printer } from "lucide-react";
import api, { storageUrl } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Localized, formatLocaleDate, formatLocaleNumber, useLocale } from "../../context/LocaleContext";
import { printInvoice, printPrescription } from "../../utils/print";
import { Button, Card, Input, PageHeader, Badge, Modal, Select, EmptyState, statusTone } from "../../components/ui";

const TABS = [
  { key: "overview", label: "Overview & history", roles: ["admin", "doctor"] },
  { key: "dental", label: "Dental chart", roles: ["admin", "doctor", "receptionist"] },
  { key: "clinical", label: "Treatment & visits", roles: ["admin", "doctor", "receptionist"] },
  { key: "billing", label: "Billing & insurance", roles: ["admin", "receptionist"] },
];

export default function PatientDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const { t } = useLocale();
  const [patient, setPatient] = useState(null);
  const visibleTabs = TABS.filter((t) => t.roles.includes(role));
  const [tab, setTab] = useState(visibleTabs[0]?.key || "overview");
  const [doctors, setDoctors] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function loadPatient() {
    const { data } = await api.get(`/patients/${id}`);
    setPatient(data);
  }

  useEffect(() => {
    loadPatient();
    api.get("/doctors").then(({ data }) => setDoctors(data)).catch(() => setDoctors([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleArchive() {
    setArchiving(true);
    await api.patch(`/patients/${id}/archive`);
    await loadPatient();
    setArchiving(false);
  }

  if (!patient) {
    return <div className="text-ink-secondary text-sm">{t("Loading…")}</div>;
  }

  return (
    <Localized>
    <div>
      <PageHeader
        title={patient.full_name}
        subtitle={`${patient.phone} · ${t(patient.gender)} · ${patient.national_id || t("no national ID on file")}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={patient.status === "active" ? "success" : "neutral"}>{patient.status}</Badge>
            <Button variant="secondary" onClick={() => setShowEdit(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
            <Button variant={patient.status === "active" ? "danger" : "secondary"} onClick={toggleArchive} disabled={archiving}>
              {archiving ? "…" : patient.status === "active" ? "Archive" : "Reactivate"}
            </Button>
          </div>
        }
      />

      <div className="mb-6 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-1">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-ink-secondary hover:text-ink"
              }`}
            >
              {role === "receptionist" && t.key === "clinical" ? "Treatment plans" : t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && <OverviewTab patient={patient} onUpdate={loadPatient} />}
      {tab === "dental" && <DentalChartTab patientId={id} doctors={doctors} readOnly={role === "receptionist"} />}
      {tab === "clinical" && (
        <ClinicalTab
          patientId={id}
          doctors={doctors}
          patient={patient}
          readOnly={role === "receptionist"}
        />
      )}
      {tab === "billing" && <BillingTab patientId={id} patient={patient} />}

      <EditPatientModal open={showEdit} onClose={() => setShowEdit(false)} patient={patient} onSaved={loadPatient} />
    </div>
    </Localized>
  );
}

function EditPatientModal({ open, onClose, patient, onSaved }) {
  const [form, setForm] = useState({ full_name: "", national_id: "", date_of_birth: "", gender: "male", phone: "", address: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient && open) {
      setForm({
        full_name: patient.full_name || "",
        national_id: patient.national_id || "",
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "male",
        phone: patient.phone || "",
        address: patient.address || "",
      });
      setErrors({});
    }
  }, [patient, open]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.put(`/patients/${patient.id}`, form);
      onSaved();
      onClose();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  }

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title="Edit patient">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} error={errors.full_name?.[0]} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="National ID" value={form.national_id} onChange={(e) => set("national_id", e.target.value)} error={errors.national_id?.[0]} />
          <Input label="Date of birth" type="date" value={form.date_of_birth || ""} onChange={(e) => set("date_of_birth", e.target.value)} error={errors.date_of_birth?.[0]} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Gender" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
          <Input label="Phone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone?.[0]} />
        </div>
        <Input label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}

// ---------------------------------------------------------------------------
// Overview & medical history (module 1)

function OverviewTab({ patient, onUpdate }) {
  const [history, setHistory] = useState({ chronic_diseases: "", drug_allergies: "", previous_surgeries: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient.medical_history) setHistory(patient.medical_history);
  }, [patient]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    await api.put(`/patients/${patient.id}/medical-history`, history);
    setSaving(false);
    onUpdate();
  }

  return (
    <Localized>
    <Card className="p-6">
      <h3 className="text-base text-ink mb-4">Medical history</h3>
      <form onSubmit={save} className="space-y-4 max-w-2xl">
        <Input
          label="Chronic diseases"
          value={history.chronic_diseases || ""}
          onChange={(e) => setHistory((h) => ({ ...h, chronic_diseases: e.target.value }))}
          placeholder="e.g. type 2 diabetes, hypertension"
        />
        <Input
          label="Drug allergies"
          value={history.drug_allergies || ""}
          onChange={(e) => setHistory((h) => ({ ...h, drug_allergies: e.target.value }))}
          placeholder="e.g. penicillin"
        />
        <Input
          label="Previous surgeries"
          value={history.previous_surgeries || ""}
          onChange={(e) => setHistory((h) => ({ ...h, previous_surgeries: e.target.value }))}
        />
        <Input
          label="Notes"
          value={history.notes || ""}
          onChange={(e) => setHistory((h) => ({ ...h, notes: e.target.value }))}
        />
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save medical history"}</Button>
      </form>
    </Card>
    </Localized>
  );
}

// ---------------------------------------------------------------------------
// Dental chart (module 1)

function DentalChartTab({ patientId, doctors, readOnly = false }) {
  const [records, setRecords] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get(`/patients/${patientId}/dental-chart`);
    setRecords(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Localized>
    <div>
      {!readOnly && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setShowAdd(true)}>Add tooth record</Button>
        </div>
      )}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-ink-secondary text-sm">Loading…</div>
        ) : records.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No dental chart entries yet" description="Add the first tooth record for this patient." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-secondary border-b border-border">
                <th className="px-5 py-3 font-medium">Tooth</th>
                <th className="px-5 py-3 font-medium">Condition</th>
                <th className="px-5 py-3 font-medium">Procedure</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">#{r.tooth_number}</td>
                  <td className="px-5 py-3 text-ink-secondary capitalize">{r.condition_type}</td>
                  <td className="px-5 py-3 text-ink-secondary capitalize">{r.procedure_type?.replace("_", " ") || "—"}</td>
                  <td className="px-5 py-3"><Badge tone={statusTone(r.status)}>{r.status.replace("_", " ")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <AddDentalRecordModal open={showAdd} onClose={() => setShowAdd(false)} patientId={patientId} doctors={doctors} onSaved={load} />
    </div>
    </Localized>
  );
}

function AddDentalRecordModal({ open, onClose, patientId, doctors, onSaved }) {
  const [form, setForm] = useState({ tooth_number: "", condition_type: "decayed", procedure_type: "filling", doctor_id: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await api.post(`/patients/${patientId}/dental-chart`, form);
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title="Add tooth record">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Tooth number (FDI notation, 11–48)" required type="number" min="11" max="48"
          value={form.tooth_number} onChange={(e) => setForm((f) => ({ ...f, tooth_number: e.target.value }))} />
        <Select label="Condition" value={form.condition_type} onChange={(e) => setForm((f) => ({ ...f, condition_type: e.target.value }))}>
          {["healthy", "decayed", "filled", "missing", "crowned", "implant"].map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select label="Procedure" value={form.procedure_type} onChange={(e) => setForm((f) => ({ ...f, procedure_type: e.target.value }))}>
          {["filling", "root_canal", "extraction", "implant", "crown", "cleaning", "other"].map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
        </Select>
        <Select label="Doctor" value={form.doctor_id} onChange={(e) => setForm((f) => ({ ...f, doctor_id: e.target.value }))}>
          <option value="">— select —</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.user?.full_name}</option>)}
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add record"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}

// ---------------------------------------------------------------------------
// Treatment plans + visits + prescriptions (module 3)

function ClinicalTab({ patientId, doctors, patient, readOnly = false }) {
  const [plans, setPlans] = useState([]);
  const [visits, setVisits] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [showPlan, setShowPlan] = useState(false);
  const [showVisit, setShowVisit] = useState(false);

  async function load() {
    if (readOnly) {
      const { data } = await api.get(`/patients/${patientId}/treatment-plans`);
      setPlans(data);
      return;
    }

    const [p, v, a] = await Promise.all([
      api.get(`/patients/${patientId}/treatment-plans`),
      api.get(`/patients/${patientId}/visits`),
      api.get(`/patients/${patientId}/attachments`),
    ]);
    setPlans(p.data);
    setVisits(v.data);
    setAttachments(a.data);
  }

  useEffect(() => { load(); }, [patientId, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  if (readOnly) {
    return (
      <Localized>
      <Card>
        {plans.length === 0 ? (
          <EmptyState icon={Stethoscope} title="No treatment plans yet" />
        ) : (
          <div className="divide-y divide-border">
            {plans.map((plan) => (
              <div key={plan.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">{plan.title}</p>
                  <Badge tone={statusTone(plan.status)}>{plan.status.replace("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink-secondary">
                  {plan.estimated_sessions} session(s) · estimated {formatLocaleNumber(plan.estimated_cost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <ul className="mt-2 list-inside list-disc text-sm text-ink-secondary">
                  {plan.items?.map((item) => (
                    <li key={item.id}>
                      {item.procedure_name}
                      {item.tooth_number ? ` (tooth #${item.tooth_number})` : ""} — {formatLocaleNumber(item.cost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
      </Localized>
    );
  }

  return (
    <Localized>
    <div className="space-y-8">
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base text-ink">Treatment plans</h3>
          <Button onClick={() => setShowPlan(true)}>New treatment plan</Button>
        </div>
        <Card>
          {plans.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No treatment plans yet" />
          ) : (
            <div className="divide-y divide-border">
              {plans.map((p) => (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-ink">{p.title}</p>
                    <Badge tone={statusTone(p.status)}>{p.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-ink-secondary mt-1">
                    {p.estimated_sessions} session(s) · estimated {formatLocaleNumber(p.estimated_cost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <ul className="mt-2 text-sm text-ink-secondary list-disc list-inside">
                    {p.items?.map((it) => (
                      <li key={it.id}>{it.procedure_name}{it.tooth_number ? ` (tooth #${it.tooth_number})` : ""} — {formatLocaleNumber(it.cost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base text-ink">Visits & prescriptions</h3>
          <Button onClick={() => setShowVisit(true)}>Log a visit</Button>
        </div>
        <Card>
          {visits.length === 0 ? (
            <EmptyState icon={FileText} title="No visits logged yet" />
          ) : (
            <div className="divide-y divide-border">
              {visits.map((v) => (
                <div key={v.id} className="px-5 py-4">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-ink">{formatLocaleDate(v.visit_date)}</p>
                    <p className="text-sm text-ink-secondary">Dr. {v.doctor?.user?.full_name}</p>
                  </div>
                  {v.diagnosis && <p className="text-sm text-ink-secondary mt-1">Diagnosis: {v.diagnosis}</p>}
                  {v.prescriptions?.length > 0 && (
                    <div className="mt-2 text-sm space-y-2">
                      {v.prescriptions.map((rx) => (
                        <div key={rx.id} className="flex items-start justify-between gap-3">
                          <ul className="list-disc list-inside text-ink-secondary">
                            {rx.items?.map((it) => (
                              <li key={it.id}>{it.medicine_name} — {it.dosage}, {it.frequency}, {it.duration}</li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => printPrescription(v, patient, rx)}
                            className="shrink-0 text-xs text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <PrescriptionInline visitId={v.id} onSaved={load} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section>
        <h3 className="text-base text-ink mb-3">X-rays & photos</h3>
        <Card className="p-5">
          <AttachmentUploadForm patientId={patientId} onUploaded={load} />
          {attachments.length === 0 ? (
            <p className="text-sm text-ink-secondary mt-4">No files uploaded yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {attachments.map((a) => (
                <AttachmentItem key={a.id} attachment={a} />
              ))}
            </ul>
          )}
        </Card>
      </section>

      <NewTreatmentPlanModal open={showPlan} onClose={() => setShowPlan(false)} patientId={patientId} doctors={doctors} onSaved={load} />
      <NewVisitModal open={showVisit} onClose={() => setShowVisit(false)} patientId={patientId} doctors={doctors} onSaved={load} />
    </div>
    </Localized>
  );
}

function AttachmentItem({ attachment }) {
  const [showPreview, setShowPreview] = useState(false);
  const isImage = /\.(jpe?g|png|gif|webp)$/i.test(attachment.file_path);
  const url = storageUrl(attachment.file_path);
  const filename = attachment.file_path.split("/").pop();

  return (
    <Localized>
    <li className="flex items-center justify-between text-sm py-2.5 gap-3">
      <span className="flex items-center gap-3 min-w-0">
        {isImage ? (
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="w-11 h-11 rounded border border-border overflow-hidden shrink-0 hover:opacity-80 transition-opacity"
          >
            <img src={url} alt={filename} className="w-full h-full object-cover" />
          </button>
        ) : (
          <span className="w-11 h-11 rounded border border-border flex items-center justify-center text-ink-muted shrink-0">
            <FileText className="w-4 h-4" />
          </span>
        )}
        <span className="min-w-0">
          <Badge tone="neutral">{attachment.file_type}</Badge>{" "}
          <span className="text-ink-secondary truncate">{filename}</span>
        </span>
      </span>
      <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-primary text-xs font-medium hover:underline">
        {isImage ? "Open full size" : "View"}
      </a>

      {isImage && (
        <Modal open={showPreview} onClose={() => setShowPreview(false)} title={filename}>
          <img src={url} alt={filename} className="w-full h-auto rounded" />
        </Modal>
      )}
    </li>
    </Localized>
  );
}

function AttachmentUploadForm({ patientId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("xray");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [inputKey, setInputKey] = useState(0);

  async function submit(e) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_type", fileType);
    try {
      await api.post(`/patients/${patientId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setInputKey((k) => k + 1);
      onUploaded();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Localized>
    <form onSubmit={submit} className="flex items-end gap-3 flex-wrap">
      <div>
        <label className="block text-sm text-ink-secondary mb-1">File</label>
        <input
          key={inputKey}
          type="file"
          accept="image/*,.pdf,.dcm"
          onChange={(e) => setFile(e.target.files[0])}
          className="text-sm"
        />
      </div>
      <Select label="Type" value={fileType} onChange={(e) => setFileType(e.target.value)} className="w-auto">
        <option value="xray">X-ray</option>
        <option value="photo">Photo</option>
        <option value="document">Document</option>
      </Select>
      <Button type="submit" disabled={uploading}>
        <Paperclip className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : "Upload"}
      </Button>
      {error && <p className="text-sm text-danger w-full">{error}</p>}
    </form>
    </Localized>
  );
}

function PrescriptionInline({ visitId, onSaved }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([{ medicine_name: "", dosage: "", frequency: "", duration: "" }]);
  const [saving, setSaving] = useState(false);

  function updateItem(i, field, value) {
    setItems((its) => its.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await api.post(`/visits/${visitId}/prescriptions`, { items });
    setSaving(false);
    setOpen(false);
    onSaved();
  }

  if (!open) {
    return (
      <Localized>
      <button onClick={() => setOpen(true)} className="text-xs text-primary font-medium mt-2 hover:underline">
        + Add prescription
      </button>
      </Localized>
    );
  }

  return (
    <Localized>
    <form onSubmit={submit} className="mt-3 border border-border rounded p-3 space-y-2 bg-bg">
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-4 gap-2">
          <input placeholder="Medicine" className="border border-border rounded px-2 py-1 text-xs" value={it.medicine_name} onChange={(e) => updateItem(i, "medicine_name", e.target.value)} />
          <input placeholder="Dosage" className="border border-border rounded px-2 py-1 text-xs" value={it.dosage} onChange={(e) => updateItem(i, "dosage", e.target.value)} />
          <input placeholder="Frequency" className="border border-border rounded px-2 py-1 text-xs" value={it.frequency} onChange={(e) => updateItem(i, "frequency", e.target.value)} />
          <input placeholder="Duration" className="border border-border rounded px-2 py-1 text-xs" value={it.duration} onChange={(e) => updateItem(i, "duration", e.target.value)} />
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" onClick={() => setItems((its) => [...its, { medicine_name: "", dosage: "", frequency: "", duration: "" }])} className="text-xs text-primary">
          + line
        </button>
        <Button type="submit" disabled={saving} className="text-xs py-1 px-2">{saving ? "Saving…" : "Save prescription"}</Button>
      </div>
    </form>
    </Localized>
  );
}

function NewTreatmentPlanModal({ open, onClose, patientId, doctors, onSaved }) {
  const [title, setTitle] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [items, setItems] = useState([{ procedure_name: "", tooth_number: "", session_number: 1, cost: "" }]);
  const [saving, setSaving] = useState(false);

  function updateItem(i, field, value) {
    setItems((its) => its.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await api.post("/treatment-plans", { patient_id: patientId, doctor_id: doctorId, title, items });
    setSaving(false);
    onSaved();
    onClose();
    setTitle(""); setItems([{ procedure_name: "", tooth_number: "", session_number: 1, cost: "" }]);
  }

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title="New treatment plan">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full mouth restoration" />
        <Select label="Doctor" required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">— select —</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.user?.full_name}</option>)}
        </Select>
        <div className="space-y-2">
          <span className="block text-sm text-ink-secondary">Procedures</span>
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <input placeholder="Procedure" className="border border-border rounded px-2 py-1 text-xs col-span-2" value={it.procedure_name} onChange={(e) => updateItem(i, "procedure_name", e.target.value)} />
              <input placeholder="Tooth #" className="border border-border rounded px-2 py-1 text-xs" value={it.tooth_number} onChange={(e) => updateItem(i, "tooth_number", e.target.value)} />
              <input placeholder="Cost" type="number" className="border border-border rounded px-2 py-1 text-xs" value={it.cost} onChange={(e) => updateItem(i, "cost", e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={() => setItems((its) => [...its, { procedure_name: "", tooth_number: "", session_number: 1, cost: "" }])} className="text-xs text-primary">
            + procedure
          </button>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create plan"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}

function NewVisitModal({ open, onClose, patientId, doctors, onSaved }) {
  const [form, setForm] = useState({ doctor_id: "", visit_date: "", symptoms: "", diagnosis: "", procedure_performed: "", recommendations: "" });
  const [saving, setSaving] = useState(false);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await api.post("/visits", { ...form, patient_id: patientId });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title="Log a visit">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select label="Doctor" required value={form.doctor_id} onChange={(e) => set("doctor_id", e.target.value)}>
            <option value="">— select —</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.user?.full_name}</option>)}
          </Select>
          <Input label="Visit date" type="date" required value={form.visit_date} onChange={(e) => set("visit_date", e.target.value)} />
        </div>
        <Input label="Symptoms" value={form.symptoms} onChange={(e) => set("symptoms", e.target.value)} />
        <Input label="Diagnosis" value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} />
        <Input label="Procedure performed" value={form.procedure_performed} onChange={(e) => set("procedure_performed", e.target.value)} />
        <Input label="Recommendations" value={form.recommendations} onChange={(e) => set("recommendations", e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save visit"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}

// ---------------------------------------------------------------------------
// Billing & insurance (module 4)

function BillingTab({ patientId, patient }) {
  const { t } = useLocale();
  const [invoices, setInvoices] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);

  async function load() {
    const [inv, pol] = await Promise.all([
      api.get(`/patients/${patientId}/invoices`),
      api.get(`/patients/${patientId}/insurance`),
    ]);
    setInvoices(inv.data);
    setPolicies(pol.data);
  }

  useEffect(() => {
    load();
    api.get("/insurance-companies").then(({ data }) => setCompanies(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return (
    <Localized>
    <div className="space-y-8">
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base text-ink">Invoices & payments</h3>
          <Button onClick={() => setShowInvoice(true)}>New invoice</Button>
        </div>
        <Card>
          {invoices.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices yet" description="Generate an invoice once a procedure has been performed." />
          ) : (
            <div className="divide-y divide-border">
              {invoices.map((inv) => (
                <InvoiceRow key={inv.id} invoice={inv} policies={policies} patient={patient} onChanged={load} />
              ))}
            </div>
          )}
        </Card>
      </section>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base text-ink">Insurance</h3>
          <Button onClick={() => setShowInsurance(true)}>Link insurance</Button>
        </div>
        <Card>
          {policies.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No insurance linked" description="Link a policy so invoices can be claimed against it." />
          ) : (
            <div className="divide-y divide-border">
              {policies.map((p) => (
                <div key={p.id} className="px-5 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-ink">{p.company?.name}</p>
                    <p className="text-sm text-ink-secondary">{t("Policy")} {p.policy_number} · {t("covers")} {p.coverage_percentage}%</p>
                  </div>
                  {p.valid_until && <span className="text-xs text-ink-secondary">{t("valid until")} {formatLocaleDate(p.valid_until)}</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <NewInvoiceModal open={showInvoice} onClose={() => setShowInvoice(false)} patientId={patientId} onSaved={load} />
      <LinkInsuranceModal open={showInsurance} onClose={() => setShowInsurance(false)} patientId={patientId} companies={companies} onSaved={load} />
    </div>
    </Localized>
  );
}

function LinkInsuranceModal({ open, onClose, patientId, companies, onSaved }) {
  const [form, setForm] = useState({ insurance_company_id: "", policy_number: "", coverage_percentage: "", valid_until: "" });
  const [saving, setSaving] = useState(false);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await api.post(`/patients/${patientId}/insurance`, form);
    setSaving(false);
    onSaved();
    onClose();
    setForm({ insurance_company_id: "", policy_number: "", coverage_percentage: "", valid_until: "" });
  }

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title="Link insurance policy">
      <form onSubmit={submit} className="space-y-4">
        <Select label="Insurance company" required value={form.insurance_company_id} onChange={(e) => set("insurance_company_id", e.target.value)}>
          <option value="">— select —</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Input label="Policy number" required value={form.policy_number} onChange={(e) => set("policy_number", e.target.value)} />
        <Input label="Coverage percentage" type="number" min="0" max="100" required value={form.coverage_percentage} onChange={(e) => set("coverage_percentage", e.target.value)} />
        <Input label="Valid until" type="date" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Linking…" : "Link policy"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}

function InvoiceRow({ invoice, policies, patient, onChanged }) {
  const [showPay, setShowPay] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const balance = Number(invoice.total_amount) - Number(invoice.paid_amount);

  return (
    <Localized>
    <div className="px-5 py-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium text-ink">{invoice.invoice_number}</p>
          <p className="text-sm text-ink-secondary">
            Total {formatLocaleNumber(invoice.total_amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · Paid {formatLocaleNumber(invoice.paid_amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · Balance {formatLocaleNumber(balance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {invoice.insurance_claim && (
            <p className="text-xs text-ink-secondary mt-1.5 flex items-center gap-1.5">
              Insurance claim: <Badge tone={statusTone(invoice.insurance_claim.status)}>{invoice.insurance_claim.status}</Badge>
              company {formatLocaleNumber(invoice.insurance_claim.company_share, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / patient {formatLocaleNumber(invoice.insurance_claim.patient_share, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(invoice.status)}>{invoice.status.replace("_", " ")}</Badge>
          <button
            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            onClick={() => printInvoice(invoice, patient)}
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          {!invoice.insurance_claim && policies.length > 0 && (
            <Button variant="secondary" onClick={() => setShowClaim(true)}>Submit claim</Button>
          )}
          {balance > 0 && <Button variant="secondary" onClick={() => setShowPay(true)}>Record payment</Button>}
        </div>
      </div>
      <RecordPaymentModal open={showPay} onClose={() => setShowPay(false)} invoice={invoice} onSaved={onChanged} />
      <SubmitClaimModal open={showClaim} onClose={() => setShowClaim(false)} invoice={invoice} policies={policies} onSaved={onChanged} />
    </div>
    </Localized>
  );
}

function SubmitClaimModal({ open, onClose, invoice, policies, onSaved }) {
  const [policyId, setPolicyId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setPolicyId(String(policies[0]?.id || ""));
  }, [policies, open]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await api.post(`/invoices/${invoice.id}/insurance-claims`, { patient_insurance_id: policyId });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title={`Submit insurance claim — ${invoice.invoice_number}`}>
      <form onSubmit={submit} className="space-y-4">
        <Select label="Insurance policy" required value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
          {policies.map((p) => (
            <option key={p.id} value={p.id}>{p.company?.name} — {p.policy_number} ({p.coverage_percentage}%)</option>
          ))}
        </Select>
        <p className="text-sm text-ink-secondary">
          Invoice total {formatLocaleNumber(invoice.total_amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. The company/patient split is calculated from the policy's coverage percentage.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Submitting…" : "Submit claim"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}

function RecordPaymentModal({ open, onClose, invoice, onSaved }) {
  const balance = Number(invoice.total_amount) - Number(invoice.paid_amount);
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState("cash");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await api.post(`/invoices/${invoice.id}/payments`, { amount, payment_method: method });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title={`Record payment — ${invoice.invoice_number}`}>
      <form onSubmit={submit} className="space-y-4">
        <Input label={`Amount (balance due: ${formatLocaleNumber(balance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`} type="number" step="0.01" max={balance} min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="installment">Installment</option>
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Recording…" : "Record payment"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}

function NewInvoiceModal({ open, onClose, patientId, onSaved }) {
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: "" }]);
  const [saving, setSaving] = useState(false);

  function updateItem(i, field, value) {
    setItems((its) => its.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await api.post("/invoices", { patient_id: patientId, items });
    setSaving(false);
    onSaved();
    onClose();
    setItems([{ description: "", quantity: 1, unit_price: "" }]);
  }

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title="New invoice">
      <form onSubmit={submit} className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-4 gap-2">
            <input placeholder="Description" className="border border-border rounded px-2 py-1.5 text-sm col-span-2" value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
            <input placeholder="Qty" type="number" min="1" className="border border-border rounded px-2 py-1.5 text-sm" value={it.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} />
            <input placeholder="Unit price" type="number" step="0.01" className="border border-border rounded px-2 py-1.5 text-sm" value={it.unit_price} onChange={(e) => updateItem(i, "unit_price", e.target.value)} />
          </div>
        ))}
        <button type="button" onClick={() => setItems((its) => [...its, { description: "", quantity: 1, unit_price: "" }])} className="text-xs text-primary">
          + line item
        </button>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create invoice"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}
