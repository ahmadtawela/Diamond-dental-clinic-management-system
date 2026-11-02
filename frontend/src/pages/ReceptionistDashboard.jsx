import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Users } from "lucide-react";
import api from "../api/client";
import { Button, Card, PageHeader } from "../components/ui";
import { useLocale } from "../context/LocaleContext";

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ReceptionistDashboard() {
  const { t, formatDate, formatNumber } = useLocale();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = localDateString(new Date());

  useEffect(() => {
    api.get("/appointments", { params: { date: today } })
      .then(({ data }) => setAppointments(data.data || data))
      .catch(() => setError(t("Could not load today's appointments.")))
      .finally(() => setLoading(false));
  }, [today, t]);

  return (
    <div>
      <PageHeader title={t("Receptionist dashboard")} subtitle={formatDate(today, { dateStyle: "full" })} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded bg-primary-light text-primary">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-ink-secondary">{t("Appointments today")}</p>
            <p className="font-display text-2xl font-semibold text-ink">{formatNumber(appointments.length)}</p>
          </div>
        </Card>
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded bg-primary-light text-primary">
              <Users className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-ink">{t("Patient services")}</p>
          </div>
          <Button as={Link} to="/patients">{t("Open patients")}</Button>
        </Card>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <Button as={Link} to="/appointments">{t("Open calendar")}</Button>
        <Button as={Link} to="/patients">{t("Register a patient")}</Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base text-ink">{t("Today's appointments")}</h2>
          <span className="text-sm text-ink-secondary">{formatDate(today, { dateStyle: "medium" })}</span>
        </div>
        {error ? (
          <p role="alert" className="p-5 text-sm text-danger">{error}</p>
        ) : loading ? (
          <p className="p-5 text-sm text-ink-secondary">{t("Loading…")}</p>
        ) : appointments.length === 0 ? (
          <p className="p-5 text-sm text-ink-secondary">{t("No appointments for this day")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{appointment.patient?.full_name}</span>
                  <span className="block text-sm text-ink-secondary">
                    {t("Doctor")}: {appointment.doctor?.user?.full_name}
                  </span>
                </span>
                <span className="flex items-center gap-3 text-sm">
                  <span className="text-ink-secondary" dir="ltr">
                    {appointment.start_time?.slice(0, 5)}–{appointment.end_time?.slice(0, 5)}
                  </span>
                  <span className="capitalize text-ink">{t(appointment.status)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
