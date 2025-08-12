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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Info className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Real-Time Email & Number (RTNE)
              </h1>
              <p className="text-muted-foreground mt-1">Enrich LinkedIn profiles with verified contact information</p>
            </div>
          </div>
        </header>

        {/* Enhanced Project Banner */}
        <section className="mb-8">
          <Card className="border-primary/20 shadow-lg bg-gradient-to-r from-card to-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Project</p>
                    <p className="text-xl font-semibold">{projectName}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
                  ← Back to Dashboard
                </Button>
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

        {/* Enhanced Form */}
        <section aria-labelledby="prospect-form">
          <Card className="border-2 border-primary/10 shadow-xl bg-gradient-to-b from-card to-card/50">
            <CardHeader className="pb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle id="prospect-form" className="text-xl font-semibold">Prospect Details</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Fill in LinkedIn URL and any known information</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Primary Field - LinkedIn URL */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3 text-foreground">
                  LinkedIn Profile URL <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="https://www.linkedin.com/in/example-profile"
                    value={row.prospect_linkedin || ""}
                    onChange={(e) => handleChange("prospect_linkedin", e.target.value)}
                    className={`h-12 text-base transition-all duration-200 ${
                      row.prospect_linkedin && !validateLinkedInUrl(row.prospect_linkedin) 
                        ? 'border-destructive focus:border-destructive' 
                        : 'focus:border-primary'
                    }`}
                  />
                  {row.prospect_linkedin && validateLinkedInUrl(row.prospect_linkedin) && (
                    <CheckCircle2 className="absolute right-3 top-3 h-6 w-6 text-green-500" />
                  )}
                </div>
                {row.prospect_linkedin && !validateLinkedInUrl(row.prospect_linkedin) && (
                  <p className="text-sm text-destructive mt-2">Please enter a valid LinkedIn profile URL</p>
                )}
              </div>

              {/* Secondary Fields Grid */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium border-b border-border/50 pb-2">Additional Information</h3>
                <p className="text-sm text-muted-foreground -mt-4 mb-6">Optional fields to enhance enrichment accuracy</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      Personal Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Full Name</label>
                        <Input 
                          placeholder="John Doe"
                          value={row.full_name || ""} 
                          onChange={(e) => handleChange("full_name", e.target.value)}
                          className="transition-all duration-200 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">City</label>
                        <Input 
                          placeholder="New York"
                          value={row.prospect_city || ""} 
                          onChange={(e) => handleChange("prospect_city", e.target.value)}
                          className="transition-all duration-200 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Job Title</label>
                        <Input 
                          placeholder="Software Engineer"
                          value={row.prospect_designation || ""} 
                          onChange={(e) => handleChange("prospect_designation", e.target.value)}
                          className="transition-all duration-200 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      Company Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Company Name</label>
                        <Input 
                          placeholder="ABC Corp"
                          value={row.company_name || ""} 
                          onChange={(e) => handleChange("company_name", e.target.value)}
                          className="transition-all duration-200 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Email Address</label>
                        <Input 
                          placeholder="john@company.com"
                          type="email"
                          value={row.prospect_email || ""} 
                          onChange={(e) => handleChange("prospect_email", e.target.value)}
                          className="transition-all duration-200 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone Numbers Section */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    Phone Numbers
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Primary Phone</label>
                      <Input 
                        placeholder="+1 (555) 123-4567"
                        value={row.prospect_number || ""} 
                        onChange={(e) => handleChange("prospect_number", e.target.value)}
                        className="transition-all duration-200 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Phone 2</label>
                      <Input 
                        placeholder="+1 (555) 123-4568"
                        value={row.prospect_number2 || ""} 
                        onChange={(e) => handleChange("prospect_number2", e.target.value)}
                        className="transition-all duration-200 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Phone 3</label>
                      <Input 
                        placeholder="+1 (555) 123-4569"
                        value={row.prospect_number3 || ""} 
                        onChange={(e) => handleChange("prospect_number3", e.target.value)}
                        className="transition-all duration-200 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Phone 4</label>
                      <Input 
                        placeholder="+1 (555) 123-4570"
                        value={row.prospect_number4 || ""} 
                        onChange={(e) => handleChange("prospect_number4", e.target.value)}
                        className="transition-all duration-200 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-border/50">
                <div className="text-sm text-muted-foreground">
                  {canSubmit ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Ready to process
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      LinkedIn URL required
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/")} 
                    disabled={isSubmitting}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !canSubmit}
                    className="px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Processing RTNE..." : "Run RTNE Enrichment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Rtne;
