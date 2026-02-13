import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimDashboard } from "./SimDashboard";
import { SimTable } from "./SimTable";
import { SimAgentManager } from "./SimAgentManager";
import { LayoutDashboard, Smartphone, Users } from "lucide-react";

// Types
export interface SimRecord {
  id: string;
  sim_number: string;
  operator: string;
  current_status: string;
  assigned_agent_id: string | null;
  project_name: string | null;
  spam_count: number;
  last_spam_date: string | null;
  risk_level: string;
  created_at: string;
  updated_at: string;
  agent_name?: string;
}

export interface SimAgent {
  id: string;
  name: string;
  project: string | null;
  status: string;
  created_at: string;
}

export interface SpamHistoryRecord {
  id: string;
  sim_id: string;
  agent_id: string | null;
  spam_date: string;
  remarks: string | null;
  marked_by: string | null;
  created_at: string;
  sim_number?: string;
  agent_name?: string;
}

// Phone number cleaning
export function cleanSimNumber(input: string): string {
  let digits = input.replace(/\D/g, "");
  // Ensure it starts with +91
  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `+91${digits.slice(1)}`;
  }
  // Already has country code
  if (digits.length > 12 && digits.startsWith("91")) {
    return `+91${digits.slice(2, 12)}`;
  }
  return `+91${digits.slice(0, 10)}`;
}

// Risk level calculation
export function calculateRiskLevel(spamCount: number): string {
  if (spamCount >= 3) return "High Risk";
  return "Normal";
}

