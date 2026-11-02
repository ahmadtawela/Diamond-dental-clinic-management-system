import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Users, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api/client";
import { Button, Card, Input, PageHeader, EmptyState, Modal, Badge, Select } from "../../components/ui";
import { Localized } from "../../context/LocaleContext";

export default function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function load(pageToLoad = page) {
    setLoading(true);
    const { data } = await api.get("/patients", { params: { search, page: pageToLoad } });
    if (data.data) {
      setPatients(data.data);
      setMeta({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
        from: data.from || 0,
        to: data.to || 0,
      });
    } else {
      // fallback in case the endpoint ever returns a plain array
      setPatients(data);
      setMeta({ current_page: 1, last_page: 1, total: data.length, from: data.length ? 1 : 0, to: data.length });
    }
    setLoading(false);
  }

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => load(page), 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  return (
    <Localized>
    <div>
      <PageHeader
        title="Patients"
        subtitle="Search, register, and open patient files"
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New patient
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or national ID"
          className="w-full border border-border rounded pl-9 pr-3 py-2 text-sm bg-white focus:border-primary"
        />
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-ink-secondary text-sm">Loading…</div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients yet"
            description="Register your first patient to start building their dental record."
            action={<Button onClick={() => setShowCreate(true)}>Register a patient</Button>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-secondary border-b border-border">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-5 py-3">
                    <Link to={`/patients/${p.id}`} className="text-primary font-medium hover:underline">
                      {p.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">{p.phone}</td>
                  <td className="px-5 py-3 text-ink-secondary capitalize">{p.gender}</td>
                  <td className="px-5 py-3">
                    <Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && patients.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-sm">
            <span className="text-ink-secondary">
              Showing {meta.from}–{meta.to} of {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <span className="text-ink-secondary text-xs">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CreatePatientModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
    </div>
    </Localized>
  );
}

function CreatePatientModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ full_name: "", national_id: "", date_of_birth: "", gender: "male", phone: "", address: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.post("/patients", form);
      onCreated();
      onClose();
      setForm({ full_name: "", national_id: "", date_of_birth: "", gender: "male", phone: "", address: "" });
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Register a new patient">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} error={errors.full_name?.[0]} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="National ID" value={form.national_id} onChange={(e) => set("national_id", e.target.value)} error={errors.national_id?.[0]} />
          <Input label="Date of birth" type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} error={errors.date_of_birth?.[0]} />
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
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Register patient"}</Button>
        </div>
      </form>
    </Modal>
  );
}
