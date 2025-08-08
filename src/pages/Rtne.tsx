import React, { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { validateLinkedInUrl } from "@/utils/linkedInUtils";
import { useNavigate } from "react-router-dom";
import { Info, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

interface RtneRow {
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
}

const Rtne: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [row, setRow] = useState<RtneRow>({ prospect_linkedin: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const projectName = user?.projectName || "Unknown Project";

  useEffect(() => {
    // Basic SEO for the page
    const title = "RTNE | Real-Time Email & Number";
    document.title = title;

    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Run Real-Time Email & Number (RTNE) enrichment for a LinkedIn prospect profile.');
    document.head.appendChild(meta);

    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    document.head.appendChild(link);
  }, []);

  const handleChange = (field: keyof RtneRow, value: string) => {
    setRow((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = useMemo(() => {
    return !!row.prospect_linkedin && validateLinkedInUrl(row.prospect_linkedin);
  }, [row.prospect_linkedin]);

  const handleSubmit = async () => {
    setError(null);
    setErrorDetails(null);
    setResult(null);

    if (!validateLinkedInUrl(row.prospect_linkedin || "")) {
      setError("Invalid LinkedIn URL. Please enter a valid profile link.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("rtne-check-or-create", {
        body: { projectName, row },
      });

      if (error) {
        throw error;
      }

      setResult(data);
    } catch (e: any) {
      console.error("RTNE error:", e);
      setError(e?.message || "Failed to send a request to the Edge Function");
      setErrorDetails(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Real-Time Email & Number (RTNE)</h1>
          <p className="text-sm text-muted-foreground mt-1">Run enrichment for a single LinkedIn profile.</p>
        </header>

        {/* Project Banner */}
        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Project Name:</span> {projectName}
                </div>
                <Button variant="ghost" onClick={() => navigate("/")}>Back to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Error state */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>RTNE failed</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>{error}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>Retry</Button>
                    <Button size="sm" variant="secondary" onClick={() => setErrorDetails((prev: any) => prev ? null : errorDetails)}>
                      {errorDetails ? "Hide details" : "View details"}
                    </Button>
                  </div>
                  {errorDetails && (
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-64">
                      {typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2)}
                    </pre>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Success state */}
        {result && (
          <div className="mb-6">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Processed</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>{result?.message || "RTNE completed successfully."}</p>
                  <details className="text-sm">
                    <summary className="cursor-pointer select-none">View result details</summary>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto mt-2 max-h-64">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Form */}
        <section aria-labelledby="prospect-form">
          <Card>
            <CardHeader>
              <CardTitle id="prospect-form" className="text-base">Prospect Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>prospect_linkedin</TableHead>
                      <TableHead>full_name</TableHead>
                      <TableHead>company_name</TableHead>
                      <TableHead>prospect_city</TableHead>
                      <TableHead>prospect_number</TableHead>
                      <TableHead>prospect_email</TableHead>
                      <TableHead>prospect_number2</TableHead>
                      <TableHead>prospect_number3</TableHead>
                      <TableHead>prospect_number4</TableHead>
                      <TableHead>prospect_designation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="min-w-[260px]">
                        <Input
                          placeholder="https://www.linkedin.com/in/..."
                          value={row.prospect_linkedin || ""}
                          onChange={(e) => handleChange("prospect_linkedin", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="min-w-[160px]"><Input value={row.full_name || ""} onChange={(e) => handleChange("full_name", e.target.value)} /></TableCell>
                      <TableCell className="min-w-[160px]"><Input value={row.company_name || ""} onChange={(e) => handleChange("company_name", e.target.value)} /></TableCell>
                      <TableCell className="min-w-[160px]"><Input value={row.prospect_city || ""} onChange={(e) => handleChange("prospect_city", e.target.value)} /></TableCell>
                      <TableCell className="min-w-[160px]"><Input value={row.prospect_number || ""} onChange={(e) => handleChange("prospect_number", e.target.value)} /></TableCell>
                      <TableCell className="min-w-[200px]"><Input value={row.prospect_email || ""} onChange={(e) => handleChange("prospect_email", e.target.value)} /></TableCell>
                      <TableCell className="min-w-[160px]"><Input value={row.prospect_number2 || ""} onChange={(e) => handleChange("prospect_number2", e.target.value)} /></TableCell>
                      <TableCell className="min-w-[160px]"><Input value={row.prospect_number3 || ""} onChange={(e) => handleChange("prospect_number3", e.target.value)} /></TableCell>
                      <TableCell className="min-w-[160px]"><Input value={row.prospect_number4 || ""} onChange={(e) => handleChange("prospect_number4", e.target.value)} /></TableCell>
                      <TableCell className="min-w-[200px]"><Input value={row.prospect_designation || ""} onChange={(e) => handleChange("prospect_designation", e.target.value)} /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => navigate("/")} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Processing..." : "Run RTNE"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Rtne;
