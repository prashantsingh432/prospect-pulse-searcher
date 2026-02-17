import React, { useState } from "react";
import { Download, ChevronLeft, ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

interface SimRecord {
  id: string;
  sim_number: string;
  operator: string;
  current_status: string;
  assigned_agent_id: string | null;
  agent_name?: string;
  project_name: string | null;
  spam_count: number;
  last_spam_date: string | null;
  risk_level: string;
}

interface SpamHistoryRecord {
  id: string;
  sim_id: string;
  sim_number?: string;
  agent_name?: string;
  spam_date: string;
  remarks: string | null;
}

interface SimDashboardProps {
  stats: {
    total: number;
    active: number;
    spam: number;
    deactivated: number;
    inactive: number;
    highRisk: number;
  };
  sims?: SimRecord[];
  spamHistory?: SpamHistoryRecord[];
}

type FilterType = "total" | "active" | "spam" | "deactivated" | "inactive" | "highRisk" | null;

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const KPI_CARDS: { label: string; key: FilterType; iconName: string }[] = [
  { label: "Total Active SIMs", key: "total", iconName: "smartphone" },
  { label: "Active", key: "active", iconName: "monitoring" },
  { label: "Spam", key: "spam", iconName: "report_problem" },
  { label: "Deactivated", key: "deactivated", iconName: "block" },
  { label: "Not In Use", key: "inactive", iconName: "inventory_2" },
  { label: "High Risk", key: "highRisk", iconName: "security" },
];

// Icon colors mapped per card
const ICON_COLORS: Record<string, string> = {
  total: "text-slate-700 dark:text-slate-300",
  active: "text-lime-700 dark:text-lime-400",
  spam: "text-amber-600 dark:text-amber-400",
  deactivated: "text-rose-700 dark:text-rose-400",
  inactive: "text-slate-400 dark:text-slate-500",
  highRisk: "text-slate-800 dark:text-slate-200",
};

export const SimDashboard: React.FC<SimDashboardProps> = ({ stats, sims = [], spamHistory = [] }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("total");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedSimId, setExpandedSimId] = useState<string | null>(null);

  const handleCardClick = (filter: FilterType) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filter);
      setCurrentPage(1);
      setExpandedSimId(null);
    }
  };

  const getFilteredSims = (): SimRecord[] => {
    switch (activeFilter) {
      case "total": return sims.filter(s => s.current_status !== "Deactivated");
      case "active": return sims.filter(s => s.current_status === "Active");
      case "spam": return sims.filter(s => s.current_status === "Spam");
      case "deactivated": return sims.filter(s => s.current_status === "Deactivated");
      case "inactive": return sims.filter(s => s.current_status === "Inactive");
      case "highRisk": return sims.filter(s => s.spam_count > 3);
      default: return [];
    }
  };

  const filteredSims = getFilteredSims();
  const totalPages = Math.ceil(filteredSims.length / pageSize);
  const paginatedSims = filteredSims.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statValues: Record<string, number> = {
    total: stats.total,
    active: stats.active,
    spam: stats.spam,
    deactivated: stats.deactivated,
    inactive: stats.inactive,
    highRisk: stats.highRisk,
  };

  // Spam info map for spam/highRisk views
  const spamInfoMap = new Map<string, { date: string; agent: string }>();
  if (activeFilter === "spam" || activeFilter === "highRisk") {
    spamHistory.forEach(h => {
      const existing = spamInfoMap.get(h.sim_id);
      if (!existing || h.spam_date > existing.date) {
        spamInfoMap.set(h.sim_id, { date: h.spam_date, agent: h.agent_name || "—" });
      }
    });
  }

  const statusBadgeClass = (status: string): string => {
    switch (status) {
      case "Active": return "bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400";
      case "Spam": return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400";
      case "Deactivated": return "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400";
      case "Inactive": return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  const exportToCSV = () => {
    if (filteredSims.length === 0) return;
    const label = KPI_CARDS.find(c => c.key === activeFilter)?.label || "SIMs";
    const headers = ["#", "SIM Number", "Operator", "Agent", "Project", "Status", "Spam Count", "Risk Level"];
    const rows = filteredSims.map((sim, idx) => [
      idx + 1, sim.sim_number, sim.operator, sim.agent_name || "", sim.project_name || "",
      sim.current_status, sim.spam_count, sim.risk_level,
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIM_${label.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredSims.length} SIMs to CSV`);
  };

  // Determine columns for the active filter
  const getColumns = () => {
    switch (activeFilter) {
      case "total": return ["#", "SIM Number", "Operator", "Assigned To", "Status"];
      case "active": return ["#", "SIM Number", "Operator", "Assigned To", "Project"];
      case "spam":
      case "highRisk": return ["#", "SIM Number", "Operator", "Spam Count", "Last Spam Date", "Spam By", ""];
      case "deactivated":
      case "inactive": return ["#", "SIM Number", "Operator"];
      default: return [];
    }
  };

  const columns = getColumns();

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI_CARDS.map((card) => {
          const isSelected = activeFilter === card.key;
          return (
            <div
              key={card.key}
              onClick={() => handleCardClick(card.key)}
              className={`
                bg-white dark:bg-slate-800 p-5 rounded cursor-pointer transition-all shadow-sm
                ${isSelected
                  ? "border-t-4 border-t-slate-800 dark:border-t-slate-300 border-x border-b border-slate-200 dark:border-slate-700"
                  : "border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <span className={`material-symbols-outlined text-xl ${ICON_COLORS[card.key!]}`}>
                  {card.iconName}
                </span>
              </div>
              <div className="text-3xl font-light text-slate-800 dark:text-white">
                {statValues[card.key!]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtered Table */}
      {activeFilter && filteredSims.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <span>{KPI_CARDS.find(c => c.key === activeFilter)?.label}</span>
              <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">
                / {filteredSims.length} Units
              </span>
            </h2>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                  {columns.map((col, i) => (
                    <th key={i} className="px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-[13px]">
                {paginatedSims.map((sim, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const spamInfo = spamInfoMap.get(sim.id);
                  const simSpamEvents = (activeFilter === "highRisk" || activeFilter === "spam")
                    ? spamHistory.filter(h => h.sim_id === sim.id)
                    : [];
                  const isExpanded = expandedSimId === sim.id;
                  const hasExpandable = simSpamEvents.length > 0;

                  return (
                    <React.Fragment key={sim.id}>
                      <tr
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors ${hasExpandable ? "cursor-pointer" : ""}`}
                        onClick={() => hasExpandable && setExpandedSimId(isExpanded ? null : sim.id)}
                      >
                        <td className="px-6 py-4 font-medium text-slate-400">{globalIdx}</td>
                        <td className="px-6 py-4 font-mono tracking-tight text-slate-800 dark:text-slate-100">
                          {sim.sim_number}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-[11px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
                            {sim.operator}
                          </span>
                        </td>

                        {/* Total view: Assigned To + Status */}
                        {activeFilter === "total" && (
                          <>
                            <td className="px-6 py-4">
                              {(sim.current_status === "Spam" || sim.current_status === "Deactivated" || sim.current_status === "Inactive")
                                ? <span className="text-slate-400 italic">Unassigned</span>
                                : sim.agent_name
                                  ? <span className="font-medium text-slate-700 dark:text-slate-300">{sim.agent_name}</span>
                                  : <span className="text-slate-400 italic">Unassigned</span>
                              }
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-tighter ${statusBadgeClass(sim.current_status)}`}>
                                {sim.current_status}
                              </span>
                            </td>
                          </>
                        )}

                        {/* Active view: Assigned To + Project */}
                        {activeFilter === "active" && (
                          <>
                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                              {sim.agent_name || <span className="text-slate-400 italic">Unassigned</span>}
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {sim.project_name || "—"}
                            </td>
                          </>
                        )}

                        {/* Spam / High Risk view */}
                        {(activeFilter === "spam" || activeFilter === "highRisk") && (
                          <>
                            <td className="px-6 py-4">
                              <Badge variant="destructive" className="text-xs">{sim.spam_count}</Badge>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {spamInfo?.date
                                ? new Date(spamInfo.date).toLocaleDateString()
                                : sim.last_spam_date
                                  ? new Date(sim.last_spam_date).toLocaleDateString()
                                  : "—"}
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {spamInfo?.agent || "—"}
                            </td>
                            <td className="px-6 py-4">
                              {hasExpandable && (
                                isExpanded
                                  ? <ChevronDown className="h-4 w-4 text-amber-500" />
                                  : <ChevronRight className="h-4 w-4 text-slate-400" />
                              )}
                            </td>
                          </>
                        )}
                      </tr>

                      {/* Expandable Spam History */}
                      {hasExpandable && isExpanded && (
                        <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                          <td colSpan={columns.length} className="p-0">
                            <div className="px-6 py-3 border-l-4 border-amber-400">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                                  Spam History ({simSpamEvents.length} events)
                                </span>
                              </div>
                              <div className="rounded border border-amber-200 dark:border-amber-800 overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-amber-100/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                      <th className="text-left px-3 py-1.5 font-medium">#</th>
                                      <th className="text-left px-3 py-1.5 font-medium">Date</th>
                                      <th className="text-left px-3 py-1.5 font-medium">Agent</th>
                                      <th className="text-left px-3 py-1.5 font-medium">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {simSpamEvents
                                      .sort((a, b) => new Date(a.spam_date).getTime() - new Date(b.spam_date).getTime())
                                      .map((event, i) => (
                                        <tr key={event.id} className="border-t border-amber-200/60 dark:border-amber-800/60">
                                          <td className="px-3 py-1.5 text-amber-600 font-medium">{i + 1}</td>
                                          <td className="px-3 py-1.5">{format(new Date(event.spam_date), "dd MMM yyyy")}</td>
                                          <td className="px-3 py-1.5">{event.agent_name || "—"}</td>
                                          <td className="px-3 py-1.5 text-slate-500">{event.remarks || "—"}</td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] font-medium text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-4">
              <span>
                Items {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredSims.length)} of {filteredSims.length} Total
              </span>
              <div className="relative normal-case tracking-normal">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 pr-6 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size} / page</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-6 h-6 flex items-center justify-center rounded-sm text-xs ${
                        currentPage === page
                          ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800"
                          : "hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeFilter && filteredSims.length === 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
          <div className="py-8 text-center text-slate-500 dark:text-slate-400">
            No SIMs found for this category.
          </div>
        </div>
      )}
    </div>
  );
};
