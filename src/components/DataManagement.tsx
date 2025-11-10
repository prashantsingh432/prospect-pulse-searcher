import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Download, UploadCloud, AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Simple CSV escaper
const csvEscape = (val: any) => {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};

// Proper CSV parser that handles quoted fields, commas, and newlines
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote within quoted field
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
};

// Parse multi-line CSV properly
const parseCSV = (text: string): string[][] => {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      currentLine += char;
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentLine += nextChar;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      // End of line (not inside quotes)
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r') i++; // Skip \n after \r
    } else {
      currentLine += char;
    }
  }
  
  // Add last line
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  return lines.map(line => parseCSVLine(line));
};

export const DataManagement: React.FC = () => {
  const { toast } = useToast();
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadTimestamp, setDownloadTimestamp] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"overwrite" | "upload">("upload");
  const [progress, setProgress] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ total: number; processed: number } | null>(null);
  const [existingRecordCount, setExistingRecordCount] = useState<number>(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const acceptedTypes = useMemo(() => ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], []);

  // Rate limiting state
  const [lastDownload, setLastDownload] = useState<number>(0);
  const [lastUpload, setLastUpload] = useState<number>(0);
  const RATE_LIMIT_MS = 30000; // 30 seconds between operations

  const handleDownload = async () => {
    // Rate limiting check
    const now = Date.now();
    if (now - lastDownload < RATE_LIMIT_MS) {
      const remaining = Math.ceil((RATE_LIMIT_MS - (now - lastDownload)) / 1000);
      toast({
        title: "Rate limited",
        description: `Please wait ${remaining} seconds before downloading again`,
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);
    setProgress("Preparing export...");
    setDownloadComplete(false);
    setDownloadTimestamp("");

    try {
      // Page through prospects to support large exports
      const pageSize = 1000;
      let from = 0;
      let to = pageSize - 1;
      let allRows: any[] = [];
      let batch = 0;

      while (true) {
        setProgress(`Fetching batch ${batch + 1}...`);
        const { data, error } = await supabase
          .from("prospects")
          .select("*")
          .range(from, to);

        if (error) {
          console.error("Database error:", error);
          throw new Error(`Database error: ${error.message}`);
        }

        const rows = data || [];
        allRows = allRows.concat(rows);
        batch += 1;
        setProgress(`Fetched ${allRows.length} rows (batch ${batch})...`);

        if (rows.length < pageSize) break;
        from += pageSize;
        to += pageSize;

        // Safety check to prevent infinite loops
        if (batch > 100) {
          throw new Error("Too many batches - operation cancelled for safety");
        }
      }

      if (allRows.length === 0) {
        toast({ title: "Export Complete", description: "No data found to export" });
        setDownloadComplete(true);
        setDownloadTimestamp(new Date().toLocaleString());
        setProgress("");
        return;
      }

      setProgress("Generating CSV file...");
      const headers = Object.keys(allRows[0]);
      const lines = [headers.join(",")];
      for (const row of allRows) {
        lines.push(headers.map((h) => csvEscape((row as any)[h])).join(","));
      }

      const csv = lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ts = new Date().toISOString().split("T")[0];
      a.download = `prospects-backup-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const timestamp = new Date().toLocaleString();
      setDownloadComplete(true);
      setDownloadTimestamp(timestamp);
      setLastDownload(now);
      setProgress("");

      toast({
        title: "Download Complete",
        description: `Successfully exported ${allRows.length} records`
      });

      // Log audit trail
      await supabase.from("audit_logs").insert({
        action: "data_export",
        target_table: "prospects",
        details: { record_count: allRows.length, timestamp }
      });

    } catch (err: any) {
      console.error("Download error:", err);
      setDownloadComplete(false);
      setDownloadTimestamp("");
      toast({
        title: "Download Failed",
        description: err.message || "An unexpected error occurred during export",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
      setProgress("");
    }
  };

  const validateFile = (file: File) => {
    const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
    const isExcel = file.name.toLowerCase().endsWith(".xlsx") || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const isAllowedType = isCSV || isExcel;
    const isSmallEnough = file.size <= 25 * 1024 * 1024; // 25MB
    const hasValidName = /^[a-zA-Z0-9._-]+\.(csv|xlsx)$/i.test(file.name);

    return {
      isAllowedType,
      isSmallEnough,
      hasValidName,
      fileType: isCSV ? 'csv' : isExcel ? 'excel' : 'unknown'
    };
  };

  const confirmUpload = async () => {
    if (uploadType === "overwrite") {
      // Fetch current record count
      setProgress("Checking existing records...");
      const { count, error } = await supabase
        .from("prospects")
        .select("*", { count: "exact", head: true });
      
      if (error) {
        console.error("Count error:", error);
        toast({
          title: "Error",
          description: "Failed to check existing records",
          variant: "destructive"
        });
        return;
      }
      
      setExistingRecordCount(count || 0);
      setProgress("");
      setShowConfirmDialog(true);
    } else {
      handleUpload();
    }
  };

  const handleUpload = async () => {
    // Rate limiting check
    const now = Date.now();
    if (now - lastUpload < RATE_LIMIT_MS) {
      const remaining = Math.ceil((RATE_LIMIT_MS - (now - lastUpload)) / 1000);
      toast({
        title: "Rate limited",
        description: `Please wait ${remaining} seconds before uploading again`,
        variant: "destructive"
      });
      return;
    }

    // Validation checks
    if (!downloadComplete) {
      toast({
        title: "Download Required",
        description: "You must download current data before uploading. This ensures you have a backup.",
        variant: "destructive"
      });
      return;
    }

    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please choose a CSV file to upload",
        variant: "destructive"
      });
      return;
    }

    const { isAllowedType, isSmallEnough, hasValidName } = validateFile(file);

    if (!hasValidName) {
      toast({
        title: "Invalid Filename",
        description: "Filename contains invalid characters. Use only letters, numbers, dots, hyphens, and underscores.",
        variant: "destructive"
      });
      return;
    }

    if (!isAllowedType) {
      toast({
        title: "Invalid File Type",
        description: "Only CSV files are currently supported",
        variant: "destructive"
      });
      return;
    }

    if (!isSmallEnough) {
      toast({
        title: "File Too Large",
        description: "File size must be under 25MB. Please split large files into smaller chunks.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setProgress("Validating file...");
    setUploadStats(null);
    setShowConfirmDialog(false);

    try {
      const text = await file.text();
      
      // Use proper CSV parser
      const parsedRows = parseCSV(text);
      
      if (parsedRows.length < 2) {
        throw new Error("File appears to be empty or contains only headers");
      }

      setProgress("Parsing CSV data...");
      
      // Get headers (case-insensitive)
      const headers = parsedRows[0].map((h) => h.trim().toLowerCase());

      // Check for recommended columns (not strictly required anymore)
      const recommendedColumns = ["full_name", "company_name"];
      const missingColumns = recommendedColumns.filter(col => !headers.includes(col.toLowerCase()));
      if (missingColumns.length > 0) {
        console.warn(`Missing recommended columns: ${missingColumns.join(", ")}`);
      }

      // Parse records
      const records = parsedRows.slice(1).map((cells, lineIndex) => {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => {
          const value = cells[i] || null;
          obj[h] = value === "" || value === "null" ? null : value;
        });
        
        // Store original line number for error reporting
        obj._lineNumber = lineIndex + 2; // +2 because: +1 for header, +1 for 1-based indexing
        return obj;
      });

      // Filter out completely blank rows (where all required fields are empty)
      const nonBlankRecords = records.filter(record => {
        const hasFullName = record.full_name && String(record.full_name).trim() !== "";
        const hasCompanyName = record.company_name && String(record.company_name).trim() !== "";
        return hasFullName || hasCompanyName; // Keep row if at least one field has data
      });

      // Filter and normalize data
      // NOTE: "id" is excluded - it's auto-generated by database and shouldn't be imported
      const allowedColumns = [
        "full_name", "company_name", "prospect_city", "prospect_designation",
        "prospect_email", "prospect_linkedin", "prospect_number", "prospect_number2",
        "prospect_number3", "prospect_number4"
      ];

      const normalized = nonBlankRecords.map((record) => {
        const normalized: any = {};
        for (const col of allowedColumns) {
          if (col in record) {
            // Trim all string values before storing
            const value = record[col];
            normalized[col] = (typeof value === 'string') ? value.trim() : value;
          }
        }

        // Note: _lineNumber is kept in 'record' for error tracking but NOT included in database insert
        return normalized;
      });

      // Filter out records with missing required NOT NULL fields (full_name, company_name)
      // These columns have database constraints and cannot be null
      const validRecords = normalized.filter((record) => {
        const fullName = String(record.full_name || "").trim();
        const companyName = String(record.company_name || "").trim();
        return fullName !== "" && companyName !== "";
      });

      const skippedCount = normalized.length - validRecords.length;
      if (skippedCount > 0) {
        console.log(`Skipping ${skippedCount} records with missing full_name or company_name`);
      }

      setUploadStats({ total: validRecords.length, processed: 0 });

      // Handle overwrite mode - delete all existing data first
      if (uploadType === "overwrite") {
        setProgress("Deleting all existing data...");
        
        const { error: deleteError } = await supabase
          .from("prospects")
          .delete()
          .neq('id', 0); // Delete all records (id is always >= 1)

        if (deleteError) {
          console.error("Delete error:", deleteError);
          throw new Error(`Failed to delete existing data: ${deleteError.message}`);
        }

        setProgress("Existing data deleted. Uploading new data...");
      }

      // Batch processing with progress updates
      const chunkSize = 500; // Smaller chunks for better progress tracking
      let processed = 0;

      for (let i = 0; i < validRecords.length; i += chunkSize) {
        const chunk = validRecords.slice(i, i + chunkSize);
        const chunkEnd = Math.min(i + chunkSize, validRecords.length);

        setProgress(`Processing records ${i + 1} to ${chunkEnd} of ${validRecords.length}...`);

        // Use insert for overwrite mode, upsert for upload mode
        if (uploadType === "overwrite") {
          const { error } = await supabase
            .from("prospects")
            .insert(chunk);

          if (error) {
            console.error("Insert error:", error);
            throw new Error(`Database error at records ${i + 1}-${chunkEnd}: ${error.message}`);
          }
        } else {
          const { error } = await supabase
            .from("prospects")
            .upsert(chunk, {
              onConflict: "id",
              ignoreDuplicates: false
            });

          if (error) {
            console.error("Upsert error:", error);
            throw new Error(`Database error at records ${i + 1}-${chunkEnd}: ${error.message}`);
          }
        }

        processed += chunk.length;
        setUploadStats({ total: validRecords.length, processed });

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        action: uploadType === "overwrite" ? "data_overwrite" : "data_upload",
        target_table: "prospects",
        details: {
          record_count: processed,
          filename: file.name,
          timestamp: new Date().toLocaleString(),
          operation_type: uploadType
        }
      });

      setLastUpload(now);
      setProgress("");
      setDownloadComplete(false); // Reset cycle for safety

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      toast({
        title: "Upload Successful",
        description: `Successfully processed ${processed} records using ${uploadType} mode${skippedCount > 0 ? `. Skipped ${skippedCount} rows with missing required fields.` : ''}`
      });

    } catch (err: any) {
      console.error("Upload error:", err);
      setProgress("");
      toast({
        title: "Upload Failed",
        description: err.message || "An unexpected error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadStats(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Admin-only tools to backup and update the prospects dataset. Enhanced with security features and audit logging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Download Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <h3 className="font-semibold">Download Current Data</h3>
              </div>
              <p className="text-sm text-gray-600">
                Export all prospect records as CSV. This creates a backup before making changes.
              </p>

              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full"
                size="lg"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isDownloading ? "Exporting..." : "Download Backup"}
              </Button>

              {progress && isDownloading && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  {progress}
                </div>
              )}

              {downloadComplete && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-700">
                    <strong>Backup Complete!</strong><br />
                    Downloaded at: {downloadTimestamp}<br />
                    You can now safely upload new data.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" />
                <h3 className="font-semibold">Upload New Data</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="file">Choose CSV File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    ref={fileRef}
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max 25MB. Recommended columns: full_name, company_name (rows without data will be skipped)
                  </p>
                </div>

                <div>
                  <Label>Operation Type</Label>
                  <Select
                    value={uploadType}
                    onValueChange={(v) => setUploadType(v as any)}
                    disabled={isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upload">
                        <div className="flex flex-col">
                          <span>Upload / Upsert</span>
                          <span className="text-xs text-gray-500">Add new records, update existing</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="overwrite">
                        <div className="flex flex-col">
                          <span>⚠️ Overwrite All</span>
                          <span className="text-xs text-red-500">Replace entire dataset</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={confirmUpload}
                  disabled={!downloadComplete || isUploading}
                  className="w-full"
                  variant={uploadType === "overwrite" ? "destructive" : "default"}
                  size="lg"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UploadCloud className="h-4 w-4 mr-2" />
                  )}
                  {isUploading ? "Processing..." : `${uploadType === "overwrite" ? "⚠️ Overwrite" : "Upload"} Data`}
                </Button>

                {!downloadComplete && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-amber-700">
                      You must download current data first to ensure you have a backup.
                    </AlertDescription>
                  </Alert>
                )}

                {progress && isUploading && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    {progress}
                    {uploadStats && (
                      <div className="mt-1">
                        Progress: {uploadStats.processed} / {uploadStats.total} records
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Security Features:</strong> Rate limiting (30s), file validation, audit logging, and mandatory backup before upload.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Overwrite */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Overwrite Operation
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 font-semibold text-lg">
                  {existingRecordCount.toLocaleString()} records will be permanently deleted
                </p>
              </div>
              <p className="text-gray-700">
                <strong>⚠️ WARNING:</strong> This will delete all {existingRecordCount.toLocaleString()} existing prospect records and replace them with the contents of your uploaded file.
              </p>
              <p className="text-gray-700">
                <strong>This action cannot be undone.</strong>
              </p>
              <p className="text-gray-600 text-sm">
                Make sure you have downloaded a backup and verified your upload file is correct.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUpload}
            >
              Yes, Overwrite All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

