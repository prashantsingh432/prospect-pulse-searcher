
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
import { Linkedin, User, Building2, Mail, Phone, MapPin, Briefcase, Check, Edit2, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditProspectDialog } from "./EditProspectDialog";
import { DeleteProspectDialog } from "./DeleteProspectDialog";

// Utility function to format LinkedIn URLs properly
const formatLinkedInUrl = (url: string): string => {
  if (!url || url.trim() === '') return '#';

  const trimmedUrl = url.trim();

  // If it already starts with http:// or https://, return as is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // If it starts with linkedin.com or www.linkedin.com, add https://
  if (trimmedUrl.startsWith('linkedin.com') || trimmedUrl.startsWith('www.linkedin.com')) {
    return `https://${trimmedUrl}`;
  }

  // If it's just a username or path, construct the full URL
  if (trimmedUrl.startsWith('/in/') || trimmedUrl.startsWith('in/')) {
    const path = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
    return `https://linkedin.com${path}`;
  }

  // If it doesn't contain linkedin.com, assume it's a username and construct the URL
  if (!trimmedUrl.includes('linkedin.com')) {
    return `https://linkedin.com/in/${trimmedUrl}`;
  }

  // Default case: add https:// if missing
  return `https://${trimmedUrl}`;
};

interface SearchResultsProps {
  results: Prospect[];
  onUpdateResults?: (updatedResults: Prospect[]) => void;
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

// Component to render email with interactive styling
const EmailCell = ({
  email,
  prospectKey,
  clickedEmails,
  copiedEmails,
  onEmailClick
}: {
  email: string;
  prospectKey: string;
  clickedEmails: Record<string, boolean>;
  copiedEmails: Record<string, boolean>;
  onEmailClick: (prospectKey: string, email: string) => void;
}) => {
  if (!email) return null;

  const isClicked = clickedEmails[prospectKey];

  return (
    <div className="relative">
      <span
        onClick={(e) => {
          e.preventDefault();
          onEmailClick(prospectKey, email);
        }}
        className={`hover:underline cursor-pointer transition-colors ${
          isClicked ? 'text-blue-800' : 'text-blue-600'
        }`}
      >
        {email}
      </span>
      {copiedEmails[prospectKey] && (
        <div className="absolute -top-8 left-0 bg-green-50 text-green-700 text-xs py-1 px-2 rounded flex items-center gap-1 shadow-sm animate-fade-in z-10">
          <Check size={12} />
          <span>Copied!</span>
        </div>
      )}
    </div>
  );
};

// Component to render a single phone number with reveal functionality
const PhoneNumberCell = ({
  phone,
  prospectKey,
  phoneIndex,
  revealedPhones,
  justCopied,
  onPhoneClick
}: {
  phone: string;
  prospectKey: string;
  phoneIndex: number;
  revealedPhones: Record<string, boolean>;
  justCopied: Record<string, boolean>;
  onPhoneClick: (prospectKey: string, phoneIndex: number, phone: string) => void;
}) => {
  if (!phone) return null;
  
  const phoneKey = `${prospectKey}-${phoneIndex}`;
  
  return (
    <div className="relative mb-1">
      <button
        onClick={() => onPhoneClick(prospectKey, phoneIndex, phone)}
        className={`text-left font-mono text-sm transition-colors ${revealedPhones[phoneKey] ? 'text-blue-800' : 'text-blue-600 hover:text-blue-800 cursor-pointer underline decoration-dashed underline-offset-4'}`}
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

export const SearchResults = ({ results, onUpdateResults }: SearchResultsProps) => {
  const { toast } = useToast();
  const [copiedProspect, setCopiedProspect] = useState<string | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [justCopied, setJustCopied] = useState<Record<string, boolean>>({});
  const [clickedEmails, setClickedEmails] = useState<Record<string, boolean>>({});
  const [copiedEmails, setCopiedEmails] = useState<Record<string, boolean>>({});
  
  // Edit and Delete dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  const copyProspectDetails = (prospect: Prospect) => {
    const phoneNumbers = [
      prospect.phone,
      prospect.phone2,
      prospect.phone3,
      prospect.phone4
    ].filter(Boolean).join(', ');
    
    const text = `Company: ${prospect.company}
Name: ${prospect.name}
Designation: ${prospect.designation || 'N/A'}
Email: ${prospect.email || 'N/A'}
Phone: ${phoneNumbers || 'N/A'}
LinkedIn: ${prospect.linkedin || 'N/A'}
Location: ${prospect.location || 'N/A'}`;
    
    // Create a unique key for this prospect based on name and company
    const prospectKey = `${prospect.name}-${prospect.company}`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedProspect(prospectKey);
      setTimeout(() => setCopiedProspect(null), 2000);
    }).catch((error) => {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
      console.error("Copy failed:", error);
    });
  };

  const handleEmailClick = (prospectKey: string, email: string) => {
    // Mark email as clicked to change color
    setClickedEmails(prev => ({
      ...prev,
      [prospectKey]: true
    }));

    // Copy email to clipboard
    navigator.clipboard.writeText(email).then(() => {
      setCopiedEmails(prev => ({
        ...prev,
        [prospectKey]: true
      }));

      // Clear notification after 2 seconds
      setTimeout(() => {
        setCopiedEmails(prev => ({
          ...prev,
          [prospectKey]: false
        }));
      }, 2000);
    }).catch((error) => {
      toast({
        title: "Failed to copy email",
        description: "Please try again.",
        variant: "destructive",
      });
      console.error("Copy email failed:", error);
    });
  };

