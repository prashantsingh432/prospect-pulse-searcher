import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Activity, Smartphone } from "lucide-react";
import type { SimRecord } from "./SimInventoryManager";

interface Props {
  sims: SimRecord[];
}

const STATUS_COLORS: Record<string, string> = {
  Active: "#65a30d",
  Spam: "#d97706",
  Inactive: "#94a3b8",
  Deactivated: "#e11d48",
};

const OPERATORS = ["Jio", "Airtel"] as const;

export const SimUsageCharts: React.FC<Props> = ({ sims }) => {
  const data = useMemo(() => {
    return OPERATORS.map((op) => {
      const subset = sims.filter((s) => s.operator === op);
      return {
        operator: op,
        Active: subset.filter((s) => s.current_status === "Active").length,
        Spam: subset.filter((s) => s.current_status === "Spam").length,
        Inactive: subset.filter((s) => s.current_status === "Inactive").length,
        Deactivated: subset.filter((s) => s.current_status === "Deactivated").length,
        total: subset.length,
      };
    });
  }, [sims]);

  const totals = useMemo(() => {
    return {
      Active: sims.filter((s) => s.current_status === "Active").length,
      Spam: sims.filter((s) => s.current_status === "Spam").length,
      Inactive: sims.filter((s) => s.current_status === "Inactive").length,
      Deactivated: sims.filter((s) => s.current_status === "Deactivated").length,
    };
  }, [sims]);

  const pieData = (Object.keys(totals) as (keyof typeof totals)[]).map((k) => ({
    name: k,
    value: totals[k],
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Per-operator summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((d) => (
          <div key={d.operator} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {d.operator}
                </span>
              </div>
              <span className="text-xs text-slate-500">{d.total} total</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(["Active", "Spam", "Inactive", "Deactivated"] as const).map((s) => (
                <div key={s} className="rounded bg-slate-50 dark:bg-slate-900/40 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">{s}</div>
                  <div className="text-xl font-light" style={{ color: STATUS_COLORS[s] }}>{d[s]}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart: per operator working vs spam */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Live Operator Breakdown
          </h3>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Real-time
          </span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="operator" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Active" fill={STATUS_COLORS.Active} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Spam" fill={STATUS_COLORS.Spam} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Inactive" fill={STATUS_COLORS.Inactive} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie chart: overall distribution */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-4">
          Overall SIM Status Distribution
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
