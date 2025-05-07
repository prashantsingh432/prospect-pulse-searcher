import { useState } from "react";
import { Prospect } from "@/data/prospects";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Linkedin, User, Building2, Mail, Phone, MapPin, ClipboardList } from "lucide-react";

interface SearchResultsProps {
  results: Prospect[];
}

// Add a function to generate a color from a string (name)
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 50%)`;
  return color;
}

export const SearchResults = ({ results }: SearchResultsProps) => {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyProspectDetails = (prospect: Prospect) => {
    const text = `Name: ${prospect.name}\nCompany: ${prospect.company}\nEmail: ${prospect.email}\nPhone: ${prospect.phone}\nLinkedIn: ${prospect.linkedin}\nLocation: ${prospect.location}`;
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${prospect.name}'s details copied.`,
      });
      
      setCopiedId(prospect.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch((error) => {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
      console.error("Copy failed:", error);
    });
  };

  if (results.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No matching prospects found. Try adjusting your search criteria.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div
        className="overflow-x-auto select-none"
        onContextMenu={e => e.preventDefault()}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><span className="inline-flex items-center gap-1"><User size={16}/> Name</span></TableHead>
              <TableHead><span className="inline-flex items-center gap-1"><Building2 size={16}/> Company</span></TableHead>
              <TableHead><span className="inline-flex items-center gap-1"><Mail size={16}/> Email</span></TableHead>
              <TableHead><span className="inline-flex items-center gap-1"><Phone size={16}/> Phone</span></TableHead>
              <TableHead><span className="inline-flex items-center gap-1"><Linkedin size={16}/> LinkedIn</span></TableHead>
              <TableHead><span className="inline-flex items-center gap-1"><MapPin size={16}/> Location</span></TableHead>
              <TableHead className="w-[100px] text-right"><span className="inline-flex items-center gap-1"><ClipboardList size={16}/> Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((prospect) => (
              <TableRow key={prospect.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <User size={20} style={{ color: stringToColor(prospect.name) }} />
                  {prospect.name}
                </TableCell>
                <TableCell>{prospect.company}</TableCell>
                <TableCell>{prospect.email}</TableCell>
                <TableCell>{prospect.phone}</TableCell>
                <TableCell>
                  <a 
                    href={`https://${prospect.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                  >
                    <Linkedin size={16} className="mr-1" />
                    Profile
                  </a>
                </TableCell>
                <TableCell>{prospect.location}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyProspectDetails(prospect)}
                  >
                    {copiedId === prospect.id ? "Copied!" : "📋 Copy"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
