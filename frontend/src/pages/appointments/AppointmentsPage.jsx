import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api/client";
import { Button, Card, Input, PageHeader, EmptyState, Modal, Select } from "../../components/ui";
import { Localized, formatLocaleTime, useLocale } from "../../context/LocaleContext";

const STATUSES = ["pending", "confirmed", "cancelled", "attended"];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ label: daysInPrevMonth - i, dateStr: null, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ label: d, dateStr: toDateStr(year, month, d), inMonth: true });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ label: trailing, dateStr: null, inMonth: false });
    trailing++;
  }
  return cells;
}

export default function AppointmentsPage() {
  const { formatDate } = useLocale();
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [date, setDate] = useState(todayStr);
  const [monthAppointments, setMonthAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const monthLabel = formatDate(new Date(cursor.year, cursor.month, 1), { month: "long", year: "numeric" });
  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);

  const appointmentsByDate = useMemo(() => {
    const map = {};
    for (const a of monthAppointments) {
      (map[a.appointment_date] ||= []).push(a);
    }
    return map;
  }, [monthAppointments]);

  const dayAppointments = (appointmentsByDate[date] || [])
    .slice()
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

  async function loadMonth() {
    setLoading(true);
    const from = toDateStr(cursor.year, cursor.month, 1);
    const to = toDateStr(cursor.year, cursor.month, new Date(cursor.year, cursor.month + 1, 0).getDate());
    const { data } = await api.get("/appointments", { params: { from, to } });
    setMonthAppointments(data.data || data);
    setLoading(false);
  }

  useEffect(() => { loadMonth(); }, [cursor]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api.get("/doctors").then(({ data }) => setDoctors(data)).catch(() => setDoctors([])); }, []);

  async function updateStatus(appointment, status) {
    await api.patch(`/appointments/${appointment.id}/status`, { status });
    loadMonth();
  }

  function goToMonth(offset) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + offset, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function openDay(dateStr) {
    setDate(dateStr);
    setView("day");
  }

  return (
    <Localized>
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Schedule across all doctors"
        action={<Button onClick={() => setShowCreate(true)}>Book appointment</Button>}
      />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-bg border border-border rounded p-0.5">
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              view === "month" ? "bg-white shadow-sm text-ink font-medium" : "text-ink-secondary"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView("day")}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              view === "day" ? "bg-white shadow-sm text-ink font-medium" : "text-ink-secondary"
            }`}
          >
            Day
          </button>
        </div>

        {view === "month" ? (
          <div className="flex items-center gap-2">
            <button onClick={() => goToMonth(-1)} className="p-1.5 rounded hover:bg-bg text-ink-secondary" aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-ink w-36 text-center">{monthLabel}</span>
            <button onClick={() => goToMonth(1)} className="p-1.5 rounded hover:bg-bg text-ink-secondary" aria-label="Next month">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <CalendarDays className="w-4 h-4 text-ink-muted" />
            <input
              type="date"
              value={date}
              onChange={(e) => {
                const value = e.target.value;
                setDate(value);
                const [y, m] = value.split("-").map(Number);
                setCursor({ year: y, month: m - 1 });
              }}
              className="border border-border rounded px-3 py-1.5 text-sm bg-white"
            />
          </div>
        )}
      </div>

      {view === "month" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-7 border-b border-border">
                {WEEKDAY_LABELS.map((w) => (
                  <div key={w} className="px-2 py-2 text-center text-xs font-medium text-ink-secondary">{w}</div>
                ))}
              </div>
              {loading ? (
                <div className="p-8 text-center text-sm text-ink-secondary">Loading…</div>
              ) : (
                <div className="grid grid-cols-7">
                  {grid.map((cell, i) => {
                    const dayAppts = cell.dateStr ? appointmentsByDate[cell.dateStr] || [] : [];
                    const isToday = cell.dateStr === todayStr;
                    return (
                      <button
                        type="button"
                        key={i}
                        disabled={!cell.inMonth}
                        onClick={() => cell.dateStr && openDay(cell.dateStr)}
                        className={`min-h-[92px] min-w-0 border-b border-r border-border p-1.5 text-left align-top ${
                          cell.inMonth ? "cursor-pointer hover:bg-bg" : "cursor-default bg-bg/40"
                        }`}
                      >
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                            isToday ? "bg-primary text-white" : cell.inMonth ? "text-ink" : "text-ink-muted"
                          }`}
                        >
                          {cell.label}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayAppts.slice(0, 2).map((a) => (
                            <div key={a.id} className="truncate rounded bg-primary-light px-1 py-0.5 text-[11px] leading-tight text-primary-dark">
                              {formatLocaleTime(a.start_time)} {a.patient?.full_name}
                            </div>
                          ))}
                          {dayAppts.length > 2 && (
                            <div className="px-1 text-[11px] text-ink-secondary">+{dayAppts.length - 2} more</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          {loading ? (
            <div className="p-8 text-center text-ink-secondary text-sm">Loading…</div>
          ) : dayAppointments.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No appointments for this day" description="Book the first appointment for this date." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-secondary border-b border-border">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Doctor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {dayAppointments.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3"><span dir="ltr">{formatLocaleTime(a.start_time)}–{formatLocaleTime(a.end_time)}</span></td>
                    <td className="px-5 py-3 font-medium">{a.patient?.full_name}</td>
                    <td className="px-5 py-3 text-ink-secondary">Dr. {a.doctor?.user?.full_name}</td>
                    <td className="px-5 py-3">
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a, e.target.value)}
                        className="text-xs border border-border rounded px-2 py-1 bg-white capitalize"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <BookAppointmentModal open={showCreate} onClose={() => setShowCreate(false)} doctors={doctors} defaultDate={date} onSaved={loadMonth} />
    </div>
    </Localized>
  );
}

