import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
                <Button variant="ghost" size="sm" onClick={() => toggleStatus(a)}>
                  {a.status === "Active" ? "Deactivate" : "Activate"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {agents.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No agents yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
