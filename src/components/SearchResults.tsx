
import React, { useState } from "react";
import { Prospect } from "@/data/prospects";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useDisposition } from "@/contexts/DispositionContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Linkedin, User, Building2, Mail, Phone, MapPin, Briefcase, Check, Edit2, Trash2, ChevronUp, ChevronDown, X, MessageSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditProspectDialog } from "./EditProspectDialog";
import { DeleteProspectDialog } from "./DeleteProspectDialog";
import { DispositionEntry } from "./DispositionEntry";
import { DispositionHistory } from "./DispositionHistory";

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
  prospectId,
  phoneIndex,
  revealedPhones,
  justCopied,
  onPhoneClick
}: {
  phone: string;
  prospectKey: string;
  prospectId: number;
  phoneIndex: number;
  revealedPhones: Record<string, boolean>;
  justCopied: Record<string, boolean>;
  onPhoneClick: (prospectKey: string, prospectId: number, phoneIndex: number, phone: string) => void;
}) => {
  if (!phone) return null;

  const phoneKey = `${prospectKey}-${phoneIndex}`;

  return (
    <div className="relative mb-1">
      <button
        onClick={() => onPhoneClick(prospectKey, prospectId, phoneIndex, phone)}
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

type SortField = 'company' | 'name' | 'designation' | 'email' | 'location';
type SortDirection = 'asc' | 'desc';

export const SearchResults = ({ results, onUpdateResults }: SearchResultsProps) => {
  const { toast } = useToast();
  const { addRevealedPhone } = useDisposition();
  const [copiedProspect, setCopiedProspect] = useState<string | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [justCopied, setJustCopied] = useState<Record<string, boolean>>({});
  const [clickedEmails, setClickedEmails] = useState<Record<string, boolean>>({});
  const [copiedEmails, setCopiedEmails] = useState<Record<string, boolean>>({});
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Edit and Delete dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  
  // Disposition states
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [dispositionRefresh, setDispositionRefresh] = useState<Record<string, number>>({});

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

  const handlePhoneClick = (prospectKey: string, prospectId: number, phoneIndex: number, phone: string) => {
    const phoneKey = `${prospectKey}-${phoneIndex}`;

    // Reveal phone number
    setRevealedPhones(prev => ({
      ...prev,
      [phoneKey]: true
    }));

    // Track revealed phone for disposition requirement
    console.log('Tracking revealed phone:', { prospectId, phone });
    addRevealedPhone(prospectId, phone);

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

  // Sorting functionality
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearSort = () => {
    setSortField(null);
    setSortDirection('asc');
  };

  const getSortedResults = () => {
    if (!sortField) return results;

    return [...results].sort((a, b) => {
      let aValue = '';
      let bValue = '';

      switch (sortField) {
        case 'company':
          aValue = a.company || '';
          bValue = b.company || '';
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'designation':
          aValue = a.designation || '';
          bValue = b.designation || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'location':
          aValue = a.location || '';
          bValue = b.location || '';
          break;
        default:
          return 0;
      }

      // Handle null/empty values - they should go to the end
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1; // a goes to end
      if (!bValue) return -1; // b goes to end

      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const getFieldDisplayName = (field: SortField) => {
    switch (field) {
      case 'company': return 'Company';
      case 'name': return 'Name';
      case 'designation': return 'Designation';
      case 'email': return 'Email';
      case 'location': return 'Location';
      default: return '';
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp size={14} className="ml-1" /> : 
      <ChevronDown size={14} className="ml-1" />;
  };

  const getSortHeaderClass = (field: SortField) => {
    return sortField === field ? 'font-bold text-primary' : 'font-medium';
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
      <div className="space-y-4">
        {/* Sort Badge */}
        {sortField && (
          <div className="flex items-center gap-2">
            <div 
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={clearSort}
            >
              <span>Sorted by: {getFieldDisplayName(sortField)}</span>
              {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <X size={14} className="hover:bg-primary/20 rounded-full p-0.5" />
            </div>
          </div>
        )}
        
        <Card className="overflow-hidden">
          <div
            className="overflow-x-auto select-none"
            onContextMenu={e => e.preventDefault()}
          >
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className={`cursor-pointer hover:bg-muted/50 ${getSortHeaderClass('company')}`}
                  onClick={() => handleSort('company')}
                >
                  <span className="inline-flex items-center gap-1">
                    <Building2 size={16}/> Company
                    {getSortIcon('company')}
                  </span>
                </TableHead>
                <TableHead 
                  className={`cursor-pointer hover:bg-muted/50 ${getSortHeaderClass('name')}`}
                  onClick={() => handleSort('name')}
                >
                  <span className="inline-flex items-center gap-1">
                    <User size={16}/> Name
                    {getSortIcon('name')}
                  </span>
                </TableHead>
                <TableHead 
                  className={`cursor-pointer hover:bg-muted/50 ${getSortHeaderClass('designation')}`}
                  onClick={() => handleSort('designation')}
                >
                  <span className="inline-flex items-center gap-1">
                    <Briefcase size={16}/> Designation
                    {getSortIcon('designation')}
                  </span>
                </TableHead>
                <TableHead 
                  className={`cursor-pointer hover:bg-muted/50 ${getSortHeaderClass('email')}`}
                  onClick={() => handleSort('email')}
                >
                  <span className="inline-flex items-center gap-1">
                    <Mail size={16}/> Email
                    {getSortIcon('email')}
                  </span>
                </TableHead>
                <TableHead><span className="inline-flex items-center gap-1"><Phone size={16}/> Phone Numbers</span></TableHead>
                <TableHead><span className="inline-flex items-center gap-1"><Linkedin size={16}/> LinkedIn</span></TableHead>
                <TableHead 
                  className={`cursor-pointer hover:bg-muted/50 ${getSortHeaderClass('location')}`}
                  onClick={() => handleSort('location')}
                >
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={16}/> Location
                    {getSortIcon('location')}
                  </span>
                </TableHead>
                <TableHead className="w-20">Copy</TableHead>
                <TableHead className="w-32">Disposition</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedResults().map((prospect, index) => {
                // Create a unique key for this prospect based on name and company
                const prospectKey = `${prospect.name}-${prospect.company}`;
                const isExpanded = expandedRows[`${prospect.id}`];
                
                return (
                  <React.Fragment key={prospectKey}>
                    <TableRow>
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
                                prospectId={prospect.id}
                                phoneIndex={1}
                                revealedPhones={revealedPhones}
                                justCopied={justCopied}
                                onPhoneClick={handlePhoneClick}
                              />
                              <PhoneNumberCell
                                phone={prospect.phone2 || ""}
                                prospectKey={prospectKey}
                                prospectId={prospect.id}
                                phoneIndex={2}
                                revealedPhones={revealedPhones}
                                justCopied={justCopied}
                                onPhoneClick={handlePhoneClick}
                              />
                              <PhoneNumberCell
                                phone={prospect.phone3 || ""}
                                prospectKey={prospectKey}
                                prospectId={prospect.id}
                                phoneIndex={3}
                                revealedPhones={revealedPhones}
                                justCopied={justCopied}
                                onPhoneClick={handlePhoneClick}
                              />
                              <PhoneNumberCell
                                phone={prospect.phone4 || ""}
                                prospectKey={prospectKey}
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const key = `${prospect.id}`;
                                setExpandedRows(prev => ({
                                  ...prev,
                                  [key]: !prev[key]
                                }));
                              }}
                              className={`h-8 w-8 p-0 transition-colors ${
                                expandedRows[`${prospect.id}`] ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50'
                              }`}
                            >
                              <MessageSquare size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add disposition</p>
                          </TooltipContent>
                        </Tooltip>
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
                    
                    {/* Expanded Row for Disposition */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
                          <div className="px-6 py-4 bg-gray-50/50 border-t">
                            <div className="max-w-4xl">
                              <DispositionHistory 
                                prospectId={prospect.id} 
                                refreshTrigger={dispositionRefresh[`${prospect.id}`]} 
                              />
                              <DispositionEntry 
                                prospectId={prospect.id}
                                onDispositionAdded={() => {
                                  setDispositionRefresh(prev => ({
                                    ...prev,
                                    [`${prospect.id}`]: (prev[`${prospect.id}`] || 0) + 1
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      </div>
      
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
