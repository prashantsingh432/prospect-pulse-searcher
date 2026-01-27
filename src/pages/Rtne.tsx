import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { validateLinkedInUrl } from "@/utils/linkedInUtils";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, User, MapPin, Briefcase, Building, Mail, Phone, PhoneCall, Play, Share, ArrowLeft, HourglassIcon, Plus, AlertTriangle, ChevronDown, Table, Settings, FilePlus2, Lock, Check, X, RotateCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import RowContextMenu from "@/components/RowContextMenu";
import { enrichProspectByName, enrichProspect } from "@/services/lushaService";
import { lookupProspectInDatabase } from "@/services/databaseLookupService";
import EnrichmentLoadingModal from "@/components/EnrichmentLoadingModal";
import { toast } from "sonner";

interface RtneRow {
  id: number;
  prospect_linkedin: string;
  full_name?: string;
  company_name?: string;
  company_linkedin_url?: string;
  prospect_city?: string;
  prospect_number?: string;
  prospect_email?: string;
  prospect_number2?: string;
  prospect_number3?: string;
  prospect_number4?: string;
  prospect_designation?: string;
  status?: 'ready' | 'pending' | 'processing' | 'completed' | 'failed';
  supabaseId?: string; // Store the Supabase UUID for updates
  // Phone disposition tracking
  phone1_disposition?: 'correct' | 'wrong' | null;
  phone2_disposition?: 'correct' | 'wrong' | null;
  phone3_disposition?: 'correct' | 'wrong' | null;
  phone4_disposition?: 'correct' | 'wrong' | null;
}

