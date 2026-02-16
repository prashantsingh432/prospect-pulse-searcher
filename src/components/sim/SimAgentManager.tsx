import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserPlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export const SimAgentManager: React.FC<SimAgentManagerProps> = ({ agents, onRefresh }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [project, setProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAgentId, setDeleteAgentId] = useState("");
  const [deleteAgentName, setDeleteAgentName] = useState("");

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
    // Unassign agent from any SIMs first
    await supabase.from("sim_master" as any).update({ assigned_agent_id: null } as any).eq("assigned_agent_id", deleteAgentId);
    const { error } = await supabase.from("sim_agents" as any).delete().eq("id", deleteAgentId);
    if (error) toast.error(error.message);
    else { toast.success("Agent deleted permanently"); onRefresh(); }
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">SIM Agents</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Add Agent</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Agent</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Agent Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Project (optional)" value={project} onChange={(e) => setProject(e.target.value)} />
              <Button onClick={handleAdd} disabled={loading} className="w-full">{loading ? "Adding..." : "Add Agent"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.name}</TableCell>
              <TableCell>{a.project || "—"}</TableCell>
              <TableCell>
                <Badge variant={a.status === "Active" ? "default" : "secondary"}>{a.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus(a)}>
                    {a.status === "Active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setDeleteAgentId(a.id); setDeleteAgentName(a.name); setDeleteOpen(true); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {agents.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No agents yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete Agent Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" />Delete Agent</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete <strong>{deleteAgentName}</strong>? Any SIMs assigned to this agent will be unassigned.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
