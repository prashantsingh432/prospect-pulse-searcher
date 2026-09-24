import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Phone, Search, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  enrichBetterContact,
  type BetterContactMode,
  type BetterContactResult,
} from "@/services/bettercontactService";

type ConnectionState = "unknown" | "connected" | "error";

export const BetterContactApiManager = () => {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [mode, setMode] = useState<BetterContactMode>("both");
  const [loading, setLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>("unknown");
  const [result, setResult] = useState<BetterContactResult | null>(null);

  const handleTest = async () => {
    if (!firstName.trim() || !lastName.trim() || !companyDomain.trim()) {
      toast({
        title: "Missing test details",
        description: "Enter first name, last name, and company domain before testing.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    const response = await enrichBetterContact({
      firstName,
      lastName,
      companyDomain,
      linkedinUrl,
      mode,
    });

    setResult(response);
    setConnectionState(response.error === "BetterContact is not configured" ? "error" : response.success ? "connected" : "unknown");
    setLoading(false);

    toast({
      title: response.success ? "BetterContact connected" : "BetterContact test failed",
      description: response.message || response.error || "No contact data was returned.",
      variant: response.success ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            BetterContact API
            {connectionState === "connected" && <Badge variant="secondary">Connected</Badge>}
          </CardTitle>
          <CardDescription>
            The API key is stored securely in the project secret store and is never shown in this app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              BetterContact enrichment is asynchronous. A test waits for the completed result and then shows the verified work email or mobile number.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bettercontact-first-name">First name</Label>
              <Input id="bettercontact-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Elon" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bettercontact-last-name">Last name</Label>
              <Input id="bettercontact-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Musk" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bettercontact-domain">Company domain</Label>
              <Input id="bettercontact-domain" value={companyDomain} onChange={(event) => setCompanyDomain(event.target.value)} placeholder="tesla.com" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bettercontact-linkedin">LinkedIn URL (recommended for phone)</Label>
              <Input id="bettercontact-linkedin" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} placeholder="https://www.linkedin.com/in/..." disabled={loading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>What to request</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as BetterContactMode)} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone"><span className="flex items-center gap-2"><Phone className="h-4 w-4" />Phone number</span></SelectItem>
                <SelectItem value="email">Work email</SelectItem>
                <SelectItem value="both">Phone number and work email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleTest} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {loading ? "Waiting for BetterContact..." : "Test BetterContact"}
          </Button>

          {result && (
            <div className="rounded-md border p-4">
              <div className="flex items-start gap-3">
                {result.success ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />}
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-medium">{result.success ? "Contact data received" : "No contact data received"}</p>
                  <p className="text-sm text-muted-foreground">{result.message || result.error}</p>
                  {result.email && <p className="text-sm"><span className="font-medium">Email:</span> {result.email}</p>}
                  {result.phone && <p className="text-sm"><span className="font-medium">Phone:</span> {result.phone}</p>}
                  {result.fullName && <p className="text-sm"><span className="font-medium">Name:</span> {result.fullName}</p>}
                  {result.company && <p className="text-sm"><span className="font-medium">Company:</span> {result.company}</p>}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How this connection works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. BetterContact receives the person details through the secure server function.</p>
          <p>2. The server submits the asynchronous enrichment request and waits for completion.</p>
          <p>3. Only the requested phone number, email, and basic profile details return to the app.</p>
          <p>4. Existing Lusha enrichment remains unchanged.</p>
        </CardContent>
      </Card>
    </div>
  );
};