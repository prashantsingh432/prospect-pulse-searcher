import React, { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Download, UploadCloud, AlertTriangle, Shield, CheckCircle, ArrowRight, Table2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// ── DB target columns with friendly labels ──────────────────────────────────
const DB_COLUMNS = [
  { value: "__skip__",           label: "— Skip this column —" },
  { value: "full_name",          label: "Prospect Name" },
  { value: "company_name",       label: "Company Name" },
  { value: "company_domain",     label: "Company Domain" },
  { value: "company_linkedin_url", label: "Company LinkedIn URL" },
  { value: "prospect_linkedin",  label: "Prospect LinkedIn URL" },
  { value: "prospect_designation", label: "Designation / Job Title" },
  { value: "prospect_city",      label: "Prospect Current Location" },
  { value: "prospect_located_from", label: "Prospect Located From" },
  { value: "prospect_email",     label: "Email Address" },
  { value: "prospect_number",    label: "Contact No. 1" },
  { value: "prospect_number2",   label: "Contact No. 2" },
  { value: "prospect_number3",   label: "Contact No. 3" },
  { value: "prospect_number4",   label: "Contact No. 4" },
  { value: "prospect_number5",   label: "Contact No. 5" },
];

// No auto-mapping — admin maps every column manually
const autoMap = (_header: string): string => {
  return "__skip__";
};

// CSV parsers
const csvEscape = (val: any) => {
  if (val === null || val === undefined) return "";
  const s = String(val);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const parseCSV = (text: string): string[][] => {
  const lines: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"') { cur += c; if (inQ && n === '"') { cur += n; i++; } else inQ = !inQ; }
    else if ((c === '\n' || (c === '\r' && n === '\n')) && !inQ) {
      if (cur.trim()) lines.push(cur); cur = ''; if (c === '\r') i++;
    } else cur += c;
  }
  if (cur.trim()) lines.push(cur);
  return lines.map(line => {
    const res: string[] = []; let field = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i], n = line[i + 1];
      if (c === '"') { if (q && n === '"') { field += '"'; i++; } else q = !q; }
      else if (c === ',' && !q) { res.push(field.trim()); field = ''; }
      else field += c;
    }
    res.push(field.trim());
    return res;
  });
};

