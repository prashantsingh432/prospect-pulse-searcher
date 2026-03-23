import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, User, MapPin, Briefcase, Building, Mail, Phone, PhoneCall, CheckCircle, Star, Share, Sparkles, Wifi, WifiOff, Search, Filter } from "lucide-react";
import RowContextMenu from "@/components/RowContextMenu";
import { enrichProspect } from "@/services/lushaService";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast as sonnerToast } from "sonner";

interface RtneRequest {
  id: string;
  project_name: string;
  user_id: string;
  user_name: string;
  linkedin_url: string;
  full_name?: string;
  city?: string;
  job_title?: string;
  company_name?: string;
  email_address?: string;
  primary_phone?: string;
  phone2?: string;
  phone3?: string;
  phone4?: string;
  status: string;
  row_number: number;
  created_at: string;
  mre_requested?: boolean;
}

export const RtnpProjectView: React.FC = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RtneRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const saveTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    rowId: string;
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ rowId: '', isOpen: false, position: { x: 0, y: 0 } });
  
  // Clipboard for copy/paste
  const [clipboardRow, setClipboardRow] = useState<RtneRequest | null>(null);
  const [cutRowId, setCutRowId] = useState<string | null>(null);
  
  // Lusha enrichment state
  const [enrichingRows, setEnrichingRows] = useState<{[key: string]: 'phone' | 'email' | null}>({});

  // Filter state
  const [filterUserName, setFilterUserName] = useState('');
  const [filterProspectName, setFilterProspectName] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Track which rows are "new" (pending and not yet acknowledged by provider)
  const [acknowledgedRows, setAcknowledgedRows] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`rtnp-acknowledged-${projectName}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const isRtnpUser = user?.email === 'realtimenumberprovider@amplior.com' || isAdmin();
  const decodedProjectName = decodeURIComponent(projectName || '');

  // Load project requests - memoized for real-time updates
  const loadProjectRequests = useCallback(async () => {
    try {
      // Only load MRE-requested items - these are explicitly sent to RTNP
      const { data, error } = await supabase
        .from('rtne_requests')
        .select('*')
        .eq('project_name', decodedProjectName)
        .eq('mre_requested', true)  // Only show MRE-requested items
        .order('row_number', { ascending: true });

      if (error) throw error;

      setRequests(data || []);
    } catch (error: any) {
      console.error("Error loading requests:", error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    }
  }, [decodedProjectName, toast]);

  useEffect(() => {
    if (!isRtnpUser || !projectName) {
      navigate("/dashboard");
      return;
    }

    // Initial load
    setIsLoading(true);
    loadProjectRequests().finally(() => setIsLoading(false));

    // Set up real-time subscription for project-specific updates
    const channel = supabase
      .channel(`rtnp-project-${decodedProjectName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rtne_requests',
          filter: `project_name=eq.${decodedProjectName}`,
        },
        (payload) => {
          console.log('[RTNP Project] Real-time update:', payload.eventType, payload);
          
          const newRecord = payload.new as RtneRequest;
          const oldRecord = payload.old as RtneRequest;
          
          if (payload.eventType === 'INSERT' && newRecord?.mre_requested) {
            sonnerToast.info(`New request from ${newRecord.user_name}`);
            loadProjectRequests();
          } else if (payload.eventType === 'UPDATE') {
            // Update the specific record in local state for instant feedback
            setRequests(prev => prev.map(req => 
              req.id === newRecord.id ? { ...req, ...newRecord } : req
            ));
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(req => req.id !== oldRecord?.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[RTNP Project] Realtime status:', status);
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[RTNP Project] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [isRtnpUser, projectName, navigate, decodedProjectName, loadProjectRequests]);

  // Function to clean phone numbers - removes +91, 91, spaces, dashes, etc.
  const cleanPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // Remove all non-digit characters first
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 91 and has more than 10 digits, remove the 91
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    
    // If starts with 0 and has 11 digits, remove the leading 0
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    
    // Return only first 10 digits if longer
    return cleaned.substring(0, 10);
  };

  const handleFieldChange = (requestId: string, field: string, value: string) => {
    // Clean phone numbers automatically
    let cleanedValue = value;
    if (field === 'primary_phone' || field === 'phone2' || field === 'phone3' || field === 'phone4') {
      cleanedValue = cleanPhoneNumber(value);
    }

    // Update local state immediately with cleaned value
    setRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, [field]: cleanedValue } : req
    ));

    // Clear existing timeout
    if (saveTimeoutRef.current[`${requestId}-${field}`]) {
      clearTimeout(saveTimeoutRef.current[`${requestId}-${field}`]);
    }

    // Set new timeout to save after 1 second
    saveTimeoutRef.current[`${requestId}-${field}`] = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('rtne_requests')
          .update({ [field]: cleanedValue })
          .eq('id', requestId);

        if (error) throw error;
      } catch (error: any) {
        console.error("Error saving field:", error);
      }
    }, 1000);
  };

  const markAsCompleted = async (requestId: string) => {
    try {
      // Acknowledge the row (remove highlight)
      setAcknowledgedRows(prev => new Set([...prev, requestId]));

      const { error } = await supabase
        .from('rtne_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user?.id
        })
        .eq('id', requestId);

      if (error) throw error;

      // 🔥 CRITICAL: Sync completed data to prospects table for dashboard searches
      const request = requests.find(r => r.id === requestId);
      if (request?.linkedin_url) {
        const normalizedUrl = request.linkedin_url.trim().toLowerCase().replace(/\/+$/, '');
        const username = normalizedUrl.split('/in/')[1]?.split('/')[0];
        const prospectData: any = {
          full_name: request.full_name || 'Unknown',
          company_name: request.company_name || 'Unknown',
          prospect_linkedin: normalizedUrl,
          prospect_city: request.city || null,
          prospect_designation: request.job_title || null,
          prospect_number: request.primary_phone || null,
          prospect_number2: request.phone2 || null,
          prospect_number3: request.phone3 || null,
          prospect_number4: request.phone4 || null,
          prospect_email: request.email_address || null,
        };

        const { data: existingProspect } = await supabase
          .from('prospects')
          .select('id')
          .ilike('prospect_linkedin', `%${username || normalizedUrl}%`)
          .maybeSingle();

        if (existingProspect) {
          await supabase
            .from('prospects')
            .update(prospectData)
            .eq('id', existingProspect.id);
          console.log('✅ [RTNP] Updated prospect in database');
        } else {
          await supabase
            .from('prospects')
            .insert([prospectData]);
          console.log('✅ [RTNP] Inserted new prospect in database');
        }
      }

      toast({
        title: "Success",
        description: "Request marked as completed",
      });

      loadProjectRequests();
    } catch (error: any) {
      console.error("Error marking as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark as completed",
        variant: "destructive",
      });
    }
  };

  const undoCompleted = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('rtne_requests')
        .update({
          status: 'pending',
          completed_at: null,
          completed_by: null
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Undone",
        description: "Request moved back to pending — you can now edit and re-submit",
      });

      loadProjectRequests();
    } catch (error: any) {
      console.error("Error undoing completion:", error);
      toast({
        title: "Error",
        description: "Failed to undo completion",
        variant: "destructive",
      });
    }
  };

  // Context menu handlers
  const handleRowRightClick = (e: React.MouseEvent, requestId: string) => {
    e.preventDefault();
    setContextMenu({
      rowId: requestId,
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  const insertRowAbove = () => {
    toast({
      title: "Info",
      description: "Insert row feature coming soon for RTNP view",
    });
  };

  const insertRowBelow = () => {
    toast({
      title: "Info",
      description: "Insert row feature coming soon for RTNP view",
    });
  };

  const deleteRow = async () => {
    const request = requests.find(r => r.id === contextMenu.rowId);
    if (request) {
      try {
        const { error } = await supabase
          .from('rtne_requests')
          .delete()
          .eq('id', request.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Row deleted successfully",
        });

        loadProjectRequests();
      } catch (error: any) {
        console.error('Error deleting row:', error);
        toast({
          title: "Error",
          description: "Failed to delete row",
          variant: "destructive",
        });
      }
    }
  };

  const clearRow = async () => {
    const request = requests.find(r => r.id === contextMenu.rowId);
    if (request) {
      try {
        const { error } = await supabase
          .from('rtne_requests')
          .update({
            full_name: '',
            city: '',
            job_title: '',
            company_name: '',
            email_address: '',
            primary_phone: '',
            phone2: '',
            phone3: '',
            phone4: ''
          })
          .eq('id', request.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Row cleared successfully",
        });

        loadProjectRequests();
      } catch (error: any) {
        console.error('Error clearing row:', error);
        toast({
          title: "Error",
          description: "Failed to clear row",
          variant: "destructive",
        });
      }
    }
  };

  const copyRow = () => {
    const targetRow = requests.find(r => r.id === contextMenu.rowId);
    if (targetRow) {
      setClipboardRow(targetRow);
      setCutRowId(null);
      toast({
        title: "Copied",
        description: "Row copied to clipboard",
      });
    }
  };

  const cutRow = () => {
    const targetRow = requests.find(r => r.id === contextMenu.rowId);
    if (targetRow) {
      setClipboardRow(targetRow);
      setCutRowId(targetRow.id);
      toast({
        title: "Cut",
        description: "Row cut to clipboard",
      });
    }
  };

  const pasteRow = async () => {
    if (clipboardRow) {
      const targetRequest = requests.find(r => r.id === contextMenu.rowId);
      if (targetRequest) {
        try {
          const { error } = await supabase
            .from('rtne_requests')
            .update({
              full_name: clipboardRow.full_name,
              city: clipboardRow.city,
              job_title: clipboardRow.job_title,
              company_name: clipboardRow.company_name,
              email_address: clipboardRow.email_address,
              primary_phone: clipboardRow.primary_phone,
              phone2: clipboardRow.phone2,
              phone3: clipboardRow.phone3,
              phone4: clipboardRow.phone4
            })
            .eq('id', targetRequest.id);

          if (error) throw error;

          // If it was a cut operation, clear the source row
          if (cutRowId) {
            await supabase
              .from('rtne_requests')
              .update({
                full_name: '',
                city: '',
                job_title: '',
                company_name: '',
                email_address: '',
                primary_phone: '',
                phone2: '',
                phone3: '',
                phone4: ''
              })
              .eq('id', cutRowId);
            setCutRowId(null);
          }

          toast({
            title: "Success",
            description: "Row pasted successfully",
          });

          loadProjectRequests();
        } catch (error: any) {
          console.error('Error pasting row:', error);
          toast({
            title: "Error",
            description: "Failed to paste row",
            variant: "destructive",
          });
        }
      }
    }
  };

  const isRowCut = (requestId: string) => cutRowId === requestId;

  const handleLushaFetch = async (requestId: string, category: 'PHONE_ONLY' | 'EMAIL_ONLY') => {
    const request = requests.find(r => r.id === requestId);
    if (!request || !request.linkedin_url) {
      toast({
        title: "Error",
        description: "LinkedIn URL is required for enrichment",
        variant: "destructive",
      });
      return;
    }

    setEnrichingRows(prev => ({ ...prev, [requestId]: category === 'PHONE_ONLY' ? 'phone' : 'email' }));

    try {
      const result = await enrichProspect(request.linkedin_url, category);

      if (result.success) {
        // Update the local state with the fetched data
        if (category === 'PHONE_ONLY' && result.phone) {
          handleFieldChange(requestId, 'primary_phone', result.phone);
          toast({
            title: "Success",
            description: `Phone number fetched: ${result.phone}`,
          });
        } else if (category === 'EMAIL_ONLY' && result.email) {
          handleFieldChange(requestId, 'email_address', result.email);
          toast({
            title: "Success",
            description: `Email fetched: ${result.email}`,
          });
        } else {
          toast({
            title: "No Data",
            description: result.message || `No ${category === 'PHONE_ONLY' ? 'phone' : 'email'} found`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Enrichment Failed",
          description: result.message || result.error || "Failed to fetch data",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Lusha fetch error:", error);
      toast({
        title: "Error",
        description: "An error occurred during enrichment",
        variant: "destructive",
      });
    } finally {
      setEnrichingRows(prev => ({ ...prev, [requestId]: null }));
    }
  };

  // Save acknowledged rows to localStorage
  useEffect(() => {
    localStorage.setItem(`rtnp-acknowledged-${projectName}`, JSON.stringify([...acknowledgedRows]));
  }, [acknowledgedRows, projectName]);

  if (!isRtnpUser) {
    return null;
  }

  const isNewRow = (request: RtneRequest) => {
    return request.status === 'pending' && !acknowledgedRows.has(request.id);
  };


  const pendingRequests = requests.filter(r => r.status === 'pending');
  const completedRequests = requests.filter(r => r.status === 'completed');

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (filterUserName && !r.user_name.toLowerCase().includes(filterUserName.toLowerCase())) return false;
    if (filterProspectName && !(r.full_name || '').toLowerCase().includes(filterProspectName.toLowerCase())) return false;
    return true;
  });

  // Sort: new pending rows first (highlighted), then other pending, then completed
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const aNew = isNewRow(a) ? 0 : 1;
    const bNew = isNewRow(b) ? 0 : 1;
    if (aNew !== bNew) return aNew - bNew;
    const aStatus = a.status === 'pending' ? 0 : 1;
    const bStatus = b.status === 'pending' ? 0 : 1;
    if (aStatus !== bStatus) return aStatus - bStatus;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      {/* LinkedIn-style Header */}
      <header className="bg-white shadow-sm z-20 sticky top-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-4xl text-[#0A66C2]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <nav className="hidden md:flex items-center text-sm font-medium space-x-2 text-gray-600">
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">File</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Edit</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">View</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Insert</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Format</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Data</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Tools</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => navigate("/rtnp")}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#0A66C2] hover:bg-blue-800">
                <Share className="h-4 w-4" />
                <span>Share</span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold border border-blue-200">
                  {user?.email?.charAt(0).toUpperCase() || 'R'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between h-12 border-t border-gray-200">
            <div className="flex items-center text-sm">
              <h1 className="font-semibold text-lg text-gray-800 pr-3">{decodeURIComponent(projectName || '')} - Real-Time Numbers</h1>
              <Star className="h-5 w-5 text-gray-500 hover:text-yellow-500 cursor-pointer" />
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {isRealtimeConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Connecting...
                </Badge>
              )}
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                {pendingRequests.length} Pending
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                {completedRequests.length} Completed
              </span>
            </div>
            {/* Filter Bar */}
            <div className="flex items-center gap-2 mt-1 mb-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
              >
                <Filter className="h-3 w-3" />
                Filters
              </button>
              {showFilters && (
                <>
                  <div className="flex items-center gap-1">
                    <Search className="h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Filter by user name..."
                      value={filterUserName}
                      onChange={(e) => setFilterUserName(e.target.value)}
                      className="h-7 w-40 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Search className="h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Filter by prospect name..."
                      value={filterProspectName}
                      onChange={(e) => setFilterProspectName(e.target.value)}
                      className="h-7 w-40 text-xs"
                    />
                  </div>
                  {(filterUserName || filterProspectName) && (
                    <button
                      onClick={() => { setFilterUserName(''); setFilterProspectName(''); }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spreadsheet Table */}
      <main className="max-w-full mx-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <span className="ml-2 text-gray-600">Loading requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-gray-500">No requests for this project</p>
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 w-12 sticky left-0 z-10 text-gray-500">#</th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[120px]">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-600" />
                      User
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[100px]">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-gray-600" />
                      Action
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[300px]">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn Profile URL
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center"><Phone className="h-4 w-4 mr-2 text-gray-600" />Phone 1</div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center"><PhoneCall className="h-4 w-4 mr-2 text-gray-600" />Phone 2</div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center"><PhoneCall className="h-4 w-4 mr-2 text-gray-600" />Phone 3</div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center"><PhoneCall className="h-4 w-4 mr-2 text-gray-600" />Phone 4</div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[250px]">
                    <div className="flex items-center"><Mail className="h-4 w-4 mr-2 text-gray-600" />Email Address</div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center"><User className="h-4 w-4 mr-2 text-gray-600" />Full Name</div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[150px]">
                    <div className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-gray-600" />City</div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-gray-600" />Job Title</div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center"><Building className="h-4 w-4 mr-2 text-gray-600" />Company Name</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRequests.map((request) => {
                  const rowIsNew = isNewRow(request);
                  return (
                  <tr 
                    key={request.id} 
                    className={`group hover:bg-blue-50/50 transition-colors ${
                      rowIsNew ? 'bg-amber-100 border-l-4 border-l-amber-500 animate-pulse' : ''
                    } ${
                      request.status === 'completed' ? 'bg-green-50/30' : ''
                    } ${isRowCut(request.id) ? 'opacity-50 bg-red-50' : ''}`}
                  >
                    {/* # */}
                    <td 
                      className={`px-3 py-2 border-b border-r border-gray-300 text-sm sticky left-0 group-hover:bg-blue-50/50 text-center text-gray-500 z-10 cursor-context-menu select-none ${rowIsNew ? 'bg-amber-100' : 'bg-white'}`}
                      onContextMenu={(e) => handleRowRightClick(e, request.id)}
                    >
                      {request.row_number}
                      {rowIsNew && <span className="ml-1 inline-block w-2 h-2 bg-amber-500 rounded-full" />}
                    </td>
                    {/* User */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-medium">{request.user_name}</span>
                      </div>
                    </td>
                    {/* Action / Done - moved here right after User */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm text-center">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => markAsCompleted(request.id)}
                          className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 mx-auto ${
                            rowIsNew 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Done
                        </button>
                      )}
                      {request.status === 'completed' && (
                        <button
                          onClick={() => undoCompleted(request.id)}
                          className="px-3 py-1 rounded text-xs font-medium flex items-center gap-1 mx-auto bg-gray-200 hover:bg-orange-100 text-gray-700 hover:text-orange-700 transition-colors"
                          title="Undo — move back to pending to edit numbers"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Undo
                        </button>
                      )}
                    </td>
                    {/* LinkedIn URL */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={request.linkedin_url}
                          readOnly
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 cursor-not-allowed"
                        />
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleLushaFetch(request.id, 'PHONE_ONLY')} disabled={request.status === 'completed' || enrichingRows[request.id] === 'phone'} className="h-8 px-2 text-xs" title="Fetch Phone with Lusha">
                            {enrichingRows[request.id] === 'phone' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Phone className="h-3 w-3" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleLushaFetch(request.id, 'EMAIL_ONLY')} disabled={request.status === 'completed' || enrichingRows[request.id] === 'email'} className="h-8 px-2 text-xs" title="Fetch Email with Lusha">
                            {enrichingRows[request.id] === 'email' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </td>
                    {/* Phone 1 */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input type="text" value={request.primary_phone || ''} onChange={(e) => handleFieldChange(request.id, 'primary_phone', e.target.value)} placeholder="Enter phone 1" disabled={request.status === 'completed'} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
                    </td>
                    {/* Phone 2 */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input type="text" value={request.phone2 || ''} onChange={(e) => handleFieldChange(request.id, 'phone2', e.target.value)} placeholder="Enter phone 2" disabled={request.status === 'completed'} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
                    </td>
                    {/* Phone 3 */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input type="text" value={request.phone3 || ''} onChange={(e) => handleFieldChange(request.id, 'phone3', e.target.value)} placeholder="Enter phone 3" disabled={request.status === 'completed'} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
                    </td>
                    {/* Phone 4 */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input type="text" value={request.phone4 || ''} onChange={(e) => handleFieldChange(request.id, 'phone4', e.target.value)} placeholder="Enter phone 4" disabled={request.status === 'completed'} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
                    </td>
                    {/* Email */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input type="text" value={request.email_address || ''} onChange={(e) => handleFieldChange(request.id, 'email_address', e.target.value)} placeholder="Enter email" disabled={request.status === 'completed'} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
                    </td>
                    {/* Full Name */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input type="text" value={request.full_name || ''} onChange={(e) => handleFieldChange(request.id, 'full_name', e.target.value)} placeholder="Enter name" disabled={request.status === 'completed'} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
                    </td>
                    {/* City */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input type="text" value={request.city || ''} onChange={(e) => handleFieldChange(request.id, 'city', e.target.value)} placeholder="Enter city" disabled={request.status === 'completed'} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
                    </td>
                    {/* Job Title */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input type="text" value={request.job_title || ''} onChange={(e) => handleFieldChange(request.id, 'job_title', e.target.value)} placeholder="Enter job title" disabled={request.status === 'completed'} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
                    </td>
                    {/* Company Name */}
                    <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                      <input type="text" value={request.company_name || ''} onChange={(e) => handleFieldChange(request.id, 'company_name', e.target.value)} placeholder="Enter company" disabled={request.status === 'completed'} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Context Menu */}
      <RowContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onInsertRowAbove={insertRowAbove}
        onInsertRowBelow={insertRowBelow}
        onDeleteRow={deleteRow}
        onClearRow={clearRow}
        onCopyRow={copyRow}
        onCutRow={cutRow}
        onPasteRow={pasteRow}
        rowNumber={parseInt(requests.find(r => r.id === contextMenu.rowId)?.row_number?.toString() || '0')}
        hasClipboard={clipboardRow !== null}
      />
    </div>
  );
};
