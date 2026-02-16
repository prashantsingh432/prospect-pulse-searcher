import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  project: string | null;
  status: string;
  created_at: string;
}

interface SimAgentManagerProps {
  agents: Agent[];
  onRefresh: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const SimAgentManager: React.FC<SimAgentManagerProps> = ({ agents, onRefresh }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [project, setProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAgentId, setDeleteAgentId] = useState("");
  const [deleteAgentName, setDeleteAgentName] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleAdd = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);
    const { error } = await supabase.from("sim_agents" as any).insert({ name: name.trim(), project: project.trim() || null } as any);
    if (error) toast.error(error.message);
    else { toast.success("Agent added"); setName(""); setProject(""); setOpen(false); onRefresh(); }
    setLoading(false);
  };

  const toggleStatus = async (agent: Agent) => {
    const newStatus = agent.status === "Active" ? "Inactive" : "Active";
    const { error } = await supabase.from("sim_agents" as any).update({ status: newStatus } as any).eq("id", agent.id);
    if (error) toast.error(error.message);
    else { toast.success(`Agent ${newStatus === "Active" ? "activated" : "deactivated"}`); onRefresh(); }
  };

  const handleDelete = async () => {
    await supabase.from("sim_master" as any).update({ assigned_agent_id: null } as any).eq("assigned_agent_id", deleteAgentId);
    const { error } = await supabase.from("sim_agents" as any).delete().eq("id", deleteAgentId);
    if (error) toast.error(error.message);
    else { toast.success("Agent deleted permanently"); onRefresh(); }
    setDeleteOpen(false);
  };

  // Filter
  const filtered = agents.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.project || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeCount = agents.filter((a) => a.status === "Active").length;
  const inactiveCount = agents.filter((a) => a.status === "Inactive").length;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all outline-none"
              placeholder="Search agent or project..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex items-center space-x-1">
            {(["all", "Active", "Inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s === "all" ? "All" : s}
                <span className="ml-1.5 text-[10px] opacity-70">
                  {s === "all" ? agents.length : s === "Active" ? activeCount : inactiveCount}
                </span>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center space-x-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-sm shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>Add Agent</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4 border-b border-slate-200">Agent Name</th>
                <th className="px-6 py-4 border-b border-slate-200">Project</th>
                <th className="px-6 py-4 border-b border-slate-200">Status</th>
                <th className="px-6 py-4 border-b border-slate-200">Created</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {paginated.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{a.name}</td>
                  <td className="px-6 py-4 text-slate-500">{a.project || <span className="text-slate-300 italic">Unassigned</span>}</td>
                  <td className="px-6 py-4">
                    {a.status === "Active" ? (
                      <span className="inline-flex items-center bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(a.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleStatus(a)}
                        className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                          a.status === "Active"
                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {a.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => { setDeleteAgentId(a.id); setDeleteAgentName(a.name); setDeleteOpen(true); }}
                        className="p-1.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <span className="material-symbols-outlined text-3xl mb-2 block text-slate-300">group_off</span>
                    No agents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-3">
            <span>
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} Agents
            </span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="appearance-none bg-white border border-slate-300 rounded px-2 py-1 pr-6 text-xs cursor-pointer hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 normal-case tracking-normal font-normal"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-all ${
                    currentPage === p
                      ? "bg-slate-800 text-white shadow-sm"
                      : "hover:bg-white border border-transparent hover:border-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && (
                <>
                  <span className="px-1 text-slate-300">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-all ${
                      currentPage === totalPages ? "bg-slate-800 text-white shadow-sm" : "hover:bg-white border border-transparent hover:border-slate-200"
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Agent Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Agent</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Agent Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Project (optional)" value={project} onChange={(e) => setProject(e.target.value)} />
            <Button onClick={handleAdd} disabled={loading} className="w-full">{loading ? "Adding..." : "Add Agent"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Agent Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" />Delete Agent</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">Are you sure you want to permanently delete <strong>{deleteAgentName}</strong>? Any SIMs assigned to this agent will be unassigned.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