const Rtne: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const nextIdRef = useRef(101); // Start from 101 for new rows
  const tableScrollRef = useRef<HTMLDivElement | null>(null); // scroll container around the table
  const tableElementRef = useRef<HTMLTableElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null); // the custom bottom scrollbar
  const scrollInnerRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

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
        company_linkedin_url: "",
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
  const saveTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const enrichmentTriggeredRef = useRef<Set<number>>(new Set());
  const [enrichingRows, setEnrichingRows] = useState<Set<number>>(new Set());
  const [isBulkEnriching, setIsBulkEnriching] = useState(false);
  const [bulkEnrichProgress, setBulkEnrichProgress] = useState({ current: 0, total: 0 });
  const [tableContentWidth, setTableContentWidth] = useState(0);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [enrichmentSource, setEnrichmentSource] = useState<"database" | "lusha">("database");
  const [enrichmentStage, setEnrichmentStage] = useState<"searching" | "not_found" | "enriching_lusha">("searching");
  const [enrichedFromDbRows, setEnrichedFromDbRows] = useState<Set<number>>(new Set()); // Track rows enriched from database

  // Cell selection and navigation state
  const [selectedCell, setSelectedCell] = useState<{ rowId: number, field: keyof RtneRow } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ rowId: number, field: keyof RtneRow } | null>(null);
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
    'prospect_linkedin',
    'prospect_email',
    'prospect_number',
    'prospect_number2',
    'prospect_number3',
    'prospect_number4',
    'company_name',
    'company_linkedin_url',
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
    company_linkedin_url: "",
    prospect_email: "",
    prospect_number: "",
    prospect_number2: "",
    prospect_number3: "",
    prospect_number4: "",
    phone1_disposition: null,
    phone2_disposition: null,
    phone3_disposition: null,
    phone4_disposition: null,
  }), []);

  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        // Load user's own RTNE requests - ORDER BY row_number to get all rows in order
        const { data: rtneRequests, error } = await supabase
          .from('rtne_requests')
          .select('*')
          .eq('user_id', user?.id)
          .eq('project_name', projectName)
          .order('row_number', { ascending: true });

        if (error) throw error;

        // Find the maximum row number from the database to know total rows needed
        let maxRowNumber = 100; // Default minimum of 100 rows
        
        if (rtneRequests && rtneRequests.length > 0) {
          // Deduplicate by row_number - keep only the most recent record (has data) for each row
          const rowMap = new Map<number, any>();
          
          for (const request of rtneRequests) {
            const rowNum = request.row_number;
            const existing = rowMap.get(rowNum);
            
            // Track maximum row number - CRITICAL for loading all rows beyond 100
            if (rowNum > maxRowNumber) {
              maxRowNumber = rowNum;
            }
            
            // Keep the record with more data (has primary_phone/email/full_name/linkedin)
            const hasData = request.primary_phone || request.email_address || request.full_name || request.phone2 || request.linkedin_url;
            const existingHasData = existing && (existing.primary_phone || existing.email_address || existing.full_name || existing.phone2 || existing.linkedin_url);
            
            if (!existing || (hasData && !existingHasData)) {
              rowMap.set(rowNum, request);
            }
          }

          // Map rtne_requests to RtneRow format - load ALL phone columns and dispositions
          const loadedRows: RtneRow[] = Array.from(rowMap.values()).map((request: any) => ({
            id: request.row_number,
            prospect_linkedin: request.linkedin_url || '',
            full_name: request.full_name || '',
            company_name: request.company_name || '',
            company_linkedin_url: request.company_linkedin_url || '',
            prospect_city: request.city || '',
            prospect_number: request.primary_phone || '',
            prospect_email: request.email_address || '',
            prospect_number2: request.phone2 || '',
            prospect_number3: request.phone3 || '',
            prospect_number4: request.phone4 || '',
            prospect_designation: request.job_title || '',
            supabaseId: request.id, // Store request ID for updates
            phone1_disposition: request.phone1_disposition || null,
            phone2_disposition: request.phone2_disposition || null,
            phone3_disposition: request.phone3_disposition || null,
            phone4_disposition: request.phone4_disposition || null,
          }));

          // CRITICAL FIX: Create rows up to the maximum row number found in database
          // This ensures ALL rows (including those beyond 100) are loaded and preserved
          const fullRows: RtneRow[] = [];
          for (let i = 1; i <= maxRowNumber; i++) {
            const existingRow = loadedRows.find(r => r.id === i);
            fullRows.push(existingRow || makeEmptyRow(i));
          }

          setRows(fullRows);
          // Set next ID to be one more than the max row number
          nextIdRef.current = maxRowNumber + 1;
          
          console.log(`✅ Loaded ${loadedRows.length} unique rows from database (max row: ${maxRowNumber})`);
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

  // Calculate table content width and sync scroll
  useEffect(() => {
    const grid = tableScrollRef.current;
    const bar = bottomScrollRef.current;
    const table = tableElementRef.current;
    
    if (!grid || !bar || !table) return;

    // Update width to match table scrollWidth
    const updateWidth = () => {
      const width = table.scrollWidth || 2000;
      console.log('Table scrollWidth:', width);
      setTableContentWidth(width);
      bar.scrollLeft = grid.scrollLeft;
    };
    
    // Initial update
    setTimeout(updateWidth, 100);

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(table);

    let syncingFromGrid = false;
    let syncingFromBar = false;

    const handleGridScroll = () => {
      if (syncingFromBar) return;
      syncingFromGrid = true;
      bar.scrollLeft = grid.scrollLeft;
      syncingFromGrid = false;
    };

    const handleBarScroll = () => {
      if (syncingFromGrid) return;
      syncingFromBar = true;
      grid.scrollLeft = bar.scrollLeft;
      syncingFromBar = false;
    };

    grid.addEventListener("scroll", handleGridScroll);
    bar.addEventListener("scroll", handleBarScroll);

    return () => {
      resizeObserver.disconnect();
      grid.removeEventListener("scroll", handleGridScroll);
      bar.removeEventListener("scroll", handleBarScroll);
    };
  }, [rows]);

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
            // 🔥 CRITICAL: Split the full name BEFORE calling the API
            const trimmedName = fullName.trim();
            const firstSpaceIndex = trimmedName.indexOf(" ");

            let firstName = "";
            let lastName = "";

            if (firstSpaceIndex === -1) {
              // Case: Single word name (e.g., "Cher")
              firstName = trimmedName;
              lastName = "";
            } else {
              // Case: Normal name (e.g., "Nishtha Gupta")
              firstName = trimmedName.substring(0, firstSpaceIndex).trim();
              lastName = trimmedName.substring(firstSpaceIndex + 1).trim();
            }

            console.log(`🚀 Enriching: First='${firstName}', Last='${lastName}', Company='${companyName}'`);

            // Collect all enriched data to save at once
            let enrichedUpdates: Partial<RtneRow> = {
              full_name: fullName,
              company_name: companyName
            };

            // Try phone enrichment first
            const phoneResult = await enrichProspectByName(
              firstName,
              lastName,
              companyName,
              "PHONE_ONLY"
            );

            if (phoneResult.success && phoneResult.phone) {
              enrichedUpdates = {
                ...enrichedUpdates,
                prospect_number: phoneResult.phone || '',
                prospect_number2: phoneResult.phone2 || '',
                prospect_number3: phoneResult.phone3 || '',
                prospect_number4: phoneResult.phone4 || '',
                prospect_email: phoneResult.email || row.prospect_email,
                full_name: phoneResult.fullName || fullName,
                company_name: phoneResult.company || companyName,
              };
              
              setRows(prev => prev.map(r =>
                r.id === rowId ? { ...r, ...enrichedUpdates } : r
              ));
              
              const phoneCount = [phoneResult.phone, phoneResult.phone2, phoneResult.phone3, phoneResult.phone4].filter(Boolean).length;
              toast.success(`${phoneCount} phone(s) enriched!`);
            }

            // Then try email enrichment
            const emailResult = await enrichProspectByName(
              firstName,
              lastName,
              companyName,
              "EMAIL_ONLY"
            );

            if (emailResult.success && emailResult.email) {
              enrichedUpdates = {
                ...enrichedUpdates,
                prospect_number: emailResult.phone || enrichedUpdates.prospect_number || row.prospect_number,
                prospect_number2: emailResult.phone2 || enrichedUpdates.prospect_number2 || row.prospect_number2,
                prospect_number3: emailResult.phone3 || enrichedUpdates.prospect_number3 || row.prospect_number3,
                prospect_number4: emailResult.phone4 || enrichedUpdates.prospect_number4 || row.prospect_number4,
                prospect_email: emailResult.email || '',
                full_name: emailResult.fullName || enrichedUpdates.full_name || fullName,
                company_name: emailResult.company || enrichedUpdates.company_name || companyName,
              };
              
              setRows(prev => prev.map(r =>
                r.id === rowId ? { ...r, ...enrichedUpdates } : r
              ));
              
              toast.success("Email enriched!");
            }

            // Update other fields if available
            if (phoneResult.success || emailResult.success) {
              if (phoneResult.title) enrichedUpdates.prospect_designation = phoneResult.title;
              if (emailResult.title) enrichedUpdates.prospect_designation = emailResult.title;

              if (enrichedUpdates.prospect_designation) {
                setRows(prev => prev.map(r =>
                  r.id === rowId ? { ...r, prospect_designation: enrichedUpdates.prospect_designation } : r
                ));
              }

              // 🔥 CRITICAL: SAVE ENRICHED DATA TO SUPABASE IMMEDIATELY
              // Pass the current row with updated field for proper saving
              const currentRowForSave: RtneRow = {
                ...row,
                [field]: value, // Include the field that triggered enrichment
              };
              
              console.log(`💾 Saving enriched data immediately for row ${rowId}`);
              await saveEnrichedDataToSupabase(rowId, enrichedUpdates, currentRowForSave);
              console.log(`✅ Enriched data saved to Supabase for row ${rowId}`);
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

      console.log(`🔍 Saving cell change - Row ${rowId}, Field: ${field}, New Value: "${value}"`);

      try {
        // Get the updated value from the field (use current value after state update)
        const updatedValue = field === 'prospect_linkedin' ? value :
          field === 'full_name' ? value :
            field === 'company_name' ? value :
              field === 'prospect_city' ? value :
                field === 'prospect_number' ? value :
                  field === 'prospect_email' ? value :
                    field === 'prospect_designation' ? value :
                      (currentRow[field] as string);

        // Get the current row state with the updated field
        const updatedRow = {
          ...currentRow,
          [field]: value
        };

        console.log(`📝 Updated row state:`, {
          linkedin_url: updatedRow.prospect_linkedin,
          full_name: updatedRow.full_name,
          company_name: updatedRow.company_name,
          primary_phone: updatedRow.prospect_number
        });

        // Map RtneRow fields to rtne_requests columns - convert empty strings to null
        // IMPORTANT: Save ALL phone columns to prevent data loss on refresh/logout
        const requestData: any = {
          project_name: projectName,
          user_id: user?.id,
          user_name: user?.fullName || user?.email?.split('@')[0] || 'Unknown',
          linkedin_url: updatedRow.prospect_linkedin || null,
          full_name: updatedRow.full_name || null,
          company_name: updatedRow.company_name || null,
          company_linkedin_url: updatedRow.company_linkedin_url || null,
          city: updatedRow.prospect_city || null,
          primary_phone: updatedRow.prospect_number || null,
          phone2: updatedRow.prospect_number2 || null,
          phone3: updatedRow.prospect_number3 || null,
          phone4: updatedRow.prospect_number4 || null,
          email_address: updatedRow.prospect_email || null,
          job_title: updatedRow.prospect_designation || null,
          row_number: rowId,
          status: 'pending',
          updated_at: new Date().toISOString()
        };

        console.log(`💾 Request data to save:`, requestData);

        // Check if row has a Supabase ID (existing record)
        if ((currentRow as any).supabaseId) {
          // Check if all data fields are empty - if so, delete the record
          const hasAnyData = requestData.linkedin_url || requestData.full_name || 
                             requestData.company_name || requestData.primary_phone || 
                             requestData.phone2 || requestData.phone3 || requestData.phone4 ||
                             requestData.email_address;
          
          console.log(`🔄 Existing record (ID: ${(currentRow as any).supabaseId}), hasAnyData: ${hasAnyData}`);
          
          if (!hasAnyData) {
            console.log(`🗑️ All fields empty - DELETING record from database`);
            // Delete the record entirely since all fields are cleared
            const { error } = await supabase
              .from('rtne_requests')
              .delete()
              .eq('id', (currentRow as any).supabaseId);

            if (error) {
              console.error(`❌ Delete failed:`, error);
              throw error;
            }
            
            console.log(`✅ Record deleted successfully`);
            
            // Remove supabaseId from local state
            setRows(prev => prev.map(r => {
              if (r.id === rowId) {
                const { supabaseId, ...rest } = r as any;
                return rest;
              }
              return r;
            }));
          } else {
            console.log(`📤 Updating existing record with data (including nulls)`);
            // Update existing record with all fields (including nulls)
            const { error } = await supabase
              .from('rtne_requests')
              .update(requestData)
              .eq('id', (currentRow as any).supabaseId);

            if (error) {
              console.error(`❌ Update failed:`, error);
              throw error;
            }
            console.log(`✅ Record updated successfully`);
          }
        } else {
          // Insert new record only if there's actual data
          if (requestData.linkedin_url || requestData.full_name || requestData.company_name) {
            // Check for uniqueness: check by ROW_NUMBER first (primary), then LinkedIn URL
            let shouldInsert = true;
            
            // CRITICAL: Check if a record already exists for this row_number
            const { data: existingByRow } = await supabase
              .from('rtne_requests')
              .select('id, primary_phone, email_address, full_name')
              .eq('user_id', user?.id)
              .eq('project_name', projectName)
              .eq('row_number', rowId)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (existingByRow) {
              shouldInsert = false;
              console.log(`🔄 Found existing record for row ${rowId}, updating instead of inserting`);
              // Update the existing record instead
              const { error: updateError } = await supabase
                .from('rtne_requests')
                .update(requestData)
                .eq('id', existingByRow.id);
              
              if (!updateError) {
                setRows(prev => prev.map(r =>
                  r.id === rowId ? { ...r, supabaseId: existingByRow.id } as any : r
                ));
                console.log(`✅ Updated existing record for row ${rowId}`);
              }
            }

            if (shouldInsert) {
              console.log(`➕ Inserting new record for row ${rowId}`);
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
                console.log(`✅ Inserted new record for row ${rowId} with ID ${data.id}`);
              }
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
          // Split the full name BEFORE calling service
          const nameParts = row.full_name.trim().split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(" ") || "";

          console.log(`🚀 Enriching: First='${firstName}', Last='${lastName}', Company='${row.company_name}'`);

          // Use Name + Company with pre-split names
          result = await enrichProspectByName(firstName, lastName, row.company_name, "PHONE_ONLY");
        } else {
          continue;
        }

        if (result.success && result.phone) {
          const updates: Partial<RtneRow> = {
            prospect_number: result.phone || '',
            prospect_number2: result.phone2 || '',
            prospect_number3: result.phone3 || '',
            prospect_number4: result.phone4 || '',
            prospect_email: result.email || row.prospect_email,
            full_name: result.fullName || row.full_name,
            company_name: result.company || row.company_name,
          };
          
          setRows(prev => prev.map(r =>
            r.id === row.id ? { ...r, ...updates } : r
          ));
          
          // 🔥 CRITICAL: Save to Supabase immediately after enrichment
          await saveEnrichedDataToSupabase(row.id, updates, row);
          
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
          // Split the full name BEFORE calling service
          const nameParts = row.full_name.trim().split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(" ") || "";

          console.log(`🚀 Enriching: First='${firstName}', Last='${lastName}', Company='${row.company_name}'`);

          // Use Name + Company with pre-split names
          result = await enrichProspectByName(firstName, lastName, row.company_name, "EMAIL_ONLY");
        } else {
          continue;
        }

        if (result.success && result.email) {
          const updates: Partial<RtneRow> = {
            prospect_number: result.phone || row.prospect_number,
            prospect_number2: result.phone2 || row.prospect_number2,
            prospect_number3: result.phone3 || row.prospect_number3,
            prospect_number4: result.phone4 || row.prospect_number4,
            prospect_email: result.email || '',
            full_name: result.fullName || row.full_name,
            company_name: result.company || row.company_name,
          };
          
          setRows(prev => prev.map(r =>
            r.id === row.id ? { ...r, ...updates } : r
          ));
          
          // 🔥 CRITICAL: Save to Supabase immediately after enrichment
          await saveEnrichedDataToSupabase(row.id, updates, row);
          
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

  const requestBulkAccess = useCallback(() => {
    toast.error("Bulk enrichment access required. Please contact your admin for access.");
  }, []);

  // Helper function to deduplicate phone numbers
  const deduplicatePhones = (phone1?: string | null, phone2?: string | null, phone3?: string | null, phone4?: string | null) => {
    const phones = [phone1, phone2, phone3, phone4]
      .filter(p => p && p.trim())
      .map(p => p!.trim());
    
    // Remove duplicates while preserving order
    const uniquePhones = Array.from(new Set(phones));
    
    return {
      prospect_number: uniquePhones[0] || null,
      prospect_number2: uniquePhones[1] || null,
      prospect_number3: uniquePhones[2] || null,
      prospect_number4: uniquePhones[3] || null,
    };
  };

  // Smart phone merging - combines existing DB numbers with new Lusha numbers without losing data
  const mergePhoneNumbers = (
    existingPhones: { phone1?: string | null, phone2?: string | null, phone3?: string | null, phone4?: string | null },
    newPhones: { phone1?: string | null, phone2?: string | null, phone3?: string | null, phone4?: string | null }
  ) => {
    // Get all existing phone numbers
    const existing = [existingPhones.phone1, existingPhones.phone2, existingPhones.phone3, existingPhones.phone4]
      .filter(p => p && p.trim())
      .map(p => p!.trim());
    
    // Get all new phone numbers  
    const newNums = [newPhones.phone1, newPhones.phone2, newPhones.phone3, newPhones.phone4]
      .filter(p => p && p.trim())
      .map(p => p!.trim());
    
    // Combine both sets - new numbers first (priority), then existing that aren't duplicates
    const combined = [...newNums];
    existing.forEach(phone => {
      if (!combined.includes(phone)) {
        combined.push(phone);
      }
    });
    
    // Only keep first 4 unique numbers
    const uniquePhones = combined.slice(0, 4);
    
    return {
      prospect_number: uniquePhones[0] || null,
      prospect_number2: uniquePhones[1] || null,
      prospect_number3: uniquePhones[2] || null,
      prospect_number4: uniquePhones[3] || null,
    };
  };

  // Helper function to save enriched data to Supabase IMMEDIATELY after enrichment
  // CRITICAL: This function must work without relying on stale React state
  const saveEnrichedDataToSupabase = async (rowId: number, updates: Partial<RtneRow>, currentRow?: RtneRow) => {
    // Use passed currentRow to avoid stale state issues, fallback to finding in rows
    const row = currentRow || rows.find(r => r.id === rowId);
    if (!row) {
      console.error(`❌ saveEnrichedDataToSupabase: Row ${rowId} not found`);
      return;
    }

    // LinkedIn URL is optional - can save data even without it
    const linkedinUrl = updates.prospect_linkedin || row.prospect_linkedin || null;

    try {
      console.log(`💾 SAVING enriched data to Supabase for row ${rowId}:`, updates);

      // Deduplicate phone numbers before saving - use updates first, then row data
      const dedupedPhones = deduplicatePhones(
        updates.prospect_number ?? row.prospect_number,
        updates.prospect_number2 ?? row.prospect_number2,
        updates.prospect_number3 ?? row.prospect_number3,
        updates.prospect_number4 ?? row.prospect_number4
      );

      // 1. Save to rtne_requests table (current project tracking) - SAVE ALL PHONE COLUMNS
      const requestData: any = {
        project_name: projectName,
        user_id: user?.id,
        user_name: user?.fullName || user?.email?.split('@')[0] || 'Unknown',
        linkedin_url: linkedinUrl,
        full_name: updates.full_name ?? row.full_name ?? null,
        company_name: updates.company_name ?? row.company_name ?? null,
        company_linkedin_url: updates.company_linkedin_url ?? row.company_linkedin_url ?? null,
        city: updates.prospect_city ?? row.prospect_city ?? null,
        primary_phone: dedupedPhones.prospect_number || null,
        phone2: dedupedPhones.prospect_number2 || null,
        phone3: dedupedPhones.prospect_number3 || null,
        phone4: dedupedPhones.prospect_number4 || null,
        email_address: updates.prospect_email ?? row.prospect_email ?? null,
        job_title: updates.prospect_designation ?? row.prospect_designation ?? null,
        row_number: rowId,
        status: 'completed',
        updated_at: new Date().toISOString()
      };

      console.log(`📤 Request data to save:`, requestData);

      // Check if row already has a Supabase ID, or check by row_number
      let supabaseId = (row as any).supabaseId;
      
      if (!supabaseId) {
        // Check if a record exists for this row_number
        const { data: existingRecord } = await supabase
          .from('rtne_requests')
          .select('id')
          .eq('user_id', user?.id)
          .eq('project_name', projectName)
          .eq('row_number', rowId)
          .maybeSingle();
        
        if (existingRecord) {
          supabaseId = existingRecord.id;
        }
      }

      if (supabaseId) {
        console.log(`🔄 Updating existing record ${supabaseId}`);
        const { error } = await supabase
          .from('rtne_requests')
          .update(requestData)
          .eq('id', supabaseId);
        
        if (error) {
          console.error(`❌ Update failed:`, error);
          throw error;
        }
        console.log(`✅ Record updated successfully`);
        
        // Update local state with supabaseId
        setRows(prev => prev.map(r =>
          r.id === rowId ? { ...r, supabaseId } as any : r
        ));
      } else {
        console.log(`➕ Inserting new record`);
        const { data, error } = await supabase
          .from('rtne_requests')
          .insert([requestData])
          .select()
          .single();

        if (error) {
          console.error(`❌ Insert failed:`, error);
          throw error;
        }
        console.log(`✅ Inserted new record with ID ${data?.id}`);

        if (data) {
          setRows(prev => prev.map(r =>
            r.id === rowId ? { ...r, supabaseId: data.id } as any : r
          ));
        }
      }

      // 2. ALSO save to prospects table (global database for all searches)
      // Only if we have enough data to create a meaningful record
      if (linkedinUrl || (requestData.full_name && requestData.company_name)) {
        const prospectData: any = {
          full_name: requestData.full_name || 'Unknown',
          company_name: requestData.company_name || 'Unknown',
          company_linkedin_url: requestData.company_linkedin_url || null, // 🔥 Save company LinkedIn URL
          prospect_city: requestData.city || null,
          prospect_designation: requestData.job_title || null,
          prospect_number: dedupedPhones.prospect_number || null,
          prospect_number2: dedupedPhones.prospect_number2 || null,
          prospect_number3: dedupedPhones.prospect_number3 || null,
          prospect_number4: dedupedPhones.prospect_number4 || null,
          prospect_email: requestData.email_address || null,
        };
        
        if (linkedinUrl) {
          // Normalize LinkedIn URL before saving to ensure consistency
          const normalizedLinkedInUrl = linkedinUrl.trim().toLowerCase().replace(/\/+$/, '');
          prospectData.prospect_linkedin = normalizedLinkedInUrl;
          
          // Check if prospect already exists (use normalized URL for search)
          const { data: existingProspect } = await supabase
            .from('prospects')
            .select('id')
            .ilike('prospect_linkedin', `%${normalizedLinkedInUrl.split('/in/')[1]?.split('/')[0] || normalizedLinkedInUrl}%`)
            .maybeSingle();

          if (existingProspect) {
            // Update existing prospect
            await supabase
              .from('prospects')
              .update(prospectData)
              .eq('id', existingProspect.id);
            console.log('✅ Updated existing prospect in database');
          } else {
            // Insert new prospect
            await supabase
              .from('prospects')
              .insert([prospectData]);
            console.log('✅ Saved new prospect to database');
          }
        } else if (requestData.full_name && requestData.company_name) {
          // No LinkedIn URL - check by name+company
          const { data: existingProspect } = await supabase
            .from('prospects')
            .select('id')
            .ilike('full_name', requestData.full_name)
            .ilike('company_name', requestData.company_name)
            .maybeSingle();

          if (existingProspect) {
            await supabase
              .from('prospects')
              .update(prospectData)
              .eq('id', existingProspect.id);
            console.log('✅ Updated existing prospect by name+company in database');
          } else {
            await supabase
              .from('prospects')
              .insert([prospectData]);
            console.log('✅ Saved new prospect by name+company to database');
          }
        }
      }

      console.log(`✅ Enriched data saved successfully to Supabase for row ${rowId}`);

    } catch (error) {
      console.error('❌ Error saving enriched data to Supabase:', error);
    }
  };

  const handleBulkEnrichPhonesClick = useCallback(() => {
    requestBulkAccess();
  }, [requestBulkAccess]);

  const handleBulkEnrichEmailsClick = useCallback(() => {
    requestBulkAccess();
  }, [requestBulkAccess]);

  const handleBulkEnrichBothClick = useCallback(() => {
    requestBulkAccess();
  }, [requestBulkAccess]);

  // Full enrichment function with database-first lookup
  const enrichSingleRow = async (rowId: number) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    // Validate LinkedIn URL is present
    if (!row.prospect_linkedin || !validateLinkedInUrl(row.prospect_linkedin)) {
      toast.error("Valid LinkedIn URL required for enrichment");
      return;
    }

    // Add row to enriching set and show loading modal - Start with database search
    setEnrichingRows(prev => new Set(prev).add(rowId));
    setEnrichmentLoading(true);
    setEnrichmentSource("database");
    setEnrichmentStage("searching");
    
    const startTime = Date.now();

    try {
      console.log(`🚀 Starting enrichment for row ${rowId} with LinkedIn: ${row.prospect_linkedin}`);
      
      // STEP 1: Search database first (minimum 3 seconds for database stage with animation)
      console.log("🔍 Searching database...");
      const dbResult = await lookupProspectInDatabase(row.prospect_linkedin);
      
      // Wait minimum 3 seconds so user can see the animation cycle
      const dbElapsed = Date.now() - startTime;
      const dbMinDelay = 3000;
      if (dbElapsed < dbMinDelay) {
        await new Promise(resolve => setTimeout(resolve, dbMinDelay - dbElapsed));
      }

      if (dbResult.found && dbResult.data) {
        console.log("✅ Found in database! Using existing data.");
        
        // Deduplicate phone numbers from database
        const dedupedPhones = deduplicatePhones(
          dbResult.data.prospect_number,
          dbResult.data.prospect_number2,
          dbResult.data.prospect_number3,
          dbResult.data.prospect_number4
        );
        
        // Populate from database with deduplicated phones
        const updates: Partial<RtneRow> = {
          ...dedupedPhones
        };
        
        if (dbResult.data.full_name) updates.full_name = dbResult.data.full_name;
        if (dbResult.data.company_name) updates.company_name = dbResult.data.company_name;
        if (dbResult.data.prospect_designation) updates.prospect_designation = dbResult.data.prospect_designation;
        if (dbResult.data.prospect_city) updates.prospect_city = dbResult.data.prospect_city;
        if (dbResult.data.prospect_email) updates.prospect_email = dbResult.data.prospect_email;

        setRows(prev => prev.map(r =>
          r.id === rowId ? { ...r, ...updates } : r
        ));

        // Save deduplicated data back to Supabase
        await saveEnrichedDataToSupabase(rowId, updates, row);

        // Ensure minimum 10 seconds total
        const totalElapsed = Date.now() - startTime;
        if (totalElapsed < 10000) {
          await new Promise(resolve => setTimeout(resolve, 10000 - totalElapsed));
        }

        const populatedCount = Object.keys(updates).filter(k => updates[k as keyof RtneRow]).length;
        toast.success(`✅ Found in database! Populated ${populatedCount} fields`);
        
        // Track that this row was enriched from database
        setEnrichedFromDbRows(prev => new Set(prev).add(rowId));
        
        setEnrichmentLoading(false);
        return;
      }

      // STEP 2: Show "not found" stage (1.5 seconds)
      console.log("❌ Not found in database.");
      setEnrichmentStage("not_found");
      await new Promise(resolve => setTimeout(resolve, 1500));

      // STEP 3: Switch to Lusha search (minimum 3 seconds)
      console.log("🔍 Searching Lusha...");
      setEnrichmentSource("lusha");
      setEnrichmentStage("searching");
      
      const lushaStartTime = Date.now();
      const result = await enrichProspect(row.prospect_linkedin, "PHONE_ONLY");
      
      // Wait minimum 3 seconds for Lusha animation
      const lushaElapsed = Date.now() - lushaStartTime;
      const lushaMinDelay = 3000;
      if (lushaElapsed < lushaMinDelay) {
        await new Promise(resolve => setTimeout(resolve, lushaMinDelay - lushaElapsed));
      }

      // Ensure minimum 10 seconds total
      const totalElapsed = Date.now() - startTime;
      if (totalElapsed < 10000) {
        await new Promise(resolve => setTimeout(resolve, 10000 - totalElapsed));
      }

      if (result.success) {
        // Smart merge phone numbers - combine existing DB phones with new Lusha phones
        const mergedPhones = mergePhoneNumbers(
          { phone1: row.prospect_number, phone2: row.prospect_number2, phone3: row.prospect_number3, phone4: row.prospect_number4 },
          { phone1: result.phone, phone2: result.phone2, phone3: result.phone3, phone4: result.phone4 }
        );
        
        // Extract ALL fields from the response with merged phones
        const updates: Partial<RtneRow> = {
          ...mergedPhones
        };
        
        if (result.email) updates.prospect_email = result.email;
        if (result.city) updates.prospect_city = result.city;
        if (result.title) updates.prospect_designation = result.title;
        if (result.company) updates.company_name = result.company;
        if (result.companyLinkedInUrl) updates.company_linkedin_url = result.companyLinkedInUrl;
        if (result.fullName) updates.full_name = result.fullName;

        setRows(prev => prev.map(r =>
          r.id === rowId ? { ...r, ...updates } : r
        ));

        // Save deduplicated data to Supabase
        await saveEnrichedDataToSupabase(rowId, updates, row);

        const populatedCount = Object.keys(updates).filter(k => updates[k as keyof RtneRow]).length;
        const creditsInfo = result.creditsRemaining !== null && result.creditsRemaining !== undefined 
          ? ` | Credits left: ${result.creditsRemaining}` 
          : '';
        toast.success(`✅ Enriched ${populatedCount} fields from Lusha${creditsInfo}`, {
          description: result.keyUsed ? `Key used: ${result.keyUsed}` : undefined
        });
        
        console.log(`✅ Enrichment complete:`, updates, `Credits remaining: ${result.creditsRemaining}`);
      } else {
        const creditsInfo = result.creditsRemaining !== null && result.creditsRemaining !== undefined 
          ? ` (Credits left: ${result.creditsRemaining})` 
          : '';
        toast.error(`${result.message || "Enrichment failed"}${creditsInfo}`);
        console.error(`❌ Enrichment failed:`, result.message);
      }
      
      setEnrichmentLoading(false);
      
    } catch (error) {
      console.error(`❌ Single row enrichment error:`, error);
      toast.error("Enrichment failed");
      
      // Ensure minimum 10 seconds even on error
      const totalElapsed = Date.now() - startTime;
      if (totalElapsed < 10000) {
        await new Promise(resolve => setTimeout(resolve, 10000 - totalElapsed));
      }
      
      setEnrichmentLoading(false);
    } finally {
      setEnrichingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(rowId);
        return newSet;
      });
    }
  };

  // Direct Lusha enrichment - skips database lookup
  const enrichFromLushaDirectly = async (rowId: number) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    // Validate LinkedIn URL is present
    if (!row.prospect_linkedin || !validateLinkedInUrl(row.prospect_linkedin)) {
      toast.error("Valid LinkedIn URL required for enrichment");
      return;
    }

    // Add row to enriching set and show loading modal - Start with Lusha directly
    setEnrichingRows(prev => new Set(prev).add(rowId));
    setEnrichmentLoading(true);
    setEnrichmentSource("lusha");
    setEnrichmentStage("enriching_lusha");
    
    const startTime = Date.now();

    try {
      console.log(`🚀 Starting direct Lusha enrichment for row ${rowId}`);
      
      const result = await enrichProspect(row.prospect_linkedin, "PHONE_ONLY");
      
      // Wait minimum 3 seconds for animation
      const elapsed = Date.now() - startTime;
      const minDelay = 3000;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      if (result.success) {
        // Smart merge phone numbers - combine existing DB phones with new Lusha phones
        const mergedPhones = mergePhoneNumbers(
          { phone1: row.prospect_number, phone2: row.prospect_number2, phone3: row.prospect_number3, phone4: row.prospect_number4 },
          { phone1: result.phone, phone2: result.phone2, phone3: result.phone3, phone4: result.phone4 }
        );
        
        // Extract ALL fields from the response with merged phones
        const updates: Partial<RtneRow> = {
          ...mergedPhones
        };
        
        if (result.email) updates.prospect_email = result.email;
        if (result.city) updates.prospect_city = result.city;
        if (result.title) updates.prospect_designation = result.title;
        if (result.company) updates.company_name = result.company;
        if (result.companyLinkedInUrl) updates.company_linkedin_url = result.companyLinkedInUrl;
        if (result.fullName) updates.full_name = result.fullName;

        setRows(prev => prev.map(r =>
          r.id === rowId ? { ...r, ...updates } : r
        ));

        // Save merged data to Supabase
        await saveEnrichedDataToSupabase(rowId, updates, row);

        // Remove from enriched from DB set since we now have Lusha data
        setEnrichedFromDbRows(prev => {
          const newSet = new Set(prev);
          newSet.delete(rowId);
          return newSet;
        });

        const populatedCount = Object.keys(updates).filter(k => updates[k as keyof RtneRow]).length;
        const creditsInfo = result.creditsRemaining !== null && result.creditsRemaining !== undefined 
          ? ` | Credits left: ${result.creditsRemaining}` 
          : '';
        toast.success(`✅ Enriched ${populatedCount} fields from Lusha${creditsInfo}`, {
          description: result.keyUsed ? `Key used: ${result.keyUsed}` : undefined
        });
        
        console.log(`✅ Direct Lusha enrichment complete:`, updates, `Credits remaining: ${result.creditsRemaining}`);
      } else {
        const creditsInfo = result.creditsRemaining !== null && result.creditsRemaining !== undefined 
          ? ` (Credits left: ${result.creditsRemaining})` 
          : '';
        toast.error(`${result.message || "Lusha enrichment failed"}${creditsInfo}`);
        console.error(`❌ Direct Lusha enrichment failed:`, result.message);
      }
      
      setEnrichmentLoading(false);
      
    } catch (error) {
      console.error(`❌ Direct Lusha enrichment error:`, error);
      toast.error("Lusha enrichment failed");
      setEnrichmentLoading(false);
    } finally {
      setEnrichingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(rowId);
        return newSet;
      });
    }
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
      // Delete the record entirely instead of clearing fields
      try {
        const { error } = await supabase
          .from('rtne_requests')
          .delete()
          .eq('id', (row as any).supabaseId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting row from Supabase:', error);
      }
    }
    // Clear local state
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
            // CRITICAL: Call handleChange to save to database
            handleChange(row.id, field, '');
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

      // Use selectionStart (top-left of selection) or fall back to selectedCell
      const startCell = selectionStart || selectedCell;
      if (!startCell) return;

      // Parse clipboard data - handle multiple separators: tabs, newlines, commas
      // Google Sheets uses tabs for columns and newlines for rows
      let rows_data: string[][] = [];
      
      // Check if data is tab-separated (multi-column from Google Sheets)
      if (clipboardText.includes('\t')) {
        // Tab-separated values (TSV) - Google Sheets multi-column copy
        rows_data = clipboardText
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(row => row.split('\t').map(cell => cell.trim()));
      } else if (clipboardText.includes('\n')) {
        // Newline-separated (single column from Google Sheets or plain text list)
        rows_data = clipboardText
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => [line.trim()]);
      } else if (clipboardText.includes(',')) {
        // Comma-separated (CSV style or inline list) - treat each as separate row
        rows_data = clipboardText
          .split(',')
          .filter(item => item.trim() !== '')
          .map(item => [item.trim()]);
      } else {
        // Single value
        rows_data = [[clipboardText.trim()]];
      }

      console.log(`📋 Pasting ${rows_data.length} rows of data from cell ${startCell.rowId}-${startCell.field}`, rows_data.slice(0, 5));

      // Find starting position - use selectionStart for the top-left of selection
      const startRowIndex = rows.findIndex(r => r.id === startCell.rowId);
      const startFieldIndex = fieldOrder.indexOf(startCell.field);

      if (startRowIndex === -1 || startFieldIndex === -1) return;

      // Calculate how many rows we need to add
      const rowsNeeded = rows_data.length;
      const availableRows = rows.length - startRowIndex;
      const rowsToAdd = Math.max(0, rowsNeeded - availableRows);

      // Add new rows if needed (Google Sheets style - auto-expand)
      let updatedRows = [...rows];
      if (rowsToAdd > 0) {
        console.log(`➕ Adding ${rowsToAdd} new rows to accommodate pasted data`);
        for (let i = 0; i < rowsToAdd; i++) {
          updatedRows.push(makeEmptyRow(nextIdRef.current++));
        }
      }

      // Track rows that need saving and validation status
      const rowsToSave: { rowId: number; field: keyof RtneRow; value: string }[] = [];
      let invalidLinkedInCount = 0;

      // Paste data into cells
      rows_data.forEach((rowData, rowOffset) => {
        const targetRowIndex = startRowIndex + rowOffset;
        if (targetRowIndex < updatedRows.length) {
          rowData.forEach((cellValue, colOffset) => {
            const targetFieldIndex = startFieldIndex + colOffset;
            if (targetFieldIndex < fieldOrder.length) {
              const field = fieldOrder[targetFieldIndex];
              const cleanValue = cellValue.trim();
              
              // Validate LinkedIn URLs and count invalid ones
              if (field === 'prospect_linkedin' && cleanValue) {
                if (!validateLinkedInUrl(cleanValue)) {
                  invalidLinkedInCount++;
                }
              }
              
              // Update the row in memory
              updatedRows[targetRowIndex] = {
                ...updatedRows[targetRowIndex],
                [field]: cleanValue
              };

              // Queue for saving (we'll batch these)
              rowsToSave.push({
                rowId: updatedRows[targetRowIndex].id,
                field,
                value: cleanValue
              });
            }
          });
        }
      });

      // Update state first for immediate UI feedback
      setRows(updatedRows);
      
      // Clear multi-cell selection
      setSelectedCells(new Set());

      // Show progress toast for large pastes
      if (rowsToSave.length > 10) {
        toast.loading(`Saving ${rowsToSave.length} cells...`, { id: 'bulk-paste' });
      }

      // Batch save all changes with small delays to avoid overwhelming
      const BATCH_SIZE = 50;
      for (let i = 0; i < rowsToSave.length; i += BATCH_SIZE) {
        const batch = rowsToSave.slice(i, i + BATCH_SIZE);
        
        // Process batch in parallel
        await Promise.all(batch.map(({ rowId, field, value }) => 
          handleChange(rowId, field, value)
        ));
        
        // Yield to UI thread between batches
        if (i + BATCH_SIZE < rowsToSave.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Dismiss loading toast and show success with validation warnings
      if (invalidLinkedInCount > 0) {
        toast.warning(`⚠️ Pasted ${rows_data.length} rows - ${invalidLinkedInCount} invalid LinkedIn URL(s) highlighted in red`, { id: 'bulk-paste', duration: 5000 });
      } else if (rowsToSave.length > 10) {
        toast.success(`✅ Pasted ${rows_data.length} rows successfully!`, { id: 'bulk-paste' });
      } else if (rows_data.length > 1) {
        toast.success(`✅ Pasted ${rows_data.length} items`);
      }

      console.log(`✅ Bulk paste complete: ${rows_data.length} rows, ${rowsToSave.length} cells updated, ${invalidLinkedInCount} invalid LinkedIn URLs`);

    } catch (error) {
      console.error('Error pasting:', error);
      toast.error('Failed to paste data');
    }
  }, [selectedCell, selectionStart, rows, fieldOrder, handleChange, makeEmptyRow]);

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

  // Handle phone disposition (correct/wrong/reset)
  const handlePhoneDisposition = async (
    rowId: number,
    supabaseId: string | undefined,
    phoneIndex: 1 | 2 | 3 | 4,
    disposition: 'correct' | 'wrong' | null
  ) => {
    if (!supabaseId) {
      toast.error("Row not saved yet. Please wait for auto-save.");
      return;
    }

    try {
      const dispositionColumn = `phone${phoneIndex}_disposition`;
      const dispositionAtColumn = `phone${phoneIndex}_disposition_at`;
      const dispositionByColumn = `phone${phoneIndex}_disposition_by`;

      const { error } = await supabase
        .from('rtne_requests')
        .update({
          [dispositionColumn]: disposition,
          [dispositionAtColumn]: disposition ? new Date().toISOString() : null,
          [dispositionByColumn]: disposition ? user?.id : null,
        } as any)
        .eq('id', supabaseId);

      if (error) throw error;

      // Update local state
      setRows(prev => prev.map(row => {
        if (row.id === rowId) {
          const dispositionField = `phone${phoneIndex}_disposition` as keyof RtneRow;
          return { ...row, [dispositionField]: disposition };
        }
        return row;
      }));

      if (disposition === null) {
        toast.success("↩ Disposition reset");
      } else {
        toast.success(
          disposition === 'correct' 
            ? "✓ Number marked as correct!" 
            : "✗ Number marked as wrong"
        );
      }
    } catch (error) {
      console.error('Error saving disposition:', error);
      toast.error("Failed to save disposition");
    }
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

  // Global horizontal scrollbar setup
  useEffect(() => {
    const tableEl = tableScrollRef.current;
    const tableNode = tableElementRef.current;
    const bottomEl = bottomScrollRef.current;
    if (!tableEl || !tableNode || !bottomEl) return;

    const updateWidth = () => {
      setTableContentWidth(tableNode.scrollWidth);
      bottomEl.scrollLeft = tableEl.scrollLeft;
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(tableNode);

    let syncingFromTable = false;
    let syncingFromBottom = false;

    const handleTableScroll = () => {
      if (syncingFromBottom) return;
      syncingFromTable = true;
      bottomEl.scrollLeft = tableEl.scrollLeft;
      syncingFromTable = false;
    };

    const handleBottomScroll = () => {
      if (syncingFromTable) return;
      syncingFromBottom = true;
      tableEl.scrollLeft = bottomEl.scrollLeft;
      syncingFromBottom = false;
    };

    tableEl.addEventListener('scroll', handleTableScroll);
    bottomEl.addEventListener('scroll', handleBottomScroll);

    return () => {
      resizeObserver.disconnect();
      tableEl.removeEventListener('scroll', handleTableScroll);
      bottomEl.removeEventListener('scroll', handleBottomScroll);
    };
  }, []);

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
    <div className="min-h-screen bg-[#F3F2EF] flex flex-col">
      {/* LinkedIn-style Header */}
      <header className="bg-white shadow-sm z-20 sticky top-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-4xl text-[#0A66C2]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-gray-500">
                <button
                  type="button"
                  aria-label="Toggle table view"
                  className="p-1.5 rounded-full hover:bg-gray-100 border border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A66C2]"
                >
                  <Table className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Open settings"
                  className="p-1.5 rounded-full hover:bg-gray-100 border border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A66C2]"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Create new sheet"
                  className="p-1.5 rounded-full hover:bg-gray-100 border border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A66C2]"
                >
                  <FilePlus2 className="h-4 w-4" />
                </button>
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
                {isAdmin() ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md flex items-center">
                        <span>Bulk Enrichment</span>
                        <ChevronDown className="h-4 w-4 ml-1 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem disabled={isBulkEnriching} onClick={handleBulkEnrichPhonesClick}>
                        Enrich Phones
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={isBulkEnriching} onClick={handleBulkEnrichEmailsClick}>
                        Enrich Emails
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={isBulkEnriching} onClick={handleBulkEnrichBothClick}>
                        Enrich Both
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="text-gray-600 px-2 py-1 rounded-md flex items-center cursor-not-allowed"
                        onClick={() => toast.error("Bulk Enrichment is restricted to Admin users only. Please contact your administrator for access.")}
                      >
                        <Lock className="h-4 w-4 mr-1 text-gray-500" />
                        <span>Bulk Enrichment</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Admin access required. Contact your administrator for access.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
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
            {isBulkEnriching && (
              <span className="sr-only" aria-live="polite">
                Enriching {bulkEnrichProgress.current}/{bulkEnrichProgress.total} rows
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Spreadsheet Table */}
      <main className="flex-1 w-full px-0 flex flex-col min-h-0">
        {isLoadingData ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
            <span className="ml-2 text-gray-600">Loading your data...</span>
          </div>
        ) : (
          <div className="rtne-wrapper flex-1 flex flex-col bg-white min-h-0">
            <div 
              ref={tableScrollRef}
              id="rtne-scroll-container"
              className="flex-1 overflow-y-auto overflow-x-auto min-h-0"
            >
              <table ref={tableElementRef} className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 w-12 sticky left-0 z-10 text-gray-500">#</th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-600" />
                      Full Name
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[300px]">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn Profile URL
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[250px]">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-600" />
                      Email Address
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
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[200px]">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-gray-600" />
                      Company Name
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[300px]">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      Company LinkedIn URL
                    </div>
                  </th>
                  <th className="px-3 py-2 border-b border-r border-gray-300 text-sm font-semibold text-gray-700 bg-gray-200 text-left sticky top-0 min-w-[150px]">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                      Prospect City
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
                      // Display each field's own value (no concatenation)
                      let cellValue = row[field] as string || '';
                      
                      const isSelected = isCellSelected(row.id, field);
                      const isCurrentlyEditing = isSelected && isEditing;
                      
                      // Check for invalid LinkedIn URL
                      const isInvalidLinkedIn = field === 'prospect_linkedin' && cellValue && cellValue.trim() && !validateLinkedInUrl(cellValue);

                      return (
                        <td
                          key={field}
                          className={`px-3 py-2 border-b border-r text-sm cursor-pointer ${
                            isInvalidLinkedIn 
                              ? 'border-red-400 bg-red-50' 
                              : 'border-gray-300'
                          } ${isSelected
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
                          {/* Cell content with enrichment button for phone/email fields */}
                          <div className="flex items-center gap-1 w-full">
                            {/* Phone disposition indicator - show if disposition exists */}
                            {(field === 'prospect_number' || field === 'prospect_number2' || field === 'prospect_number3' || field === 'prospect_number4') && (() => {
                              const phoneIndex = field === 'prospect_number' ? 1 : field === 'prospect_number2' ? 2 : field === 'prospect_number3' ? 3 : 4;
                              const dispositionField = `phone${phoneIndex}_disposition` as keyof RtneRow;
                              const disposition = row[dispositionField] as 'correct' | 'wrong' | null | undefined;
                              
                              if (disposition) {
                                return (
                                  <div className={`flex-shrink-0 ${disposition === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
                                    {disposition === 'correct' ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            
                            <input
                              data-cell={`${row.id}-${field}`}
                              className={`flex-1 border-none focus:ring-0 focus:outline-none p-0 bg-transparent text-sm font-medium ${
                                // Style LinkedIn URLs - red for invalid
                                field === 'prospect_linkedin' && cellValue && cellValue.trim() && !validateLinkedInUrl(cellValue)
                                  ? 'text-red-600 bg-red-50'
                                  : ''
                              } ${
                                // Style phone numbers based on disposition
                                (field === 'prospect_number' || field === 'prospect_number2' || field === 'prospect_number3' || field === 'prospect_number4') ? (() => {
                                  const phoneIndex = field === 'prospect_number' ? 1 : field === 'prospect_number2' ? 2 : field === 'prospect_number3' ? 3 : 4;
                                  const dispositionField = `phone${phoneIndex}_disposition` as keyof RtneRow;
                                  const disposition = row[dispositionField] as 'correct' | 'wrong' | null | undefined;
                                  if (disposition === 'correct') return 'text-green-700';
                                  if (disposition === 'wrong') return 'text-red-500 line-through';
                                  return '';
                                })() : ''
                              }`}
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
                            
                            {/* Phone disposition buttons - show for phone fields with values */}
                            {(field === 'prospect_number' || field === 'prospect_number2' || field === 'prospect_number3' || field === 'prospect_number4') && cellValue && cellValue.trim() && (() => {
                              const phoneIndex = field === 'prospect_number' ? 1 : field === 'prospect_number2' ? 2 : field === 'prospect_number3' ? 3 : 4;
                              const dispositionField = `phone${phoneIndex}_disposition` as keyof RtneRow;
                              const disposition = row[dispositionField] as 'correct' | 'wrong' | null | undefined;
                              
                              if (!disposition) {
                                // No disposition yet - show correct/wrong buttons
                                return (
                                  <div className="flex-shrink-0 flex items-center gap-0.5">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePhoneDisposition(row.id, row.supabaseId, phoneIndex, 'correct');
                                          }}
                                          className="p-1 hover:bg-green-100 rounded transition-colors text-green-600 hover:text-green-700"
                                          aria-label="Mark as correct number"
                                        >
                                          <Check className="h-4 w-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>✓ Correct number - Call connected</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePhoneDisposition(row.id, row.supabaseId, phoneIndex, 'wrong');
                                          }}
                                          className="p-1 hover:bg-red-100 rounded transition-colors text-red-500 hover:text-red-600"
                                          aria-label="Mark as wrong number"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>✗ Wrong number - Invalid/disconnected</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                );
                              } else {
                                // Disposition exists - show reset button
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePhoneDisposition(row.id, row.supabaseId, phoneIndex, null);
                                        }}
                                        className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
                                        aria-label="Reset disposition"
                                      >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>↩ Reset - Undo disposition</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }
                            })()}
                            
                            {/* Add enrichment button for LinkedIn URL cell - Full enrichment for ALL fields */}
                            {field === 'prospect_linkedin' && row.prospect_linkedin && validateLinkedInUrl(row.prospect_linkedin) && (
                              enrichedFromDbRows.has(row.id) || (row.prospect_number && row.prospect_number.trim()) ? (
                                // Show dropdown when row already has data
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      disabled={enrichingRows.has(row.id)}
                                      className="flex-shrink-0 p-1 hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Enrichment options"
                                    >
                                      {enrichingRows.has(row.id) ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                                      ) : (
                                        <div className="flex items-center">
                                          <Play className="h-3.5 w-3.5 text-green-600" />
                                          <ChevronDown className="h-2.5 w-2.5 text-green-600 ml-0.5" />
                                        </div>
                                      )}
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        enrichSingleRow(row.id);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Play className="h-4 w-4 mr-2 text-green-600" />
                                      Enrich (Database First)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        enrichFromLushaDirectly(row.id);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <svg className="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                      </svg>
                                      Enrich from Lusha
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                // Show simple play button for first-time enrichment
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    enrichSingleRow(row.id);
                                  }}
                                  disabled={enrichingRows.has(row.id)}
                                  className="flex-shrink-0 p-1 hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Full enrichment: Phone, Email, City, Job Title, Company Name, Company LinkedIn"
                                >
                                  {enrichingRows.has(row.id) ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                                  ) : (
                                    <Play className="h-3.5 w-3.5 text-green-600 hover:text-green-700" />
                                  )}
                                </button>
                              )
                            )}
                          </div>
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

            {/* Custom Horizontal Scrollbar - Google Sheets Style */}
            <div 
              ref={bottomScrollRef}
              id="rtne-bottom-scroll"
              style={{ 
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                height: '24px',
                overflowX: 'auto',
                overflowY: 'hidden',
                background: '#f8f9fa',
                borderTop: '1px solid #e0e0e0',
                zIndex: 999,
                width: '100%'
              }}
            >
              <div 
                id="rtne-scroll-inner" 
                style={{ 
                  width: `${Math.max(tableContentWidth, 2000)}px`, 
                  height: '20px',
                  minWidth: '2000px'
                }} 
              />
            </div>

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
            </div>
        )}
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

      {/* Enrichment Loading Modal */}
      <EnrichmentLoadingModal 
        isOpen={enrichmentLoading} 
        searchSource={enrichmentSource}
        stage={enrichmentStage}
      />
    </div>
  );
};

export default Rtne;