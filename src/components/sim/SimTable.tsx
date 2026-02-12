import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MoreHorizontal, Search, AlertTriangle, CheckCircle, XCircle, Ban, RotateCcw, UserPlus, ChevronDown, ChevronRight, History } from "lucide-react";
import { SimRecord, SimAgent, SpamHistoryRecord } from "./SimInventoryManager";
import { format } from "date-fns";

interface SimTableProps {
  sims: SimRecord[];
  agents: SimAgent[];
  spamHistory: SpamHistoryRecord[];
  onAddSim: (simNumber: string, operator: string, agentId?: string, projectName?: string) => Promise<boolean>;
  onAssignAgent: (simId: string, agentId: string, projectName?: string) => void;
  onMarkSpam: (simId: string, remarks?: string) => void;
  onReactivate: (simId: string) => void;
  onDeactivate: (simId: string, reason?: string) => void;
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Spam: "bg-amber-100 text-amber-800",
  Deactivated: "bg-red-100 text-red-800",
  Inactive: "bg-gray-100 text-gray-800",
};

const riskColors: Record<string, string> = {
  Normal: "bg-blue-100 text-blue-800",
  Warning: "bg-orange-100 text-orange-800",
  "High Risk": "bg-red-100 text-red-800",
};

export const SimTable: React.FC<SimTableProps> = ({
  sims, agents, spamHistory, onAddSim, onAssignAgent, onMarkSpam, onReactivate, onDeactivate, onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [expandedSimId, setExpandedSimId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOperator, setFilterOperator] = useState<string>("all");
  // Add SIM dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newSim, setNewSim] = useState("");
  const [newOperator, setNewOperator] = useState<string>("");
  const [newAgent, setNewAgent] = useState<string>("");
  const [newProject, setNewProject] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  // Spam dialog
  const [spamOpen, setSpamOpen] = useState(false);
  const [spamSimId, setSpamSimId] = useState("");
  const [spamRemarks, setSpamRemarks] = useState("");
  // Deactivate dialog
  const [deactOpen, setDeactOpen] = useState(false);
  const [deactSimId, setDeactSimId] = useState("");
  const [deactReason, setDeactReason] = useState("");
  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSimId, setAssignSimId] = useState("");
  const [assignAgentId, setAssignAgentId] = useState("");
  const [assignProject, setAssignProject] = useState("");

  const filtered = useMemo(() => {
    return sims.filter((s) => {
      const matchSearch = !search || s.sim_number.includes(search) || s.agent_name?.toLowerCase().includes(search.toLowerCase()) || s.project_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || s.current_status === filterStatus;
      const matchOp = filterOperator === "all" || s.operator === filterOperator;
      return matchSearch && matchStatus && matchOp;
    });
  }, [sims, search, filterStatus, filterOperator]);

  const handleAdd = async () => {
    if (!newSim.trim() || !newOperator) { return; }
    setAddLoading(true);
    const ok = await onAddSim(newSim, newOperator, newAgent || undefined, newProject || undefined);
    if (ok) { setNewSim(""); setNewOperator(""); setNewAgent(""); setNewProject(""); setAddOpen(false); }
    setAddLoading(false);
  };

  const activeAgents = agents.filter((a) => a.status === "Active");

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search SIM, agent, project..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Spam">Spam</SelectItem>
              <SelectItem value="Deactivated">Deactivated</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterOperator} onValueChange={setFilterOperator}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Operator" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operators</SelectItem>
              <SelectItem value="Airtel">Airtel</SelectItem>
              <SelectItem value="Jio">Jio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add SIM</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New SIM Card</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">SIM Number *</label>
                <Input placeholder="e.g. +919520650678 or 9520650678" value={newSim} onChange={(e) => setNewSim(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Auto-formats to +91XXXXXXXXXX</p>
              </div>
              <div>
                <label className="text-sm font-medium">Operator *</label>
                <Select value={newOperator} onValueChange={setNewOperator}>
                  <SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Airtel">Airtel</SelectItem>
                    <SelectItem value="Jio">Jio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Assign Agent (optional)</label>
                <Select value={newAgent} onValueChange={setNewAgent}>
                  <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Agent</SelectItem>
                    {activeAgents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Project (optional)</label>
                <Input placeholder="Project name" value={newProject} onChange={(e) => setNewProject(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={addLoading || !newSim.trim() || !newOperator}>
                {addLoading ? "Adding..." : "Add SIM"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>SIM Number</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Spam Count</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sim) => {
              const simSpamEvents = spamHistory.filter((h) => h.sim_id === sim.id);
              const isExpanded = expandedSimId === sim.id;
              const hasSpamHistory = simSpamEvents.length > 0;

              return (
                <React.Fragment key={sim.id}>
                  <TableRow 
                    className={hasSpamHistory ? "cursor-pointer hover:bg-muted/30" : ""}
                    onClick={() => hasSpamHistory && setExpandedSimId(isExpanded ? null : sim.id)}
                  >
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        {hasSpamHistory && (
                          isExpanded ? <ChevronDown className="h-4 w-4 text-amber-500" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        {sim.sim_number}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{sim.operator}</Badge></TableCell>
                    <TableCell><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[sim.current_status] || ""}`}>{sim.current_status}</span></TableCell>
                    <TableCell>{sim.agent_name || "—"}</TableCell>
                    <TableCell>{sim.project_name || "—"}</TableCell>
                    <TableCell>
                      <span className={sim.spam_count > 0 ? "text-amber-600 font-semibold" : ""}>{sim.spam_count}</span>
                      {hasSpamHistory && (
                        <History className="inline h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${riskColors[sim.risk_level] || ""}`}>{sim.risk_level}</span></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setAssignSimId(sim.id); setAssignOpen(true); }} disabled={sim.current_status === "Deactivated"}>
                            <UserPlus className="h-4 w-4 mr-2" />Assign Agent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSpamSimId(sim.id); setSpamOpen(true); }} className="text-amber-600">
                            <AlertTriangle className="h-4 w-4 mr-2" />Mark Spam
                          </DropdownMenuItem>
                          {(sim.current_status === "Spam" || sim.current_status === "Deactivated") && (
                            <DropdownMenuItem onClick={() => onReactivate(sim.id)} className="text-green-600">
                              <RotateCcw className="h-4 w-4 mr-2" />Reactivate
                            </DropdownMenuItem>
                          )}
                          {sim.current_status !== "Deactivated" && (
                            <DropdownMenuItem onClick={() => { setDeactSimId(sim.id); setDeactOpen(true); }} className="text-red-600">
                              <Ban className="h-4 w-4 mr-2" />Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {/* Inline Spam History */}
                  {isExpanded && (
                    <TableRow className="bg-amber-50/50">
                      <TableCell colSpan={8} className="p-0">
                        <div className="px-6 py-3 border-l-4 border-amber-400">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-semibold text-amber-700">Spam History ({simSpamEvents.length} events)</span>
                          </div>
                          <div className="rounded border border-amber-200 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-amber-100/60 text-amber-800">
                                  <th className="text-left px-3 py-1.5 font-medium">#</th>
                                  <th className="text-left px-3 py-1.5 font-medium">Date</th>
                                  <th className="text-left px-3 py-1.5 font-medium">Agent</th>
                                  <th className="text-left px-3 py-1.5 font-medium">Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {simSpamEvents
                                  .sort((a, b) => new Date(a.spam_date).getTime() - new Date(b.spam_date).getTime())
                                  .map((event, idx) => (
                                  <tr key={event.id} className="border-t border-amber-200/60">
                                    <td className="px-3 py-1.5 text-amber-600 font-medium">{idx + 1}</td>
                                    <td className="px-3 py-1.5">{format(new Date(event.spam_date), "dd MMM yyyy")}</td>
                                    <td className="px-3 py-1.5">{event.agent_name || "—"}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground">{event.remarks || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No SIM cards found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">Showing {filtered.length} of {sims.length} SIMs</p>

      {/* Spam Dialog */}
      <Dialog open={spamOpen} onOpenChange={setSpamOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Mark SIM as Spam</DialogTitle></DialogHeader>
          <Textarea placeholder="Remarks (optional)" value={spamRemarks} onChange={(e) => setSpamRemarks(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpamOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { onMarkSpam(spamSimId, spamRemarks); setSpamOpen(false); setSpamRemarks(""); }}>Confirm Spam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={deactOpen} onOpenChange={setDeactOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Ban className="h-5 w-5 text-red-500" />Deactivate SIM</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason for deactivation (optional)" value={deactReason} onChange={(e) => setDeactReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { onDeactivate(deactSimId, deactReason); setDeactOpen(false); setDeactReason(""); }}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Agent Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Agent to SIM</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={assignAgentId} onValueChange={setAssignAgentId}>
              <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
              <SelectContent>
                {activeAgents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Project (optional)" value={assignProject} onChange={(e) => setAssignProject(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (assignAgentId) { onAssignAgent(assignSimId, assignAgentId, assignProject); setAssignOpen(false); setAssignAgentId(""); setAssignProject(""); } }} disabled={!assignAgentId}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