  const handlePhoneClick = (prospectKey: string, phoneIndex: number, phone: string) => {
    const phoneKey = `${prospectKey}-${phoneIndex}`;

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

  // Edit and Delete handlers
  const handleEditClick = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setDeleteDialogOpen(true);
  };

  const handleProspectUpdate = (updatedProspect: Prospect) => {
    const updatedResults = results.map(prospect =>
      prospect.id === updatedProspect.id ? updatedProspect : prospect
    );
    onUpdateResults?.(updatedResults);
  };

  const handleProspectDelete = (deletedProspectId: number) => {
    const updatedResults = results.filter(prospect => prospect.id !== deletedProspectId);
    onUpdateResults?.(updatedResults);
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
                <TableHead><span className="inline-flex items-center gap-1"><Building2 size={16}/> Company</span></TableHead>
                <TableHead><span className="inline-flex items-center gap-1"><User size={16}/> Name</span></TableHead>
                <TableHead><span className="inline-flex items-center gap-1"><Briefcase size={16}/> Designation</span></TableHead>
                <TableHead><span className="inline-flex items-center gap-1"><Mail size={16}/> Email</span></TableHead>
                <TableHead><span className="inline-flex items-center gap-1"><Phone size={16}/> Phone Numbers</span></TableHead>
                <TableHead><span className="inline-flex items-center gap-1"><Linkedin size={16}/> LinkedIn</span></TableHead>
                <TableHead><span className="inline-flex items-center gap-1"><MapPin size={16}/> Location</span></TableHead>
                <TableHead className="w-20">Copy</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((prospect, index) => {
                // Create a unique key for this prospect based on name and company
                const prospectKey = `${prospect.name}-${prospect.company}`;
                
                return (
                  <TableRow key={prospectKey}>
                    <TableCell className="font-medium">{prospect.company}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <User size={20} style={{ color: stringToColor(prospect.name) }} />
                      {prospect.name}
                    </TableCell>
                    <TableCell>{prospect.designation || <span className="text-gray-400 text-sm">N/A</span>}</TableCell>
                    <TableCell>
                      <EmailCell
                        email={prospect.email}
                        prospectKey={prospectKey}
                        clickedEmails={clickedEmails}
                        copiedEmails={copiedEmails}
                        onEmailClick={handleEmailClick}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-1">
                            <PhoneNumberCell
                              phone={prospect.phone}
                              prospectKey={prospectKey}
                              phoneIndex={1}
                              revealedPhones={revealedPhones}
                              justCopied={justCopied}
                              onPhoneClick={handlePhoneClick}
                            />
                            <PhoneNumberCell
                              phone={prospect.phone2 || ""}
                              prospectKey={prospectKey}
                              phoneIndex={2}
                              revealedPhones={revealedPhones}
                              justCopied={justCopied}
                              onPhoneClick={handlePhoneClick}
                            />
                            <PhoneNumberCell
                              phone={prospect.phone3 || ""}
                              prospectKey={prospectKey}
                              phoneIndex={3}
                              revealedPhones={revealedPhones}
                              justCopied={justCopied}
                              onPhoneClick={handlePhoneClick}
                            />
                            <PhoneNumberCell
                              phone={prospect.phone4 || ""}
                              prospectKey={prospectKey}
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
                      {prospect.linkedin ? (
                        <a
                          href={formatLinkedInUrl(prospect.linkedin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center"
                        >
                          <Linkedin size={16} className="mr-1" />
                          Profile
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No LinkedIn</span>
                      )}
                    </TableCell>
                    <TableCell>{prospect.location}</TableCell>
                    <TableCell>
                      <div className="relative">
                        <Button
                          onClick={() => copyProspectDetails(prospect)}
                          className="vibrant-copy-btn bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 text-xs h-8 px-3 rounded-md font-semibold shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center gap-1"
                        >
                          📋 Copy
                        </Button>
                        {copiedProspect === prospectKey && (
                          <div className="absolute -top-8 right-0 bg-green-50 text-green-700 text-xs py-1 px-2 rounded flex items-center gap-1 shadow-sm animate-fade-in z-10">
                            <Check size={12} />
                            <span>Copied!</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(prospect)}
                              className="h-8 w-8 p-0 hover:bg-blue-50"
                            >
                              <Edit2 size={14} className="text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit prospect</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(prospect)}
                              className="h-8 w-8 p-0 hover:bg-red-50"
                            >
                              <Trash2 size={14} className="text-red-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete prospect</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      {/* Edit Dialog */}
      <EditProspectDialog
        prospect={selectedProspect}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedProspect(null);
        }}
        onUpdate={handleProspectUpdate}
      />
      
      {/* Delete Dialog */}
      <DeleteProspectDialog
        prospect={selectedProspect}
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedProspect(null);
        }}
        onDelete={handleProspectDelete}
      />
    </TooltipProvider>
  );
};