function BookAppointmentModal({ open, onClose, doctors, defaultDate, onSaved }) {
  const { t } = useLocale();
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({ doctor_id: "", appointment_date: defaultDate, start_time: "", end_time: "", notes: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, appointment_date: defaultDate }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate]);

  useEffect(() => {
    if (patientSearch.length < 2) { setPatientResults([]); return; }
    const t = setTimeout(() => {
      api.get("/patients", { params: { search: patientSearch } }).then(({ data }) => setPatientResults(data.data || data));
    }, 250);
    return () => clearTimeout(t);
  }, [patientSearch]);

  async function submit(e) {
    e.preventDefault();
    if (!patient) { setError("Select a patient first."); return; }
    setSaving(true);
    setError("");
    try {
      await api.post("/appointments", { ...form, patient_id: patient.id });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not book this appointment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Localized>
    <Modal open={open} onClose={onClose} title="Book an appointment">
      <form onSubmit={submit} className="space-y-4">
        {patient ? (
          <div className="flex items-center justify-between bg-bg border border-border rounded px-3 py-2 text-sm">
            <span className="font-medium">{patient.full_name}</span>
            <button type="button" className="text-ink-secondary text-xs" onClick={() => { setPatient(null); setPatientSearch(""); }}>{t("Change")}</button>
          </div>
        ) : (
          <div>
            <Input label="Patient" placeholder="Search by name or phone…" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
            {patientResults.length > 0 && (
              <div className="border border-border rounded mt-1 max-h-32 overflow-y-auto">
                {patientResults.map((p) => (
                  <button key={p.id} type="button" onClick={() => { setPatient(p); setPatientResults([]); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-bg">
                    {p.full_name} <span className="text-ink-secondary">· {p.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Select label="Doctor" required value={form.doctor_id} onChange={(e) => setForm((f) => ({ ...f, doctor_id: e.target.value }))}>
          <option value="">— select —</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.user?.full_name}</option>)}
        </Select>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Date" type="date" required value={form.appointment_date} onChange={(e) => setForm((f) => ({ ...f, appointment_date: e.target.value }))} />
          <Input label="Start" type="time" required value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
          <Input label="End" type="time" required value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
        </div>
        <Input label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Booking…" : "Book appointment"}</Button>
        </div>
      </form>
    </Modal>
    </Localized>
  );
}
