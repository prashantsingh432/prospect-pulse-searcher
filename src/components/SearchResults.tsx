import { useState } from "react";
import { Prospect } from "@/data/prospects";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Linkedin, User, Building2, Mail, Phone, MapPin, ClipboardList, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

// Function to mask phone numbers using visible prefix and blurred suffix
const maskPhoneNumber = (phone: string): { prefix: string; suffix: string } => {
  if (!phone) return { prefix: "", suffix: "" };
  
  // Check if it's a US format number
  if (phone.includes("-")) {
    const parts = phone.split("-");
    if (parts.length === 3) {
      return {
        prefix: `${parts[0]}-${parts[1].charAt(0)}`,
        suffix: parts[1].substring(1) + "-" + parts[2]
      };
    }
  }
  
  // International format
  if (phone.startsWith("+")) {
    // Keep country code and first 2-3 digits visible
    const visiblePart = phone.substring(0, 6);
    return {
      prefix: visiblePart,
      suffix: phone.substring(6)
    };
  }
  
  // Default masking pattern
  return {
    prefix: phone.substring(0, 3),
    suffix: phone.substring(3)
  };
};

// Component to render a single phone number with reveal functionality
const PhoneNumberCell = ({ 
  phone, 
  prospectId, 
  phoneIndex, 
  revealedPhones, 
  justCopied, 
  onPhoneClick 
}: {
  phone: string;
  prospectId: number;
  phoneIndex: number;
  revealedPhones: Record<string, boolean>;
  justCopied: Record<string, boolean>;
  onPhoneClick: (prospectId: number, phoneIndex: number, phone: string) => void;
}) => {
  if (!phone) return null;
  
  const phoneKey = `${prospectId}-${phoneIndex}`;
  
  return (
    <div className="relative mb-1">
      <button 
        onClick={() => onPhoneClick(prospectId, phoneIndex, phone)}
        className={`text-left font-mono text-sm ${revealedPhones[phoneKey] ? 'text-primary' : 'text-slate-700 hover:text-primary cursor-pointer underline decoration-dashed underline-offset-4'}`}
      >
        {(() => {
          const { prefix, suffix } = maskPhoneNumber(phone);
          return (
            <span className="relative">
              {prefix}
              <span 
                className={`transition-all duration-300 ${
                  revealedPhones[phoneKey] 
                    ? 'blur-none opacity-100' 
                    : 'blur-[4px] opacity-70'
                }`}
              >
                {suffix}
              </span>
            </span>
          );
        })()}
      </button>
      
      {justCopied[phoneKey] && (
        <div className="absolute -top-8 left-0 bg-green-50 text-green-700 text-xs py-1 px-2 rounded flex items-center gap-1 shadow-sm animate-fade-in z-10">
          <Check size={12} />
          <span>Copied!</span>
        </div>
      )}
    </div>
  );
};

export const SearchResults = ({ results }: SearchResultsProps) => {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [justCopied, setJustCopied] = useState<Record<string, boolean>>({});

  const copyProspectDetails = (prospect: Prospect) => {
    const phoneNumbers = [
      prospect.phone,
      prospect.phone2,
      prospect.phone3,
      prospect.phone4
    ].filter(Boolean).join(', ');
    
    const text = `Name: ${prospect.name}\nCompany: ${prospect.company}\nEmail: ${prospect.email}\nPhone Numbers: ${phoneNumbers}\nLinkedIn: ${prospect.linkedin}\nLocation: ${prospect.location}`;
    
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

  const handlePhoneClick = (prospectId: number, phoneIndex: number, phone: string) => {
    const phoneKey = `${prospectId}-${phoneIndex}`;
    
    // Reveal phone number
    setRevealedPhones(prev => ({
      ...prev,
      [phoneKey]: true
    }));

    // Copy to clipboard and show notification
    navigator.clipboard.writeText(phone).then(() => {
      setJustCopied(prev => ({
        ...prev,
        [phoneKey]: true
      }));

      // Clear notification after 3 seconds
      setTimeout(() => {
        setJustCopied(prev => ({
          ...prev,
          [phoneKey]: false
        }));
      }, 3000);
    }).catch((error) => {
      toast({
        title: "Failed to copy phone number",
        description: "Please try again.",
        variant: "destructive",
      });
      console.error("Copy phone failed:", error);
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
    <TooltipProvider>
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
                <TableHead><span className="inline-flex items-center gap-1"><Phone size={16}/> Phone Numbers</span></TableHead>
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
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-1">
                          <PhoneNumberCell
                            phone={prospect.phone}
                            prospectId={prospect.id}
                            phoneIndex={1}
                            revealedPhones={revealedPhones}
                            justCopied={justCopied}
                            onPhoneClick={handlePhoneClick}
                          />
                          <PhoneNumberCell
                            phone={prospect.phone2 || ""}
                            prospectId={prospect.id}
                            phoneIndex={2}
                            revealedPhones={revealedPhones}
                            justCopied={justCopied}
                            onPhoneClick={handlePhoneClick}
                          />
                          <PhoneNumberCell
                            phone={prospect.phone3 || ""}
                            prospectId={prospect.id}
                            phoneIndex={3}
                            revealedPhones={revealedPhones}
                            justCopied={justCopied}
                            onPhoneClick={handlePhoneClick}
                          />
                          <PhoneNumberCell
                            phone={prospect.phone4 || ""}
                            prospectId={prospect.id}
                            phoneIndex={4}
                            revealedPhones={revealedPhones}
                            justCopied={justCopied}
                            onPhoneClick={handlePhoneClick}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Click to reveal & copy phone numbers</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
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
    </TooltipProvider>
  );
};