// ── Main Component ───────────────────────────────────────────────────────────
export const DataManagement: React.FC = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Steps: "select" | "map" | "upload"
  const [step, setStep] = useState<"select" | "map" | "upload">("select");

  // CSV data
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Upload options
  const [uploadType, setUploadType] = useState<"upload" | "overwrite">("upload");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [existingRecordCount, setExistingRecordCount] = useState(0);

  // Status
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [uploadStats, setUploadStats] = useState<{ total: number; processed: number } | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadTimestamp, setDownloadTimestamp] = useState("");
  const [dbStats, setDbStats] = useState<{ total: number; withLinkedin: number; withEmail: number; withPhone: number } | null>(null);

  // Load stats on mount
  React.useEffect(() => { loadDbStats(); }, []);

  const loadDbStats = async () => {
    const { count: total } = await supabase.from("prospects").select("*", { count: "exact", head: true });
    const { count: withLinkedin } = await supabase.from("prospects").select("*", { count: "exact", head: true }).not("prospect_linkedin", "is", null).neq("prospect_linkedin", "");
    const { count: withEmail } = await supabase.from("prospects").select("*", { count: "exact", head: true }).not("prospect_email", "is", null).neq("prospect_email", "");
    const { count: withPhone } = await supabase.from("prospects").select("*", { count: "exact", head: true }).not("prospect_number", "is", null);
    setDbStats({ total: total || 0, withLinkedin: withLinkedin || 0, withEmail: withEmail || 0, withPhone: withPhone || 0 });
  };

  // ── Step 1: File selected → read headers ──────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Invalid File", description: "Only CSV files are supported", variant: "destructive" });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Max 25MB", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length < 2) {
      toast({ title: "Empty File", description: "File has no data rows", variant: "destructive" });
      return;
    }
    const headers = parsed[0];
    const rows = parsed.slice(1, 6); // preview first 5 rows
    setCsvHeaders(headers);
    setCsvRows(rows);
    // Auto-map columns
    const mapping: Record<string, string> = {};
    headers.forEach(h => { mapping[h] = autoMap(h); });
    setColumnMapping(mapping);
    setStep("map");
  };

  // ── Step 2: Proceed to upload ─────────────────────────────────────────────
  const handleProceedToUpload = async () => {
    // Check at least one column is mapped
    const mapped = Object.values(columnMapping).filter(v => v !== "__skip__");
    if (mapped.length === 0) {
      toast({ title: "No Columns Mapped", description: "Please map at least one column to a database field", variant: "destructive" });
      return;
    }
    if (uploadType === "overwrite") {
      const { count } = await supabase.from("prospects").select("*", { count: "exact", head: true });
      setExistingRecordCount(count || 0);
      setShowConfirmDialog(true);
    } else {
      await doUpload();
    }
  };

  // ── Step 3: Do actual upload with mapping ─────────────────────────────────
  const doUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setShowConfirmDialog(false);
    setBackupConfirmed(false);
    setStep("upload");

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      const headers = parsed[0];
      const dataRows = parsed.slice(1);

      setProgress(`Mapping ${dataRows.length} rows...`);

      // Apply mapping
      const allowedDbCols = DB_COLUMNS.filter(c => c.value !== "__skip__").map(c => c.value);
      const records = dataRows.map(cells => {
        const rec: Record<string, any> = {};
        headers.forEach((h, i) => {
          const dbCol = columnMapping[h];
          if (dbCol && dbCol !== "__skip__" && allowedDbCols.includes(dbCol)) {
            const val = cells[i]?.trim() || null;
            rec[dbCol] = val === "" || val === "null" ? null : val;
          }
        });
        // Fill required NOT NULL fields
        rec.full_name = rec.full_name || "Unknown";
        rec.company_name = rec.company_name || "Unknown";
        return rec;
      });

      // Filter: must have at least linkedin or a name that's not "Unknown"
      const validRecords = records.filter(r =>
        (r.prospect_linkedin && r.prospect_linkedin.trim()) || r.full_name !== "Unknown"
      );

      setUploadStats({ total: validRecords.length, processed: 0 });

      // Handle overwrite
      if (uploadType === "overwrite") {
        setProgress("Deleting existing data...");
        await supabase.from("prospects").delete().neq("id", 0);
        setProgress("Deleted. Uploading new data...");
      }

      // Batch insert
      const chunkSize = 500;
      let processed = 0;
      for (let i = 0; i < validRecords.length; i += chunkSize) {
        const chunk = validRecords.slice(i, i + chunkSize);
        setProgress(`Uploading records ${i + 1}–${Math.min(i + chunkSize, validRecords.length)} of ${validRecords.length}...`);
        const { error } = await supabase.from("prospects").insert(chunk);
        if (error) throw new Error(`DB error at batch ${i + 1}: ${error.message}`);
        processed += chunk.length;
        setUploadStats({ total: validRecords.length, processed });
        await new Promise(r => setTimeout(r, 100));
      }

      await supabase.from("audit_logs").insert({
        action: uploadType === "overwrite" ? "data_overwrite" : "data_upload",
        target_table: "prospects",
        details: { record_count: processed, filename: selectedFile.name, timestamp: new Date().toISOString() }
      });

      loadDbStats();
      setProgress("");
      toast({ title: "Upload Successful", description: `Imported ${processed} records successfully` });

      // Reset
      setStep("select");
      setCsvHeaders([]);
      setCsvRows([]);
      setColumnMapping({});
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";

    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
      setStep("map");
    } finally {
      setIsUploading(false);
      setUploadStats(null);
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setIsDownloading(true);
    setProgress("Fetching data...");
    setDownloadComplete(false);
    try {
      let allRows: any[] = [], from = 0, batch = 0;
      while (true) {
        const { data, error } = await supabase.from("prospects").select("*").range(from, from + 999);
        if (error) throw new Error(error.message);
        allRows = allRows.concat(data || []);
        batch++;
        setProgress(`Fetched ${allRows.length} rows...`);
        if ((data?.length || 0) < 1000 || batch > 100) break;
        from += 1000;
      }
      if (allRows.length === 0) {
        toast({ title: "No data to export" });
        return;
      }
      const headers = Object.keys(allRows[0]);
      const csv = [headers.join(","), ...allRows.map(r => headers.map(h => csvEscape(r[h])).join(","))].join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = `prospects-backup-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      const ts = new Date().toLocaleString();
      setDownloadComplete(true);
      setDownloadTimestamp(ts);
      toast({ title: "Download Complete", description: `Exported ${allRows.length} records` });
      await supabase.from("audit_logs").insert({ action: "data_export", target_table: "prospects", details: { record_count: allRows.length } });
    } catch (err: any) {
      toast({ title: "Download Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsDownloading(false);
      setProgress("");
    }
  };

  // ── Count mapped/unmapped columns ─────────────────────────────────────────
  const mappedCount = Object.values(columnMapping).filter(v => v !== "__skip__").length;
  const skippedCount = Object.values(columnMapping).filter(v => v === "__skip__").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Prospects", value: dbStats?.total, color: "text-gray-800" },
          { label: "With LinkedIn", value: dbStats?.withLinkedin, color: "text-blue-600" },
          { label: "With Email", value: dbStats?.withEmail, color: "text-green-600" },
          { label: "With Phone", value: dbStats?.withPhone, color: "text-orange-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value?.toLocaleString() ?? "..."}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Download Card ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download className="h-4 w-4" /> Download Backup</CardTitle>
            <CardDescription>Export all prospects as CSV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleDownload} disabled={isDownloading} className="w-full" size="lg">
              {isDownloading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Exporting...</> : <><Download className="h-4 w-4 mr-2" />Download CSV Backup</>}
            </Button>
            {isDownloading && progress && <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">{progress}</p>}
            {downloadComplete && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  <strong>Backup ready!</strong> Downloaded at {downloadTimestamp}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* ── Upload Card ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UploadCloud className="h-4 w-4" /> Upload Data</CardTitle>
            <CardDescription>
              {step === "select" && "Select a CSV file to import. You'll map the columns next."}
              {step === "map" && "Map your CSV columns to the correct database fields."}
              {step === "upload" && "Uploading your data…"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs font-medium">
              {["Select File", "Map Columns", "Upload"].map((s, i) => {
                const active = (step === "select" && i === 0) || (step === "map" && i === 1) || (step === "upload" && i === 2);
                const done = (step === "map" && i === 0) || (step === "upload" && i <= 1);
                return (
                  <React.Fragment key={s}>
                    <span className={`px-2 py-1 rounded-full ${active ? "bg-indigo-600 text-white" : done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                      {done ? "✓" : i + 1}. {s}
                    </span>
                    {i < 2 && <ArrowRight className="h-3 w-3 text-gray-300" />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* ── Step 1: File Select ── */}
            {step === "select" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="csvFile">Choose CSV File</Label>
                  <Input id="csvFile" type="file" accept=".csv" ref={fileRef} onChange={handleFileChange} className="mt-1" />
                  <p className="text-xs text-gray-500 mt-1">Max 25MB. Any column names — you'll map them in the next step.</p>
                </div>
                <div>
                  <Label>Operation Type</Label>
                  <Select value={uploadType} onValueChange={(v: any) => setUploadType(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upload"><div><p>Upload / Append</p><p className="text-xs text-gray-500">Add new records to existing data</p></div></SelectItem>
                      <SelectItem value="overwrite"><div><p>⚠️ Overwrite All</p><p className="text-xs text-red-500">Replace entire dataset</p></div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ── Step 2: Column Mapping ── */}
            {step === "map" && (
              <div className="space-y-4">
                {/* Summary badges */}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">{mappedCount} mapped</Badge>
                  <Badge variant="outline" className="text-gray-500">{skippedCount} skipped</Badge>
                  <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">{csvHeaders.length} total columns</Badge>
                </div>

                {/* Mapping rows */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b">
                    <span>YOUR CSV COLUMN</span>
                    <span>MAPS TO DATABASE FIELD</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y">
                    {csvHeaders.map(h => (
                      <div key={h} className="grid grid-cols-2 items-center px-3 py-2 gap-3 hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate">{h}</p>
                          <p className="text-xs text-gray-400 truncate">{csvRows[0]?.[csvHeaders.indexOf(h)] || "—"}</p>
                        </div>
                        <Select
                          value={columnMapping[h] || "__skip__"}
                          onValueChange={val => setColumnMapping(prev => ({ ...prev, [h]: val }))}
                        >
                          <SelectTrigger className={`h-8 text-xs ${columnMapping[h] && columnMapping[h] !== "__skip__" ? "border-green-400 bg-green-50" : "border-gray-200"}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DB_COLUMNS.map(col => (
                              <SelectItem key={col.value} value={col.value} className="text-xs">{col.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Database Preview — shows only mapped columns by target DB field */}
                {csvRows.length > 0 && (() => {
                  // Build preview columns: only mapped (non-skip) headers
                  const mappedCols = csvHeaders
                    .map((h, idx) => ({
                      csvHeader: h,
                      csvIndex: idx,
                      dbCol: columnMapping[h],
                      dbLabel: DB_COLUMNS.find(c => c.value === columnMapping[h])?.label,
                    }))
                    .filter(c => c.dbCol && c.dbCol !== "__skip__" && c.dbLabel);

                  return (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                        <Table2 className="h-3 w-3" /> DATABASE PREVIEW — How your data will be stored ({mappedCols.length} columns)
                      </p>
                      {mappedCols.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-3">Map at least one column above to see a preview.</p>
                      ) : (
                        <div className="overflow-x-auto border rounded text-xs" key={JSON.stringify(columnMapping)}>
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                {mappedCols.map(col => (
                                  <th key={col.csvHeader} className="px-3 py-2 text-left whitespace-nowrap border-r last:border-0">
                                    <span className="block font-semibold text-indigo-700">{col.dbLabel}</span>
                                    <span className="block font-normal text-gray-400 text-[10px]">← {col.csvHeader}</span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvRows.slice(0, 3).map((row, ri) => (
                                <tr key={ri} className="border-t hover:bg-gray-50">
                                  {mappedCols.map(col => (
                                    <td key={col.csvHeader} className="px-3 py-1.5 text-gray-700 max-w-[180px] truncate border-r last:border-0">
                                      {row[col.csvIndex]?.trim() || "—"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {skippedCount > 0 && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {skippedCount} column{skippedCount > 1 ? "s" : ""} skipped: {csvHeaders.filter(h => !columnMapping[h] || columnMapping[h] === "__skip__").join(", ")}
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setStep("select"); if (fileRef.current) fileRef.current.value = ""; }}>← Back</Button>
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleProceedToUpload} disabled={mappedCount === 0}>
                    Upload {mappedCount} Mapped Columns <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Uploading ── */}
            {step === "upload" && (
              <div className="space-y-3">
                {isUploading ? (
                  <div className="text-center py-8 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-700">{progress}</p>
                    {uploadStats && (
                      <div className="space-y-1">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.round((uploadStats.processed / uploadStats.total) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">{uploadStats.processed} / {uploadStats.total} records</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => setStep("select")}>← Start New Import</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security notice */}
      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Security:</strong> File validation, column-level mapping, audit logging, and confirmation required for overwrite operations.
        </AlertDescription>
      </Alert>

      {/* Overwrite confirm dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Confirm Overwrite
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 font-semibold">{existingRecordCount.toLocaleString()} records will be permanently deleted</p>
              </div>
              <p className="text-gray-700">This will replace your entire prospects database with the uploaded file. <strong>This cannot be undone.</strong></p>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-3">
                <input type="checkbox" id="bk" checked={backupConfirmed} onChange={e => setBackupConfirmed(e.target.checked)} className="mt-1 h-4 w-4" />
                <label htmlFor="bk" className="text-sm text-amber-700 cursor-pointer">I have downloaded a backup and verified my upload file is correct.</label>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowConfirmDialog(false); setBackupConfirmed(false); }}>Cancel</Button>
            <Button variant="destructive" onClick={doUpload} disabled={!backupConfirmed}>Yes, Overwrite All Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
