import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../../api/client";
import { Card, PageHeader, Select } from "../../components/ui";
import { Localized, useLocale } from "../../context/LocaleContext";

export default function ReportsPage() {
  const { formatNumber, t } = useLocale();
  const [period, setPeriod] = useState("monthly");
  const [revenue, setRevenue] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/reports/revenue", { params: { period } }).then(({ data }) => setRevenue(data));
  }, [period]);

  useEffect(() => {
    api.get("/reports/patient-stats").then(({ data }) => setStats(data));
  }, []);

  return (
    <Localized>
    <div>
      <PageHeader title="Reports" subtitle="Revenue, collections, and patient demand" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <p className="text-sm text-ink-secondary">Outstanding balance</p>
          <p className="text-2xl font-display font-semibold text-ink mt-1">
            {revenue ? formatNumber(Number(revenue.total_outstanding), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-secondary">New patients (last 30 days)</p>
          <p className="text-2xl font-display font-semibold text-ink mt-1">{stats ? stats.new_patients : "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-secondary">Most visited doctor</p>
          <p className="text-2xl font-display font-semibold text-ink mt-1">
            {stats?.most_visited_doctors?.[0]?.doctor || "—"}
          </p>
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base text-ink">Revenue collected</h3>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-auto">
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenue?.collected_by_period || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" />
            <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: "#5B6B63" }} />
            <YAxis tick={{ fontSize: 12, fill: "#5B6B63" }} tickFormatter={(value) => formatNumber(value)} />
            <Tooltip formatter={(value) => [formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), t("Revenue collected")]} />
            <Bar dataKey="collected" fill="#0F6E56" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5">
        <h3 className="text-base text-ink mb-4">Doctors by visit volume</h3>
        <div className="space-y-2">
          {stats?.most_visited_doctors?.map((d) => (
            <div key={d.doctor} className="flex justify-between text-sm border-b border-border last:border-0 py-2">
              <span>{d.doctor}</span>
              <span className="text-ink-secondary">{d.visit_count} visits</span>
            </div>
          )) || <p className="text-sm text-ink-secondary">No visit data in this range yet.</p>}
        </div>
      </Card>
    </div>
    </Localized>
  );
}
