import React, { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, UploadCloud, Download, Sparkles, Database, Zap, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type EnrichSource = "database" | "lusha" | "both";
type DataType = "phone" | "email" | "both";

interface EnrichedRow {
  linkedin_url: string;
  full_name: string;
  company_name: string;
  prospect_designation: string;
  prospect_email: string;
  prospect_city: string;
  phone1: string;
  phone2: string;
  phone3: string;
  phone4: string;
  source: string;
  status: string;
}

const csvEscape = (val: any) => {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else current += c;
  }
  result.push(current.trim());
  return result;
};

const normalizeLinkedIn = (url: string): string => {
  if (!url) return "";
  let u = url.trim().toLowerCase();
  u = u.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  return u;
};

const extractUsername = (url: string): string => {
  const m = url.match(/\/in\/([^\/\?#]+)/i);
  return m ? m[1].toLowerCase() : "";
};

export const CsvEnrichTool: React.FC = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);
  const [source, setSource] = useState<EnrichSource>("both");
  const [dataType, setDataType] = useState<DataType>("both");
  const [linkedInUrls, setLinkedInUrls] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, found: 0, lushaUsed: 0, dbHits: 0 });
  const [results, setResults] = useState<EnrichedRow[]>([]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return;

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    let liIdx = headers.findIndex(h => h.includes("linkedin"));
    if (liIdx === -1) liIdx = 0;

    const urls: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      const url = cells[liIdx];
      if (url && url.toLowerCase().includes("linkedin.com/in/")) {
        urls.push(url.trim());
      }
    }
    setLinkedInUrls(urls);
    setResults([]);
    toast({ title: "File loaded", description: `Found ${urls.length} LinkedIn URLs` });
  };

  const lookupDatabase = async (url: string): Promise<Partial<EnrichedRow> | null> => {
    const norm = normalizeLinkedIn(url);
    const username = extractUsername(url);

    // Try master_prospects first
    const { data: mp } = await supabase
      .from("master_prospects")
      .select("*")
      .or(`canonical_url.ilike.%${norm}%,linkedin_id.ilike.%${username}%`)
      .limit(1)
      .maybeSingle();

    if (mp && (mp.prospect_number || mp.prospect_number2)) {
      return {
        full_name: mp.full_name || "",
        company_name: mp.company_name || "",
        prospect_designation: mp.prospect_designation || "",
        prospect_email: mp.prospect_email || "",
        prospect_city: mp.prospect_city || "",
        phone1: mp.prospect_number || "",
        phone2: mp.prospect_number2 || "",
        phone3: mp.prospect_number3 || "",
        phone4: mp.prospect_number4 || "",
      };
    }

    // Try prospects table
    const { data: p } = await supabase
      .from("prospects")
      .select("*")
      .ilike("prospect_linkedin", `%${username}%`)
      .limit(1)
      .maybeSingle();

    if (p && (p.prospect_number || p.prospect_number2)) {
      return {
        full_name: p.full_name || "",
        company_name: p.company_name || "",
        prospect_designation: p.prospect_designation || "",
        prospect_email: p.prospect_email || "",
        prospect_city: p.prospect_city || "",
        phone1: p.prospect_number || "",
        phone2: p.prospect_number2 || "",
        phone3: p.prospect_number3 || "",
        phone4: p.prospect_number4 || "",
      };
    }

    return null;
  };

  const lookupLusha = async (url: string): Promise<{ data: Partial<EnrichedRow> | null; error?: string }> => {
    try {
      const preferredCategory = dataType === "email" ? "EMAIL_ONLY" : "PHONE_ONLY";
      const preferredCategories = dataType === "both" ? ["PHONE_ONLY", "EMAIL_ONLY"] : [preferredCategory];

      const baseKeyQuery = () => supabase
        .from("lusha_api_keys")
        .select("id, key_value, credits_remaining, category, last_used_at")
        .eq("is_active", true)
        .eq("status", "ACTIVE")
        .order("last_used_at", { ascending: true, nullsFirst: true })
        .limit(25);

      let { data: keys, error: keyErr } = await baseKeyQuery().in("category", preferredCategories);

      // If admin added keys under the other category, still use them instead of failing.
      if (!keyErr && (!keys || keys.length === 0)) {
        const fallback = await baseKeyQuery();
        keys = fallback.data;
        keyErr = fallback.error;
      }

      if (keyErr) return { data: null, error: keyErr.message };
      if (!keys || keys.length === 0) return { data: null, error: "No active Lusha keys found in manager" };

      let lastError = "No usable Lusha response";

      for (const key of keys) {
        const resp = await fetch(
          `https://lodpoepylygsryjdkqjg.supabase.co/functions/v1/lusha-enrich-proxy`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: key.key_value,
              params: { linkedinUrl: url },
            }),
          }
        );

        const result = await resp.json().catch(() => ({ status: resp.status, error: "Invalid proxy response" }));

        await supabase
          .from("lusha_api_keys")
          .update({
            last_used_at: new Date().toISOString(),
            credits_remaining: result.creditsRemaining ?? key.credits_remaining,
          })
          .eq("id", key.id);

        if (result.status === 401 || result.status === 403) {
          lastError = `Key ...${key.key_value.slice(-4)} invalid (${result.status})`;
          await supabase.from("lusha_api_keys").update({ status: "INVALID", is_active: false }).eq("id", key.id);
          continue;
        }

        if (result.status === 402 || result.status === 429) {
          lastError = `Key ...${key.key_value.slice(-4)} exhausted/rate-limited (${result.status})`;
          await supabase.from("lusha_api_keys").update({ status: "EXHAUSTED", is_active: false, credits_remaining: 0 }).eq("id", key.id);
          continue;
        }

        if (result.status !== 200) {
          lastError = `Lusha HTTP ${result.status || resp.status}`;
          continue;
        }

        const contact = result.data?.contact?.data || result.data?.data || result.data;
        if (!contact) {
          lastError = "No contact data";
          continue;
        }

        const phones = contact.phoneNumbers || contact.phone_numbers || [];
        const getPhone = (p: any) =>
          p?.e164Format || p?.internationalFormat || p?.localFormat || p?.number || "";

        const emailsArr = contact.emailAddresses || contact.emails || contact.email_addresses || [];
        const getEmail = (e: any) => (typeof e === "string" ? e : e?.email || e?.address || "");
        const primaryEmail =
          getEmail(emailsArr[0]) ||
          contact.email ||
          contact.workEmail ||
          contact.work_email ||
          "";

        const enriched = {
          full_name: contact.fullName || contact.name || "",
          company_name:
            contact.company?.name ||
            contact.currentPosition?.company?.name ||
            contact.current_position?.company?.name || "",
          prospect_designation:
            contact.currentPosition?.title ||
            contact.current_position?.title ||
            contact.jobTitle?.title ||
            contact.title || "",
          prospect_email: primaryEmail,
          prospect_city: contact.location?.city || contact.city || "",
          phone1: getPhone(phones[0]),
          phone2: getPhone(phones[1]),
          phone3: getPhone(phones[2]),
          phone4: getPhone(phones[3]),
        };

        const matchesRequest =
          dataType === "phone" ? !!(enriched.phone1 || enriched.phone2) :
          dataType === "email" ? !!enriched.prospect_email :
          !!(enriched.phone1 || enriched.phone2 || enriched.prospect_email);

        if (matchesRequest) return { data: enriched };
        lastError = `No ${dataType === "both" ? "phone/email" : dataType} found`;
      }

      return { data: null, error: lastError };
    } catch (e: any) {
      return { data: null, error: e?.message || "Network error" };
    }
  };

  const startEnrichment = async () => {
    if (linkedInUrls.length === 0) {
      toast({ title: "No URLs", description: "Please upload a CSV first", variant: "destructive" });
      return;
    }

    cancelRef.current = false;
    setProcessing(true);
    setResults([]);
    const out: EnrichedRow[] = [];
    let dbHits = 0;
    let lushaUsed = 0;
    let found = 0;

    for (let i = 0; i < linkedInUrls.length; i++) {
      if (cancelRef.current) break;
      const url = linkedInUrls[i];
      let enriched: Partial<EnrichedRow> | null = null;
      let usedSource = "";

      if (source === "database" || source === "both") {
        enriched = await lookupDatabase(url);
        if (enriched) { dbHits++; usedSource = "Database"; }
      }

      let lushaError = "";
      if (!enriched && (source === "lusha" || source === "both")) {
        const res = await lookupLusha(url);
        if (res.data) { enriched = res.data; lushaUsed++; usedSource = "Lusha"; }
        else { lushaError = res.error || ""; }
      }

      const hasPhone = !!(enriched && (enriched.phone1 || enriched.phone2));
      const hasEmail = !!(enriched && enriched.prospect_email);
      const hasWanted =
        dataType === "phone" ? hasPhone :
        dataType === "email" ? hasEmail :
        (hasPhone || hasEmail);
      if (hasWanted) found++;

      out.push({
        linkedin_url: url,
        full_name: enriched?.full_name || "",
        company_name: enriched?.company_name || "",
        prospect_designation: enriched?.prospect_designation || "",
        prospect_email: enriched?.prospect_email || "",
        prospect_city: enriched?.prospect_city || "",
        phone1: enriched?.phone1 || "",
        phone2: enriched?.phone2 || "",
        phone3: enriched?.phone3 || "",
        phone4: enriched?.phone4 || "",
        source: usedSource || (lushaError ? `Error: ${lushaError}` : "Not Found"),
        status: hasWanted ? "Found" : "Not Found",
      });

      setProgress({ current: i + 1, total: linkedInUrls.length, found, lushaUsed, dbHits });
      setResults([...out]);
    }

    setProcessing(false);
    toast({
      title: cancelRef.current ? "Cancelled" : "Enrichment complete",
      description: `${found}/${linkedInUrls.length} numbers found (DB: ${dbHits}, Lusha: ${lushaUsed})`,
    });
  };

  const downloadCsv = () => {
    if (results.length === 0) return;
    const headers = ["linkedin_url", "full_name", "company_name", "prospect_designation", "prospect_email", "prospect_city", "phone1", "phone2", "phone3", "phone4", "source", "status"];
    const rows = [headers.join(",")];
    results.forEach(r => {
      rows.push(headers.map(h => csvEscape((r as any)[h])).join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enriched_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          CSV LinkedIn Enrichment (Super Admin Only)
        </CardTitle>
        <CardDescription>
          Upload a CSV with LinkedIn URLs to fetch phone numbers from your database, Lusha API, or both.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>What to Extract</Label>
            <Select value={dataType} onValueChange={(v) => setDataType(v as DataType)} disabled={processing}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">📞 Phone Numbers Only</SelectItem>
                <SelectItem value="email">📧 Emails Only</SelectItem>
                <SelectItem value="both">✨ Both Phone + Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Enrichment Source</Label>
            <Select value={source} onValueChange={(v) => setSource(v as EnrichSource)} disabled={processing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="database">
                  <div className="flex items-center gap-2"><Database className="h-4 w-4" /> Database Only (Free)</div>
                </SelectItem>
                <SelectItem value="lusha">
                  <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Lusha Only (Uses Credits)</div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Both (DB first, Lusha fallback)</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CSV File (must contain a LinkedIn URL column)</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              disabled={processing}
              className="block w-full text-sm border rounded p-2"
            />
          </div>
        </div>

        {fileName && (
          <Alert>
            <AlertDescription>
              📄 <strong>{fileName}</strong> — {linkedInUrls.length} LinkedIn URLs detected
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={startEnrichment}
            disabled={processing || linkedInUrls.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {processing ? "Enriching..." : `Start Enrichment (${linkedInUrls.length})`}
          </Button>
          {processing && (
            <Button variant="destructive" onClick={() => { cancelRef.current = true; }}>
              <Square className="h-4 w-4" /> Stop
            </Button>
          )}
          {results.length > 0 && !processing && (
            <Button variant="outline" onClick={downloadCsv}>
              <Download className="h-4 w-4" /> Download Results CSV
            </Button>
          )}
        </div>

        {(processing || progress.total > 0) && (
          <div className="space-y-2">
            <Progress value={pct} />
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="bg-blue-50 p-2 rounded">Progress: <strong>{progress.current}/{progress.total}</strong></div>
              <div className="bg-green-50 p-2 rounded">Found: <strong>{progress.found}</strong></div>
              <div className="bg-purple-50 p-2 rounded">DB Hits: <strong>{progress.dbHits}</strong></div>
              <div className="bg-orange-50 p-2 rounded">Lusha Used: <strong>{progress.lushaUsed}</strong></div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="border rounded max-h-96 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 text-left">LinkedIn</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Phone 1</th>
                  <th className="p-2 text-left">Phone 2</th>
                  <th className="p-2 text-left">Source</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(-50).reverse().map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 truncate max-w-[200px]">{r.linkedin_url}</td>
                    <td className="p-2">{r.full_name}</td>
                    <td className="p-2 font-mono">{r.phone1}</td>
                    <td className="p-2 font-mono">{r.phone2}</td>
                    <td className={`p-2 ${r.status === "Found" ? "text-green-600" : "text-red-500"}`}>{r.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