export const SimInventoryManager: React.FC = () => {
  const { user } = useAuth();
  const [sims, setSims] = useState<SimRecord[]>([]);
  const [agents, setAgents] = useState<SimAgent[]>([]);
  const [spamHistory, setSpamHistory] = useState<SpamHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fetchAll = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [simRes, agentRes, spamRes] = await Promise.all([
        supabase.from("sim_master" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("sim_agents" as any).select("*").order("name"),
        supabase.from("sim_spam_history" as any).select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      const simsData = (simRes.data || []) as any[] as SimRecord[];
      const agentsData = (agentRes.data || []) as any[] as SimAgent[];
      const spamData = (spamRes.data || []) as any[] as SpamHistoryRecord[];

      // Enrich with agent names
      const agentMap = new Map(agentsData.map((a) => [a.id, a.name]));
      const enrichedSims = simsData.map((s) => ({
        ...s,
        agent_name: s.assigned_agent_id ? agentMap.get(s.assigned_agent_id) || "Unknown" : undefined,
      }));
      const enrichedSpam = spamData.map((s) => ({
        ...s,
        sim_number: enrichedSims.find((sim) => sim.id === s.sim_id)?.sim_number || "Unknown",
        agent_name: s.agent_id ? agentMap.get(s.agent_id) || "Unknown" : undefined,
      }));

      setSims(enrichedSims);
      setAgents(agentsData);
      setSpamHistory(enrichedSpam);
    } catch (err) {
      console.error("Error fetching SIM data:", err);
      toast.error("Failed to load SIM data");
    }
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => { fetchAll(true); }, [fetchAll]);

  const stats = {
    total: sims.filter((s) => s.current_status !== "Deactivated").length,
    active: sims.filter((s) => s.current_status === "Active").length,
    spam: sims.filter((s) => s.current_status === "Spam").length,
    deactivated: sims.filter((s) => s.current_status === "Deactivated").length,
    inactive: sims.filter((s) => s.current_status === "Inactive").length,
    highRisk: sims.filter((s) => s.spam_count >= 3).length,
  };

  // --- SIM Actions ---
  const addSim = async (simNumber: string, operator: string, agentId?: string, projectName?: string) => {
    const cleaned = cleanSimNumber(simNumber);
    const { error } = await supabase.from("sim_master" as any).insert({
      sim_number: cleaned,
      operator,
      assigned_agent_id: agentId || null,
      project_name: projectName || null,
    } as any);
    if (error) {
      if (error.message.includes("duplicate")) toast.error("SIM number already exists");
      else toast.error(error.message);
      return false;
    }
    // Audit log
    await supabase.from("sim_audit_log" as any).insert({
      action: "SIM_ADDED",
      details: { sim_number: cleaned, operator },
      performed_by: user?.id,
    } as any);
    toast.success(`SIM ${cleaned} added`);
    fetchAll();
    return true;
  };

  const assignAgent = async (simId: string, agentId: string, projectName?: string) => {
    const sim = sims.find((s) => s.id === simId);
    if (sim?.current_status === "Deactivated") {
      toast.error("Cannot assign a deactivated SIM");
      return;
    }
    const { error } = await supabase.from("sim_master" as any).update({
      assigned_agent_id: agentId,
      project_name: projectName || undefined,
    } as any).eq("id", simId);
    if (error) toast.error(error.message);
    else {
      await supabase.from("sim_audit_log" as any).insert({
        sim_id: simId, action: "AGENT_ASSIGNED",
        details: { agent_id: agentId }, performed_by: user?.id,
      } as any);
      toast.success("Agent assigned");
      fetchAll();
    }
  };

  const markSpam = async (simId: string, remarks?: string) => {
    const sim = sims.find((s) => s.id === simId);
    if (!sim) return;
    const newCount = sim.spam_count + 1;
    const newRisk = calculateRiskLevel(newCount);

    // Create spam history entry
    await supabase.from("sim_spam_history" as any).insert({
      sim_id: simId,
      agent_id: sim.assigned_agent_id,
      remarks: remarks || null,
      marked_by: user?.id,
    } as any);

    // Update SIM
    const { error } = await supabase.from("sim_master" as any).update({
      current_status: "Spam",
      spam_count: newCount,
      last_spam_date: new Date().toISOString(),
      risk_level: newRisk,
    } as any).eq("id", simId);

    if (error) toast.error(error.message);
    else {
      await supabase.from("sim_audit_log" as any).insert({
        sim_id: simId, action: "MARKED_SPAM",
        details: { spam_count: newCount, risk_level: newRisk, remarks },
        performed_by: user?.id,
      } as any);
      toast.success(`SIM marked as Spam (Count: ${newCount}, Risk: ${newRisk})`);
      fetchAll();
    }
  };

  const reactivate = async (simId: string) => {
    const { error } = await supabase.from("sim_master" as any).update({ current_status: "Active" } as any).eq("id", simId);
    if (error) toast.error(error.message);
    else {
      // Update deactivation history if exists
      await supabase.from("sim_deactivation_history" as any)
        .update({ reactivated_date: new Date().toISOString().split("T")[0] } as any)
        .eq("sim_id", simId)
        .is("reactivated_date", null);

      await supabase.from("sim_audit_log" as any).insert({
        sim_id: simId, action: "REACTIVATED", performed_by: user?.id,
      } as any);
      toast.success("SIM reactivated (spam count preserved)");
      fetchAll();
    }
  };

  const deactivate = async (simId: string, reason?: string) => {
    const { error } = await supabase.from("sim_master" as any).update({ current_status: "Deactivated" } as any).eq("id", simId);
    if (error) toast.error(error.message);
    else {
      await supabase.from("sim_deactivation_history" as any).insert({
        sim_id: simId, reason: reason || null, deactivated_by: user?.id,
      } as any);
      await supabase.from("sim_audit_log" as any).insert({
        sim_id: simId, action: "DEACTIVATED", details: { reason },
        performed_by: user?.id,
      } as any);
      toast.success("SIM deactivated");
      fetchAll();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />Dashboard
          </TabsTrigger>
          <TabsTrigger value="sims" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />SIM Cards
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <SimDashboard stats={stats} sims={sims} spamHistory={spamHistory} />
        </TabsContent>

        <TabsContent value="sims" className="mt-6">
          <SimTable
            sims={sims}
            agents={agents}
            spamHistory={spamHistory}
            onAddSim={addSim}
            onAssignAgent={assignAgent}
            onMarkSpam={markSpam}
            onReactivate={reactivate}
            onDeactivate={deactivate}
            onRefresh={fetchAll}
          />
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <SimAgentManager agents={agents} onRefresh={fetchAll} />
        </TabsContent>

      </Tabs>
    </div>
  );
};
