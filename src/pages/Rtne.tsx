import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { validateLinkedInUrl } from "@/utils/linkedInUtils";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, Star, User, MapPin, Briefcase, Building, Mail, Phone, PhoneCall, RotateCcw, RotateCw, Printer, Bold, Italic, Underline, Link, MessageSquare, Play, Share, ArrowLeft, HourglassIcon, Plus, AlertTriangle } from "lucide-react";
import RowContextMenu from "@/components/RowContextMenu";
import { enrichProspectByName, enrichProspect } from "@/services/lushaService";
import { toast } from "sonner";

interface RtneRow {
  id: number;
  prospect_linkedin: string;
  full_name?: string;
  company_name?: string;
  prospect_city?: string;
  prospect_number?: string;
  prospect_email?: string;
  prospect_number2?: string;
  prospect_number3?: string;
  prospect_number4?: string;
  prospect_designation?: string;
  status?: 'ready' | 'pending' | 'processing' | 'completed' | 'failed';
  supabaseId?: string; // Store the Supabase UUID for updates
}

const Rtne: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const nextIdRef = useRef(101); // Start from 101 for new rows
  const tableRef = useRef<HTMLDivElement>(null);

  // Generate 100 initial rows
  const generateInitialRows = (): RtneRow[] => {
    const initialRows: RtneRow[] = [];
    
    // Add 100 empty rows
    for (let i = 1; i <= 100; i++) {
      initialRows.push({
        id: i,
        prospect_linkedin: "",
        full_name: "",
        prospect_city: "",
        prospect_designation: "",
        company_name: "",
        prospect_email: "",
        prospect_number: "",
        prospect_number2: "",
        prospect_number3: "",
        prospect_number4: ""
      });
    }
    return initialRows;
  };

  const [rows, setRows] = useState<RtneRow[]>(generateInitialRows());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRowsCount, setNewRowsCount] = useState("100");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingRowsCount, setPendingRowsCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const saveTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  const enrichmentTriggeredRef = useRef<Set<number>>(new Set());
  const [enrichingRows, setEnrichingRows] = useState<Set<number>>(new Set());
  const [isBulkEnriching, setIsBulkEnriching] = useState(false);
  const [bulkEnrichProgress, setBulkEnrichProgress] = useState({ current: 0, total: 0 });
  
  // Cell selection and navigation state
  const [selectedCell, setSelectedCell] = useState<{rowId: number, field: keyof RtneRow} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{rowId: number, field: keyof RtneRow} | null>(null);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    rowId: number;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    rowId: 0
  });
  
  // Clipboard state for row operations
  const [clipboardRow, setClipboardRow] = useState<RtneRow | null>(null);
  const [clipboardOperation, setClipboardOperation] = useState<'copy' | 'cut' | null>(null);
  
  // Visual feedback for cut rows
  const isRowCut = (rowId: number) => {
    return clipboardOperation === 'cut' && clipboardRow?.id === rowId;
  };

  const projectName = user?.projectName || "Unknown Project";

  // Define field order for navigation
  const fieldOrder: (keyof RtneRow)[] = [
    'full_name',
    'company_name',
    'prospect_linkedin',
    'prospect_number',
    'prospect_number2',
    'prospect_number3',
    'prospect_number4',
    'prospect_email',
    'prospect_city',
    'prospect_designation'
  ];

  // Helper function to create empty row
  const makeEmptyRow = useCallback((id: number): RtneRow => ({
    id,
    prospect_linkedin: "",
    full_name: "",
    prospect_city: "",
    prospect_designation: "",
    company_name: "",
    prospect_email: "",
    prospect_number: "",
    prospect_number2: "",
    prospect_number3: "",
    prospect_number4: ""
  }), []);

  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        // Load user's own RTNE requests
        const { data: rtneRequests, error } = await supabase
          .from('rtne_requests')
          .select('*')
          .eq('user_id', user?.id)
          .eq('project_name', projectName)
          .order('row_number', { ascending: true });

        if (error) throw error;

        if (rtneRequests && rtneRequests.length > 0) {
          // Map rtne_requests to RtneRow format
          const loadedRows: RtneRow[] = rtneRequests.map((request) => ({
            id: request.row_number,
            prospect_linkedin: request.linkedin_url || '',
            full_name: request.full_name || '',
            company_name: request.company_name || '',
            prospect_city: request.city || '',
            prospect_number: request.primary_phone || '',
            prospect_email: request.email_address || '',
            prospect_number2: '',
            prospect_number3: '',
            prospect_number4: '',
            prospect_designation: request.job_title || '',
            supabaseId: request.id // Store request ID for updates
          }));

          // Create a full 100-row array with loaded data in correct positions
          const fullRows: RtneRow[] = [];
          for (let i = 1; i <= 100; i++) {
            const existingRow = loadedRows.find(r => r.id === i);
            fullRows.push(existingRow || makeEmptyRow(i));
          }

          setRows(fullRows);
          nextIdRef.current = 101;
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();

    // Basic SEO for the page
    const title = "LinkedIn Prospects | RTNE";
    document.title = title;

    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Run Real-Time Email & Number (RTNE) enrichment for LinkedIn prospect profiles.');
    document.head.appendChild(meta);

    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    document.head.appendChild(link);
  }, [user?.id, projectName, makeEmptyRow]);

  const handleChange = async (rowId: number, field: keyof RtneRow, value: string) => {
    // Update local state immediately
    setRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));

    // Check if we should trigger enrichment (only for direct user input, not programmatic updates)
    const row = rows.find(r => r.id === rowId);
    if (row) {
      // Condition B: Full Name AND Company are both filled (RTNE Spreadsheet Smart Search)
      const shouldEnrichByName = 
        (field === 'full_name' || field === 'company_name') &&
        !enrichmentTriggeredRef.current.has(rowId);

      if (shouldEnrichByName) {
        // Get the current values (use the new value if it's the field being edited)
        const fullName = field === 'full_name' ? value : row.full_name;
        const companyName = field === 'company_name' ? value : row.company_name;

        // Only trigger if BOTH fields are filled
        if (fullName && companyName) {
          enrichmentTriggeredRef.current.add(rowId);
          setEnrichingRows(prev => new Set(prev).add(rowId));

          try {
            // Try phone enrichment first
            const phoneResult = await enrichProspectByName(
              fullName,
              companyName,
              "PHONE_ONLY"
            );

            if (phoneResult.success && phoneResult.phone) {
              setRows(prev => prev.map(r => 
                r.id === rowId ? { ...r, prospect_number: phoneResult.phone || '' } : r
              ));
              toast.success("Phone enriched!");
            }

            // Then try email enrichment
            const emailResult = await enrichProspectByName(
              fullName,
              companyName,
              "EMAIL_ONLY"
            );

            if (emailResult.success && emailResult.email) {
              setRows(prev => prev.map(r => 
                r.id === rowId ? { ...r, prospect_email: emailResult.email || '' } : r
              ));
              toast.success("Email enriched!");
            }

            // Update other fields if available
            if (phoneResult.success || emailResult.success) {
              const enrichedData: any = {};
              if (phoneResult.title) enrichedData.prospect_designation = phoneResult.title;
              if (emailResult.title) enrichedData.prospect_designation = emailResult.title;

              if (Object.keys(enrichedData).length > 0) {
                setRows(prev => prev.map(r => 
                  r.id === rowId ? { ...r, ...enrichedData } : r
                ));
              }
            }

            if (!phoneResult.success && !emailResult.success) {
              toast.error("No data found for this prospect");
              enrichmentTriggeredRef.current.delete(rowId);
            }
          } catch (error) {
            console.error("Enrichment error:", error);
            toast.error("Enrichment failed");
            enrichmentTriggeredRef.current.delete(rowId);
          } finally {
            setEnrichingRows(prev => {
              const newSet = new Set(prev);
              newSet.delete(rowId);
              return newSet;
            });
          }
        }
      }
    }

    // Debounce the Supabase save
    const cellKey = `${rowId}-${field}`;
    if (saveTimeoutRef.current[cellKey]) {
      clearTimeout(saveTimeoutRef.current[cellKey]);
    }

    saveTimeoutRef.current[cellKey] = setTimeout(async () => {
      const currentRow = rows.find(r => r.id === rowId);
      if (!currentRow) return;

      try {
        // Get the updated value from the field
        const updatedValue = field === 'prospect_linkedin' ? value :
                            field === 'full_name' ? value :
                            field === 'company_name' ? value :
                            field === 'prospect_city' ? value :
                            field === 'prospect_number' ? value :
                            field === 'prospect_email' ? value :
                            field === 'prospect_designation' ? value :
                            (currentRow[field] as string);

        // Map RtneRow fields to rtne_requests columns
        const requestData: any = {
          project_name: projectName,
          user_id: user?.id,
          user_name: user?.fullName || user?.email?.split('@')[0] || 'Unknown',
          linkedin_url: field === 'prospect_linkedin' ? value : currentRow.prospect_linkedin,
          full_name: field === 'full_name' ? value : currentRow.full_name,
          company_name: field === 'company_name' ? value : currentRow.company_name,
          city: field === 'prospect_city' ? value : currentRow.prospect_city,
          primary_phone: field === 'prospect_number' ? value : currentRow.prospect_number,
          email_address: field === 'prospect_email' ? value : currentRow.prospect_email,
          job_title: field === 'prospect_designation' ? value : currentRow.prospect_designation,
          row_number: rowId,
          status: 'pending',
          updated_at: new Date().toISOString()
        };

        // Check if row has a Supabase ID (existing record)
        if ((currentRow as any).supabaseId) {
          // Update existing record
          const { error } = await supabase
            .from('rtne_requests')
            .update(requestData)
            .eq('id', (currentRow as any).supabaseId);

          if (error) throw error;
        } else {
          // Insert new record only if there's actual data
          if (requestData.linkedin_url || requestData.full_name || requestData.company_name) {
            const { data, error } = await supabase
              .from('rtne_requests')
              .insert([requestData])
              .select()
              .single();

            if (error) throw error;

            // Store the Supabase ID for future updates
            if (data) {
              setRows(prev => prev.map(r => 
                r.id === rowId ? { ...r, supabaseId: data.id } as any : r
              ));
            }
          }
        }
      } catch (error) {
        console.error('Error saving to Supabase:', error);
      }
    }, 1000); // Save after 1 second of no typing
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Process rows with LinkedIn URLs
    const validRows = rows.filter(row => row.prospect_linkedin && validateLinkedInUrl(row.prospect_linkedin));
    
    for (const row of validRows) {
      try {
        const { data, error } = await supabase.functions.invoke("rtne-check-or-create", {
          body: { projectName, row },
        });

        if (error) {
          throw error;
        }

        // Update row status to completed
        setRows(prev => prev.map(r => 
          r.id === row.id ? { ...r, status: 'completed' } : r
        ));
      } catch (e: any) {
        console.error("RTNE error:", e);
        // Update row status to failed
        setRows(prev => prev.map(r => 
          r.id === row.id ? { ...r, status: 'failed' } : r
        ));
      }
    }
    setIsSubmitting(false);
  };

  // Bulk enrichment functions
  const bulkEnrichPhones = async () => {
    setIsBulkEnriching(true);
    let successCount = 0;
    let failedCount = 0;

    // Get rows that need phone enrichment
    const targetRows = rows.filter(row => 
      !row.prospect_number && 
      (row.prospect_linkedin || (row.full_name && row.company_name))
    );

    setBulkEnrichProgress({ current: 0, total: targetRows.length });

    for (let i = 0; i < targetRows.length; i++) {
      const row = targetRows[i];
      setBulkEnrichProgress({ current: i + 1, total: targetRows.length });

      try {
        let result;
        
        if (row.prospect_linkedin && validateLinkedInUrl(row.prospect_linkedin)) {
          // Use LinkedIn URL
          result = await enrichProspect(row.prospect_linkedin, "PHONE_ONLY");
        } else if (row.full_name && row.company_name) {
          // Split the full name for debugging
          const fullName = row.full_name.trim();
          const firstSpaceIndex = fullName.indexOf(" ");
          
          let firstName = "";
          let lastName = "";
          
          if (firstSpaceIndex === -1) {
            // Case: Single word name (e.g., "Cher")
            firstName = fullName;
            lastName = "";
          } else {
            // Case: Normal name (e.g., "Nishtha Gupta")
            firstName = fullName.substring(0, firstSpaceIndex).trim();
            lastName = fullName.substring(firstSpaceIndex + 1).trim();
          }
          
          console.log(`🚀 Enriching: First='${firstName}', Last='${lastName}', Company='${row.company_name}'`);
          
          // Use Name + Company
          result = await enrichProspectByName(row.full_name, row.company_name, "PHONE_ONLY");
        } else {
          continue;
        }

        if (result.success && result.phone) {
          setRows(prev => prev.map(r => 
            r.id === row.id ? { ...r, prospect_number: result.phone || '' } : r
          ));
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error("Bulk phone enrichment error:", error);
        failedCount++;
      }
    }

    setIsBulkEnriching(false);
    setBulkEnrichProgress({ current: 0, total: 0 });
    
    toast.success(`Phone Enrichment Complete: ${successCount} found, ${failedCount} failed`);
  };

  const bulkEnrichEmails = async () => {
    setIsBulkEnriching(true);
    let successCount = 0;
    let failedCount = 0;

    // Get rows that need email enrichment
    const targetRows = rows.filter(row => 
      !row.prospect_email && 
      (row.prospect_linkedin || (row.full_name && row.company_name))
    );

    setBulkEnrichProgress({ current: 0, total: targetRows.length });

    for (let i = 0; i < targetRows.length; i++) {
      const row = targetRows[i];
      setBulkEnrichProgress({ current: i + 1, total: targetRows.length });

      try {
        let result;
        
        if (row.prospect_linkedin && validateLinkedInUrl(row.prospect_linkedin)) {
          // Use LinkedIn URL
          result = await enrichProspect(row.prospect_linkedin, "EMAIL_ONLY");
        } else if (row.full_name && row.company_name) {
          // Split the full name for debugging
          const fullName = row.full_name.trim();
          const firstSpaceIndex = fullName.indexOf(" ");
          
          let firstName = "";
          let lastName = "";
          
          if (firstSpaceIndex === -1) {
            // Case: Single word name (e.g., "Cher")
            firstName = fullName;
            lastName = "";
          } else {
            // Case: Normal name (e.g., "Nishtha Gupta")
            firstName = fullName.substring(0, firstSpaceIndex).trim();
            lastName = fullName.substring(firstSpaceIndex + 1).trim();
          }
          
          console.log(`🚀 Enriching: First='${firstName}', Last='${lastName}', Company='${row.company_name}'`);
          
          // Use Name + Company
          result = await enrichProspectByName(row.full_name, row.company_name, "EMAIL_ONLY");
        } else {
          continue;
        }

        if (result.success && result.email) {
          setRows(prev => prev.map(r => 
            r.id === row.id ? { ...r, prospect_email: result.email || '' } : r
          ));
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error("Bulk email enrichment error:", error);
        failedCount++;
      }
    }

    setIsBulkEnriching(false);
    setBulkEnrichProgress({ current: 0, total: 0 });
    
    toast.success(`Email Enrichment Complete: ${successCount} found, ${failedCount} failed`);
  };

  // Add rows function
  const addRows = (count: number) => {
    if (count > 100000) {
      alert("Cannot add more than 100,000 rows at once");
      return;
    }
    
    if (count > 10000) {
      setPendingRowsCount(count);
      setShowConfirmation(true);
      return;
    }
    
    executeAddRows(count);
  };

  const executeAddRows = (count: number) => {
    const newRows: RtneRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push(makeEmptyRow(nextIdRef.current++));
    }
    
    const firstNewRowId = newRows[0]?.id;
    setRows(prev => [...prev, ...newRows]);
    
    // Scroll to first new row after state update
    setTimeout(() => {
      const firstNewRowElement = document.querySelector(`[data-row-id="${firstNewRowId}"]`);
      if (firstNewRowElement) {
        firstNewRowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Context menu and row manipulation functions
  const handleRowRightClick = (e: React.MouseEvent, rowId: number) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      rowId
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  const insertRowAbove = () => {
    const targetIndex = rows.findIndex(row => row.id === contextMenu.rowId);
    if (targetIndex !== -1) {
      // Renumber all rows to maintain sequential numbering
      const newRows = [...rows];
      // Insert new row with the target row's number
      const newRow = makeEmptyRow(rows[targetIndex].id);
      newRows.splice(targetIndex, 0, newRow);
      
      // Renumber subsequent rows
      for (let i = targetIndex + 1; i < newRows.length; i++) {
        newRows[i] = { ...newRows[i], id: newRows[i - 1].id + 1 };
      }
      
      setRows(newRows);
      // Update nextIdRef to the highest ID + 1
      nextIdRef.current = Math.max(...newRows.map(r => r.id)) + 1;
    }
  };

  const insertRowBelow = () => {
    const targetIndex = rows.findIndex(row => row.id === contextMenu.rowId);
    if (targetIndex !== -1) {
      // Renumber all rows to maintain sequential numbering
      const newRows = [...rows];
      // Insert new row with the next sequential number
      const newRow = makeEmptyRow(rows[targetIndex].id + 1);
      newRows.splice(targetIndex + 1, 0, newRow);
      
      // Renumber subsequent rows
      for (let i = targetIndex + 2; i < newRows.length; i++) {
        newRows[i] = { ...newRows[i], id: newRows[i - 1].id + 1 };
      }
      
      setRows(newRows);
      // Update nextIdRef to the highest ID + 1
      nextIdRef.current = Math.max(...newRows.map(r => r.id)) + 1;
    }
  };

  const deleteRow = async () => {
    const row = rows.find(r => r.id === contextMenu.rowId);
    if (row && (row as any).supabaseId) {
      // Delete from Supabase if it exists there
      try {
        const { error } = await supabase
          .from('rtne_requests')
          .delete()
          .eq('id', (row as any).supabaseId);
        
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting from Supabase:', error);
      }
    }
    setRows(prev => prev.filter(row => row.id !== contextMenu.rowId));
  };

  const clearRow = async () => {
    const row = rows.find(r => r.id === contextMenu.rowId);
    if (row && (row as any).supabaseId) {
      // Update in Supabase to clear all fields
      try {
        const { error } = await supabase
          .from('rtne_requests')
          .update({
            full_name: '',
            company_name: '',
            city: '',
            primary_phone: '',
            email_address: '',
            job_title: '',
            linkedin_url: ''
          })
          .eq('id', (row as any).supabaseId);
        
        if (error) throw error;
      } catch (error) {
        console.error('Error clearing row in Supabase:', error);
      }
    }
    setRows(prev => prev.map(row => 
      row.id === contextMenu.rowId 
        ? makeEmptyRow(row.id)
        : row
    ));
  };

  const copyRow = () => {
    const targetRow = rows.find(row => row.id === contextMenu.rowId);
    if (targetRow) {
      setClipboardRow(targetRow);
      setClipboardOperation('copy');
    }
  };

  const cutRow = () => {
    const targetRow = rows.find(row => row.id === contextMenu.rowId);
    if (targetRow) {
      setClipboardRow(targetRow);
      setClipboardOperation('cut');
    }
  };

  const pasteRow = () => {
    if (clipboardRow) {
      const targetIndex = rows.findIndex(row => row.id === contextMenu.rowId);
      if (targetIndex !== -1) {
        const newRow = { ...clipboardRow, id: nextIdRef.current++ };
        
        if (clipboardOperation === 'cut') {
          // Remove the original row and insert the new one
          setRows(prev => {
            const filteredRows = prev.filter(row => row.id !== clipboardRow.id);
            const adjustedIndex = filteredRows.findIndex(row => row.id === contextMenu.rowId);
            return [
              ...filteredRows.slice(0, adjustedIndex),
              newRow,
              ...filteredRows.slice(adjustedIndex)
            ];
          });
          setClipboardRow(null);
          setClipboardOperation(null);
        } else {
          // Copy operation - just insert
          setRows(prev => [
            ...prev.slice(0, targetIndex),
            newRow,
            ...prev.slice(targetIndex)
          ]);
        }
      }
    }
  };

  const handleQuickAdd = (count: number) => {
    addRows(count);
  };

  const handleCustomAdd = () => {
    const count = parseInt(newRowsCount);
    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid number");
      return;
    }
    addRows(count);
  };

  const getStatusDisplay = (status?: string, rowId?: number) => {
    // Check if row is currently being enriched
    if (rowId && enrichingRows.has(rowId)) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Enriching...</span>
        </div>
      );
    }

    switch (status) {
      case 'ready':
        return (
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Ready</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center space-x-2 text-gray-400">
            <HourglassIcon className="h-4 w-4" />
            <span className="text-sm">Pending</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Processing</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <span className="material-icons text-base">error</span>
            <span className="text-sm">Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Navigation functions
  const moveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right', extendSelection = false) => {
    if (!selectedCell) return;

    const { rowId, field } = selectedCell;
    const currentRowIndex = rows.findIndex(row => row.id === rowId);
    const currentFieldIndex = fieldOrder.indexOf(field);

    let newRowId = rowId;
    let newField = field;

    switch (direction) {
      case 'up':
        if (currentRowIndex > 0) {
          newRowId = rows[currentRowIndex - 1].id;
        }
        break;
      case 'down':
        if (currentRowIndex < rows.length - 1) {
          newRowId = rows[currentRowIndex + 1].id;
        }
        break;
      case 'left':
        if (currentFieldIndex > 0) {
          newField = fieldOrder[currentFieldIndex - 1];
        }
        break;
      case 'right':
        if (currentFieldIndex < fieldOrder.length - 1) {
          newField = fieldOrder[currentFieldIndex + 1];
        }
        break;
    }

    if (newRowId !== rowId || newField !== field) {
      const newSelectedCell = { rowId: newRowId, field: newField };
      setSelectedCell(newSelectedCell);
      setIsEditing(false);
      
      // Handle multi-cell selection with shift
      if (extendSelection && selectionStart) {
        const newSelectedCells = new Set<string>();
        const startRowIndex = rows.findIndex(row => row.id === selectionStart.rowId);
        const endRowIndex = rows.findIndex(row => row.id === newRowId);
        const startFieldIndex = fieldOrder.indexOf(selectionStart.field);
        const endFieldIndex = fieldOrder.indexOf(newField);

        const minRowIndex = Math.min(startRowIndex, endRowIndex);
        const maxRowIndex = Math.max(startRowIndex, endRowIndex);
        const minFieldIndex = Math.min(startFieldIndex, endFieldIndex);
        const maxFieldIndex = Math.max(startFieldIndex, endFieldIndex);

        for (let r = minRowIndex; r <= maxRowIndex; r++) {
          for (let f = minFieldIndex; f <= maxFieldIndex; f++) {
            const cellKey = `${rows[r].id}-${fieldOrder[f]}`;
            newSelectedCells.add(cellKey);
          }
        }
        setSelectedCells(newSelectedCells);
      } else {
        setSelectedCells(new Set());
        setSelectionStart(newSelectedCell);
      }
      
      // Scroll to the new cell
      setTimeout(() => {
        const cellElement = document.querySelector(`[data-cell="${newRowId}-${newField}"]`) as HTMLElement;
        if (cellElement) {
          cellElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      }, 0);
    }
  }, [selectedCell, rows, fieldOrder, selectionStart]);

  // Multi-cell delete function
  const deleteSelectedCells = useCallback(() => {
    if (selectedCells.size > 0) {
      // Multi-cell delete
      const updatedRows = rows.map(row => {
        const updatedRow = { ...row };
        fieldOrder.forEach(field => {
          const cellKey = `${row.id}-${field}`;
          if (selectedCells.has(cellKey)) {
            (updatedRow as any)[field] = '';
          }
        });
        return updatedRow;
      });
      setRows(updatedRows);
    } else if (selectedCell) {
      // Single cell delete
      handleChange(selectedCell.rowId, selectedCell.field, '');
    }
  }, [selectedCells, selectedCell, rows, fieldOrder, handleChange]);

  // Multi-cell copy/paste functions
  const copySelectedCells = useCallback(() => {
    if (selectedCells.size > 0) {
      // Multi-cell copy
      const cellsData: string[][] = [];
      const cellsArray = Array.from(selectedCells);
      
      // Group cells by row
      const rowMap = new Map<number, Map<number, string>>();
      cellsArray.forEach(cellKey => {
        const [rowIdStr, field] = cellKey.split('-');
        const rowId = parseInt(rowIdStr);
        const row = rows.find(r => r.id === rowId);
        if (row) {
          if (!rowMap.has(rowId)) {
            rowMap.set(rowId, new Map());
          }
          const fieldIndex = fieldOrder.indexOf(field as keyof RtneRow);
          const value = (row[field as keyof RtneRow] as string) || '';
          rowMap.get(rowId)!.set(fieldIndex, value);
        }
      });
      
      // Convert to 2D array
      const sortedRowIds = Array.from(rowMap.keys()).sort((a, b) => a - b);
      sortedRowIds.forEach(rowId => {
        const fieldMap = rowMap.get(rowId)!;
        const sortedFields = Array.from(fieldMap.keys()).sort((a, b) => a - b);
        const rowData = sortedFields.map(fieldIndex => fieldMap.get(fieldIndex) || '');
        cellsData.push(rowData);
      });
      
      // Convert to TSV format for clipboard
      const tsvData = cellsData.map(row => row.join('\t')).join('\n');
      navigator.clipboard.writeText(tsvData);
    } else if (selectedCell) {
      // Single cell copy
      const row = rows.find(r => r.id === selectedCell.rowId);
      if (row) {
        const value = (row[selectedCell.field] as string) || '';
        navigator.clipboard.writeText(value);
      }
    }
  }, [selectedCells, selectedCell, rows, fieldOrder]);

  const cutSelectedCells = useCallback(() => {
    copySelectedCells();
    deleteSelectedCells();
  }, [copySelectedCells, deleteSelectedCells]);

  const pasteSelectedCells = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      
      if (!selectedCell) return;
      
      // Parse TSV data
      const rows_data = clipboardText.split('\n').map(row => row.split('\t'));
      
      // Find starting position
      const startRowIndex = rows.findIndex(r => r.id === selectedCell.rowId);
      const startFieldIndex = fieldOrder.indexOf(selectedCell.field);
      
      if (startRowIndex === -1 || startFieldIndex === -1) return;
      
      // Paste data
      const updatedRows = [...rows];
      rows_data.forEach((rowData, rowOffset) => {
        const targetRowIndex = startRowIndex + rowOffset;
        if (targetRowIndex < updatedRows.length) {
          rowData.forEach((cellValue, colOffset) => {
            const targetFieldIndex = startFieldIndex + colOffset;
            if (targetFieldIndex < fieldOrder.length) {
              const field = fieldOrder[targetFieldIndex];
              updatedRows[targetRowIndex] = {
                ...updatedRows[targetRowIndex],
                [field]: cellValue
              };
              
              // Save to database
              handleChange(updatedRows[targetRowIndex].id, field, cellValue);
            }
          });
        }
      });
      
      setRows(updatedRows);
    } catch (error) {
      console.error('Error pasting:', error);
    }
  }, [selectedCell, rows, fieldOrder, handleChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell) return;

    // Track shift state for multi-cell selection
    if (e.key === 'Shift') {
      setIsShiftHeld(true);
    }

    // Handle navigation keys when not editing
    if (!isEditing) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveSelection('up', e.shiftKey);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveSelection('down', e.shiftKey);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveSelection('left', e.shiftKey);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveSelection('right', e.shiftKey);
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            moveSelection('up');
          } else {
            moveSelection('down');
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            moveSelection('left');
          } else {
            moveSelection('right');
          }
          break;
        case 'F2':
          e.preventDefault();
          setIsEditing(true);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteSelectedCells();
          break;
        default:
          // Handle Ctrl+C, Ctrl+X, Ctrl+V for multi-cell operations
          if (e.ctrlKey || e.metaKey) {
            if (e.key === 'c') {
              e.preventDefault();
              copySelectedCells();
            } else if (e.key === 'x') {
              e.preventDefault();
              cutSelectedCells();
            } else if (e.key === 'v') {
              e.preventDefault();
              pasteSelectedCells();
            }
          }
          break;
      }
    } else {
      // Handle keys when editing - don't allow arrow navigation
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          setIsEditing(false);
          if (e.shiftKey) {
            moveSelection('up');
          } else {
            moveSelection('down');
          }
          break;
        case 'Tab':
          e.preventDefault();
          setIsEditing(false);
          if (e.shiftKey) {
            moveSelection('left');
          } else {
            moveSelection('right');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsEditing(false);
          break;
      }
    }
  }, [selectedCell, isEditing, moveSelection, copySelectedCells, cutSelectedCells, pasteSelectedCells, deleteSelectedCells]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftHeld(false);
    }
  }, []);

  const handleCellClick = useCallback((e: React.MouseEvent, rowId: number, field: keyof RtneRow) => {
    const newSelectedCell = { rowId, field };
    setSelectedCell(newSelectedCell);
    setIsEditing(true); // Enable editing immediately on click
    
    if (e.shiftKey && selectionStart) {
      // Extend selection
      const newSelectedCells = new Set<string>();
      const startRowIndex = rows.findIndex(row => row.id === selectionStart.rowId);
      const endRowIndex = rows.findIndex(row => row.id === rowId);
      const startFieldIndex = fieldOrder.indexOf(selectionStart.field);
      const endFieldIndex = fieldOrder.indexOf(field);

      const minRowIndex = Math.min(startRowIndex, endRowIndex);
      const maxRowIndex = Math.max(startRowIndex, endRowIndex);
      const minFieldIndex = Math.min(startFieldIndex, endFieldIndex);
      const maxFieldIndex = Math.max(startFieldIndex, endFieldIndex);

      for (let r = minRowIndex; r <= maxRowIndex; r++) {
        for (let f = minFieldIndex; f <= maxFieldIndex; f++) {
          const cellKey = `${rows[r].id}-${fieldOrder[f]}`;
          newSelectedCells.add(cellKey);
        }
      }
      setSelectedCells(newSelectedCells);
    } else {
      setSelectedCells(new Set());
      setSelectionStart(newSelectedCell);
    }
  }, [rows, fieldOrder, selectionStart]);

  const handleCellDoubleClick = useCallback((rowId: number, field: keyof RtneRow) => {
    setSelectedCell({ rowId, field });
    setIsEditing(true);
    setSelectedCells(new Set());
    setSelectionStart({ rowId, field });
  }, []);

  const getCellId = (rowId: number, field: keyof RtneRow) => `${rowId}-${field}`;

  const isCellSelected = (rowId: number, field: keyof RtneRow) => {
    const cellId = getCellId(rowId, field);
    return selectedCell?.rowId === rowId && selectedCell?.field === field || selectedCells.has(cellId);
  };

  // Keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Mouse event listeners for drag selection
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

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
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Extensions</a>
                <a className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md" href="#">Help</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => navigate("/")}
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
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between h-12 border-t border-gray-200">
            <div className="flex items-center text-sm">
              <h1 className="font-semibold text-lg text-gray-800 pr-3">LinkedIn Prospects</h1>
              <Star className="h-5 w-5 text-gray-500 hover:text-yellow-500 cursor-pointer" />
            </div>
            <div className="flex items-center space-x-1 text-gray-700">
              <button className="p-2 rounded-full hover:bg-gray-200" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <RotateCw className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Printer className="h-4 w-4" />
              </button>
              <div className="h-6 border-l border-gray-300 mx-2"></div>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Bold className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Italic className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Underline className="h-4 w-4" />
              </button>
              <div className="h-6 border-l border-gray-300 mx-2"></div>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Link className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <MessageSquare className="h-4 w-4" />
              </button>
              <div className="h-6 border-l border-gray-300 mx-2"></div>
              <button 
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Play className="h-4 w-4 text-[#0A66C2]" />
                <span>{isSubmitting ? 'Processing...' : 'Run RTNE'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enrichment Toolbar */}
      {!isLoadingData && (
        <div className="bg-white border-b border-gray-300 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Bulk Enrichment:</span>
            <button
              onClick={bulkEnrichPhones}
              disabled={isBulkEnriching}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Phone className="h-4 w-4" />
              <span>📞 Enrich Phones</span>
            </button>
            <button
              onClick={bulkEnrichEmails}
              disabled={isBulkEnriching}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Mail className="h-4 w-4" />
              <span>📧 Enrich Emails</span>
            </button>
          </div>
          
          {isBulkEnriching && (
            <div className="flex items-center space-x-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">
                Enriching {bulkEnrichProgress.current}/{bulkEnrichProgress.total} rows...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Spreadsheet Table */}
      <main className="max-w-full mx-auto p-0">
        {isLoadingData ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <span className="ml-2 text-gray-600">Loading your data...</span>
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 w-12 sticky left-0 z-10 text-gray-500">#</th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-600" />
                    Full Name
                  </div>
                </th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-600" />
                    Company Name
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
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-600" />
                    Primary Phone
                  </div>
                </th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                  <div className="flex items-center">
                    <PhoneCall className="h-4 w-4 mr-2 text-gray-600" />
                    Phone 2
                  </div>
                </th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                  <div className="flex items-center">
                    <PhoneCall className="h-4 w-4 mr-2 text-gray-600" />
                    Phone 3
                  </div>
                </th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                  <div className="flex items-center">
                    <PhoneCall className="h-4 w-4 mr-2 text-gray-600" />
                    Phone 4
                  </div>
                </th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[250px]">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-600" />
                    Email Address
                  </div>
                </th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[150px]">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                    City
                  </div>
                </th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-600" />
                    Job Title
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`group hover:bg-blue-50/50 ${isRowCut(row.id) ? 'opacity-50 bg-red-50' : ''}`} data-row-id={row.id}>
                  <td 
                    className="px-3 py-2 border-b border-r border-gray-300 text-sm sticky left-0 bg-white group-hover:bg-blue-50/50 text-center text-gray-500 z-10 cursor-context-menu select-none"
                    onContextMenu={(e) => handleRowRightClick(e, row.id)}
                  >
                    {row.id}
                  </td>
                  {fieldOrder.map((field) => {
                    const cellValue = row[field] as string || '';
                    const isSelected = isCellSelected(row.id, field);
                    const isCurrentlyEditing = isSelected && isEditing;
                    
                    return (
                      <td 
                        key={field}
                        className={`px-3 py-2 border-b border-r border-gray-300 text-sm cursor-pointer ${
                          isSelected 
                            ? 'outline outline-2 outline-blue-500 bg-blue-50' 
                            : 'hover:outline hover:outline-2 hover:outline-blue-500'
                        }`}
                        onClick={(e) => handleCellClick(e, row.id, field)}
                        onDoubleClick={() => handleCellDoubleClick(row.id, field)}
                        onMouseDown={(e) => {
                          if (e.button === 0 && !isEditing) {
                            setIsDragging(true);
                            handleCellClick(e, row.id, field);
                          }
                        }}
                        onMouseEnter={() => {
                          if (isDragging && selectionStart) {
                            const newSelectedCells = new Set<string>();
                            const startRowIndex = rows.findIndex(r => r.id === selectionStart.rowId);
                            const endRowIndex = rows.findIndex(r => r.id === row.id);
                            const startFieldIndex = fieldOrder.indexOf(selectionStart.field);
                            const endFieldIndex = fieldOrder.indexOf(field);

                            const minRowIndex = Math.min(startRowIndex, endRowIndex);
                            const maxRowIndex = Math.max(startRowIndex, endRowIndex);
                            const minFieldIndex = Math.min(startFieldIndex, endFieldIndex);
                            const maxFieldIndex = Math.max(startFieldIndex, endFieldIndex);

                            for (let r = minRowIndex; r <= maxRowIndex; r++) {
                              for (let f = minFieldIndex; f <= maxFieldIndex; f++) {
                                const cellKey = `${rows[r].id}-${fieldOrder[f]}`;
                                newSelectedCells.add(cellKey);
                              }
                            }
                            setSelectedCells(newSelectedCells);
                            setSelectedCell({ rowId: row.id, field });
                          }
                        }}
                        onMouseUp={() => {
                          setIsDragging(false);
                        }}
                      >
                        <input
                          data-cell={`${row.id}-${field}`}
                          className="w-full border-none focus:ring-0 focus:outline-none p-0 bg-transparent text-sm font-medium"
                          type={field === 'prospect_email' ? 'email' : 'text'}
                          value={cellValue}
                          onChange={(e) => handleChange(row.id, field, e.target.value)}
                          onFocus={() => {
                            setSelectedCell({ rowId: row.id, field });
                            setSelectionStart({ rowId: row.id, field });
                            setIsEditing(true);
                          }}
                          onBlur={(e) => {
                            // Only blur if not moving to another input
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            if (!relatedTarget || !relatedTarget.hasAttribute('data-cell')) {
                              setIsEditing(false);
                            }
                          }}
                          onKeyDown={(e) => {
                            // Stop propagation to prevent global handler from interfering
                            e.stopPropagation();
                            
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setIsEditing(false);
                              setTimeout(() => {
                                if (e.shiftKey) {
                                  moveSelection('up');
                                } else {
                                  moveSelection('down');
                                }
                              }, 0);
                            } else if (e.key === 'Tab') {
                              e.preventDefault();
                              setIsEditing(false);
                              setTimeout(() => {
                                if (e.shiftKey) {
                                  moveSelection('left');
                                } else {
                                  moveSelection('right');
                                }
                              }, 0);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setIsEditing(false);
                            }
                          }}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-sm">
                    {getStatusDisplay(row.status, row.id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Row Management Controls */}
        <div className="bg-white border-t border-gray-300 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 font-medium">
              Rows: {rows.length}
            </span>
            {rows.length > 2000 && (
              <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-md">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Performance warning: Consider enabling virtualization for better performance</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={newRowsCount}
              onChange={(e) => setNewRowsCount(e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="100"
              min="1"
              aria-label="Number of rows to add"
            />
            <button
              onClick={handleCustomAdd}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              aria-label="Add custom number of rows"
            >
              <Plus className="h-3 w-3" />
              <span>Add rows</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuickAdd(100)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                aria-label="Add 100 rows"
              >
                +100
              </button>
              <button
                onClick={() => handleQuickAdd(1000)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                aria-label="Add 1000 rows"
              >
                +1000
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold">Large Row Addition</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You're about to add {pendingRowsCount.toLocaleString()} rows. This may impact performance. Are you sure you want to continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setPendingRowsCount(0);
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  executeAddRows(pendingRowsCount);
                  setShowConfirmation(false);
                  setPendingRowsCount(0);
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Add Rows
              </button>
            </div>
          </div>
        </div>
      )}

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
        rowNumber={contextMenu.rowId}
        hasClipboard={clipboardRow !== null}
      />
    </div>
  );
};

export default Rtne;