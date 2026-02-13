import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, AlertTriangle, XCircle, Activity, Shield, Ban } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

export const SimDashboard: React.FC<SimDashboardProps> = ({ stats, sims = [], spamHistory = [] }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  const cards: { label: string; value: number; icon: any; color: string; bg: string; filter: FilterType }[] = [
    { label: "Total Active SIMs", value: stats.total, icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50", filter: "total" },
    { label: "Active", value: stats.active, icon: Activity, color: "text-green-600", bg: "bg-green-50", filter: "active" },
    { label: "Spam", value: stats.spam, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", filter: "spam" },
    { label: "Deactivated", value: stats.deactivated, icon: XCircle, color: "text-red-600", bg: "bg-red-50", filter: "deactivated" },
    { label: "Not in Used", value: stats.inactive, icon: Ban, color: "text-gray-600", bg: "bg-gray-50", filter: "inactive" },
    { label: "High Risk", value: stats.highRisk, icon: Shield, color: "text-purple-600", bg: "bg-purple-50", filter: "highRisk" },
  ];

  const handleCardClick = (filter: FilterType) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const getFilteredSims = (): SimRecord[] => {
    switch (activeFilter) {
      case "total": return sims.filter(s => s.current_status !== "Deactivated");
      case "active": return sims.filter(s => s.current_status === "Active");
      case "spam": return sims.filter(s => s.current_status === "Spam");
      case "deactivated": return sims.filter(s => s.current_status === "Deactivated");
      case "inactive": return sims.filter(s => s.current_status === "Inactive");
      case "highRisk": return sims.filter(s => s.spam_count >= 3);
      default: return [];
    }
  };

  const filteredSims = getFilteredSims();

  // For spam view, build a map of last spam info per sim
  const spamInfoMap = new Map<string, { date: string; agent: string }>();
  if (activeFilter === "spam") {
    spamHistory.forEach(h => {
      if (!spamInfoMap.has(h.sim_id)) {
        spamInfoMap.set(h.sim_id, { date: h.spam_date, agent: h.agent_name || "—" });
      }
    });
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Active: "bg-green-100 text-green-800",
      Spam: "bg-amber-100 text-amber-800",
      Deactivated: "bg-red-100 text-red-800",
      Inactive: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Card
            key={c.label}
            className={`border-none shadow-sm cursor-pointer transition-all hover:shadow-md ${activeFilter === c.filter ? "ring-2 ring-primary" : ""}`}
            onClick={() => handleCardClick(c.filter)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <div className={`p-2 rounded-lg ${c.bg}`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeFilter && filteredSims.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {cards.find(c => c.filter === activeFilter)?.label} — {filteredSims.length} SIM{filteredSims.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">#</TableHead>
                    <TableHead className="sticky top-0 bg-background">SIM Number</TableHead>
                    <TableHead className="sticky top-0 bg-background">Operator</TableHead>
                    {(activeFilter === "total" || activeFilter === "active" || activeFilter === "highRisk") && (
                      <TableHead className="sticky top-0 bg-background">Assigned To</TableHead>
                    )}
                    {(activeFilter === "total" || activeFilter === "highRisk") && (
                      <TableHead className="sticky top-0 bg-background">Status</TableHead>
                    )}
                    {activeFilter === "spam" && (
                      <>
                        <TableHead className="sticky top-0 bg-background">Last Spam Date</TableHead>
                        <TableHead className="sticky top-0 bg-background">Spam By</TableHead>
                      </>
                    )}
                    {activeFilter === "active" && (
                      <TableHead className="sticky top-0 bg-background">Project</TableHead>
                    )}
                    {activeFilter === "highRisk" && (
                      <TableHead className="sticky top-0 bg-background">Spam Count</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSims.map((sim, idx) => {
                    const spamInfo = spamInfoMap.get(sim.id);
                    return (
                      <TableRow key={sim.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{sim.sim_number}</TableCell>
                        <TableCell>{sim.operator}</TableCell>
                        {(activeFilter === "total" || activeFilter === "active" || activeFilter === "highRisk") && (
                          <TableCell>{sim.agent_name || "—"}</TableCell>
                        )}
                        {(activeFilter === "total" || activeFilter === "highRisk") && (
                          <TableCell>{statusBadge(sim.current_status)}</TableCell>
                        )}
                        {activeFilter === "spam" && (
                          <>
                            <TableCell>{spamInfo?.date ? new Date(spamInfo.date).toLocaleDateString() : sim.last_spam_date ? new Date(sim.last_spam_date).toLocaleDateString() : "—"}</TableCell>
                            <TableCell>{spamInfo?.agent || "—"}</TableCell>
                          </>
                        )}
                        {activeFilter === "active" && (
                          <TableCell>{sim.project_name || "—"}</TableCell>
                        )}
                        {activeFilter === "highRisk" && (
                          <TableCell><Badge variant="destructive">{sim.spam_count}</Badge></TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeFilter && filteredSims.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No SIMs found for this category.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
