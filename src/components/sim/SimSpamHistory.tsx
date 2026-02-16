import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SpamHistoryRecord } from "./SimInventoryManager";
import { format } from "date-fns";

interface SimSpamHistoryProps {
  history: SpamHistoryRecord[];
}

export const SimSpamHistory: React.FC<SimSpamHistoryProps> = ({ history }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Spam History (Last 500)</h3>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>SIM Number</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Spam Date</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Logged At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-mono">{h.sim_number}</TableCell>
                <TableCell>{h.agent_name || "—"}</TableCell>
                <TableCell>{format(new Date(h.spam_date), "dd MMM yyyy")}</TableCell>
                <TableCell className="max-w-[200px] truncate">{h.remarks || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{format(new Date(h.created_at), "dd MMM yyyy HH:mm")}</TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No spam history</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
