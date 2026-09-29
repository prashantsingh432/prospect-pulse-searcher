import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, Phone, Search, ShieldCheck, Trash2, KeyRound, RotateCcw, TrendingUp, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  enrichBetterContact,
  addBetterContactKeys,
  deleteBetterContactKey,
  fetchBetterContactKeys,
  toggleBetterContactKeyStatus,
  syncBetterContactBalances,
  updateBetterContactKeyRenewalDate,
  updateBetterContactKeyRenewalDay,
  type BetterContactApiKey,
  type BetterContactMode,
  type BetterContactResult,
} from "@/services/bettercontactService";

type ConnectionState = "unknown" | "connected" | "error";

export const BetterContactApiManager = () => {
  const { toast } = useToast();
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [mode, setMode] = useState<BetterContactMode>("both");
  const [loading, setLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>("unknown");
  const [result, setResult] = useState<BetterContactResult | null>(null);
  const [keys, setKeys] = useState<BetterContactApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [addingKeys, setAddingKeys] = useState(false);
  const [newKeysText, setNewKeysText] = useState("");
  const [syncingBalances, setSyncingBalances] = useState(false);
  const [syncingKeyId, setSyncingKeyId] = useState<string | null>(null);

  const loadKeys = async () => {
    try {
      setKeysLoading(true);
      const loadedKeys = await fetchBetterContactKeys();
      setKeys(loadedKeys);
      // If any key hasn't been checked yet, auto-sync balances
      if (loadedKeys.length > 0 && loadedKeys.some((k) => k.credits_remaining === null || k.credits_remaining === undefined)) {
        void syncBetterContactBalances().then(() => fetchBetterContactKeys().then(setKeys)).catch(() => {});
      }
    } catch (error) {
      toast({ title: "Could not load BetterContact keys", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setKeysLoading(false);
    }
  };

  useEffect(() => {
    void loadKeys();
  }, []);

  const handleAddKeys = async () => {
    const lines = newKeysText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) {
      toast({ title: "Add at least one key", description: "Paste one BetterContact API key per line.", variant: "destructive" });
      return;
    }

    try {
      setAddingKeys(true);
      const response = await addBetterContactKeys(lines);
      setNewKeysText("");
      await loadKeys();
      toast({
        title: response.added ? "BetterContact keys added" : "No keys added",
        description: `${response.added} added${response.errors.length ? `, ${response.errors.length} skipped or already present` : ""}.`,
        variant: response.errors.length && !response.added ? "destructive" : "default",
      });
    } catch (error) {
      toast({ title: "Could not add BetterContact keys", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setAddingKeys(false);
    }
  };

  const handleToggleKey = async (key: BetterContactApiKey) => {
    try {
      await toggleBetterContactKeyStatus(key.id, !key.is_active);
      await loadKeys();
    } catch (error) {
      toast({ title: "Could not update key", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const handleDeleteKey = async (key: BetterContactApiKey) => {
    if (!window.confirm("Delete this BetterContact API key?")) return;
    try {
      await deleteBetterContactKey(key.id);
      await loadKeys();
    } catch (error) {
      toast({ title: "Could not delete key", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const handleSyncBalances = async (keyId?: string) => {
    try {
      if (keyId) {
        setSyncingKeyId(keyId);
      } else {
        setSyncingBalances(true);
      }
      const res = await syncBetterContactBalances(keyId);
      if (res.success) {
        toast({
          title: "Balances Updated",
          description: res.message || "Key balances refreshed from BetterContact",
        });
        await loadKeys();
      } else {
        toast({
          title: "Balance Check Failed",
          description: res.message || "Could not check balances",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error checking balances",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncingBalances(false);
      setSyncingKeyId(null);
    }
  };

  const handleUpdateRenewalDay = async (id: string, day: number | null) => {
    try {
      await updateBetterContactKeyRenewalDay(id, day);
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, renewal_day: day } : k)));
      toast({
        title: "Renewal Day Updated",
        description: day ? `Renews on the ${getOrdinal(day)} of every month` : "Cleared renewal day",
      });
    } catch (error) {
      toast({
        title: "Error updating renewal day",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatRenewalDayBadge = (day: number | null | undefined) => {
    if (!day || day < 1 || day > 31) {
      return <span className="text-[10px] text-muted-foreground italic">Click to set</span>;
    }
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let daysUntil = 0;
    let nextDateStr = "";

    if (day === currentDay) {
      return <span className="text-[10px] text-amber-600 font-semibold">● Renews today!</span>;
    } else if (day > currentDay) {
      daysUntil = day - currentDay;
      const targetDate = new Date(currentYear, currentMonth, day);
      nextDateStr = targetDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } else {
      // Next month renewal
      const daysInThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      daysUntil = (daysInThisMonth - currentDay) + day;
      const targetDate = new Date(currentYear, currentMonth + 1, day);
      nextDateStr = targetDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    if (daysUntil === 1) {
      return <span className="text-[10px] text-amber-600 font-medium">● Tomorrow ({nextDateStr})</span>;
    }
    if (daysUntil <= 5) {
      return <span className="text-[10px] text-emerald-600 font-medium">● In {daysUntil} days ({nextDateStr})</span>;
    }
    return <span className="text-[10px] text-muted-foreground">In {daysUntil} days ({nextDateStr})</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300">ACTIVE</Badge>;
      case "EXHAUSTED":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300">EXHAUSTED</Badge>;
      case "INVALID":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-300">INVALID</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalKeys = keys.length;
  const activeKeys = keys.filter(k => k.is_active && k.status === "ACTIVE").length;
  const totalCredits = keys.reduce((sum, k) => sum + (Number(k.credits_remaining) || 0), 0);
  const exhaustedKeys = keys.filter(k => !k.is_active || k.status !== "ACTIVE").length;

  const handleTest = async () => {
    if (!linkedinUrl.trim()) {
      toast({
        title: "LinkedIn URL required",
        description: "Paste a LinkedIn profile URL before testing.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    const response = await enrichBetterContact({
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
            <AlertDescription>Paste one LinkedIn profile URL, choose what to fetch, and run the test.</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="bettercontact-linkedin">LinkedIn profile URL</Label>
            <Input
              id="bettercontact-linkedin"
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
              placeholder="https://www.linkedin.com/in/username"
              disabled={loading}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleTest();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>What to request</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as BetterContactMode)} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone"><span className="flex items-center gap-2"><Phone className="h-4 w-4" />Phone number</span></SelectItem>
                <SelectItem value="email"><span className="flex items-center gap-2"><Mail className="h-4 w-4" />Work email</span></SelectItem>
                <SelectItem value="both"><span className="flex items-center gap-2"><Phone className="h-4 w-4" />Phone number and work email</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleTest} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {loading ? "Fetching contact data..." : "Run API test"}
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

      {/* Pool Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-purple-100 bg-purple-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Pool Keys</p>
                <p className="text-2xl font-bold text-purple-900">{totalKeys}</p>
              </div>
              <KeyRound className="h-7 w-7 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Keys</p>
                <p className="text-2xl font-bold text-emerald-800">{activeKeys}</p>
              </div>
              <CheckCircle2 className="h-7 w-7 text-emerald-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Credits Left</p>
                <p className="text-2xl font-bold text-blue-900">{totalCredits.toLocaleString()}</p>
              </div>
              <Wallet className="h-7 w-7 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Exhausted / Inactive</p>
                <p className="text-2xl font-bold text-amber-800">{exhaustedKeys}</p>
              </div>
              <AlertCircle className="h-7 w-7 text-amber-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />BetterContact API key pool</CardTitle>
            <CardDescription className="mt-1">Paste 100+ keys at once. Balances are checked live from BetterContact without using any credits.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleSyncBalances()}
            disabled={syncingBalances || keys.length === 0}
            className="gap-2"
          >
            <RotateCcw className={`h-4 w-4 ${syncingBalances ? "animate-spin" : ""}`} />
            {syncingBalances ? "Checking Balances..." : "Check / Refresh Balances"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>One key per line. The tester uses active pool keys first, then moves to the next key when a key is unavailable.</AlertDescription>
          </Alert>
          <Textarea
            aria-label="BetterContact API keys"
            placeholder="Paste BetterContact API keys here, one per line..."
            value={newKeysText}
            onChange={(event) => setNewKeysText(event.target.value)}
            rows={6}
          />
          <Button onClick={handleAddKeys} disabled={addingKeys} className="gap-2">
            {addingKeys ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {addingKeys ? "Adding keys..." : "Add keys"}
          </Button>

          {keysLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pool keys added yet. The existing project secret will remain available as a fallback.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Account Email</TableHead>
                    <TableHead>Credits Balance</TableHead>
                    <TableHead>Renews On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last used</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key, index) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-mono text-xs">
                        {key.key_value
                          ? `${key.key_value.substring(0, 8)}...${key.key_value.substring(key.key_value.length - 4)}`
                          : `BetterContact key ${index + 1}`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {key.account_email || "—"}
                      </TableCell>
                      <TableCell>
                        {key.credits_remaining !== null && key.credits_remaining !== undefined ? (
                          <Badge
                            variant="outline"
                            className={`font-mono font-semibold ${
                              Number(key.credits_remaining) > 0
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-red-50 text-red-700 border-red-300"
                            }`}
                          >
                            {Number(key.credits_remaining).toLocaleString()} credits
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not checked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 min-w-[130px]">
                          <Select
                            value={key.renewal_day ? String(key.renewal_day) : "none"}
                            onValueChange={(val) => void handleUpdateRenewalDay(key.id, val === "none" ? null : parseInt(val))}
                          >
                            <SelectTrigger className="h-7 text-xs font-medium w-[125px] bg-background">
                              <SelectValue placeholder="Pick day" />
                            </SelectTrigger>
                            <SelectContent className="max-h-56">
                              <SelectItem value="none">Not set</SelectItem>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                <SelectItem key={d} value={String(d)}>
                                  {getOrdinal(d)} of month
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formatRenewalDayBadge(key.renewal_day)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(key.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "Never"}</TableCell>
                      <TableCell><Switch checked={key.is_active} onCheckedChange={() => void handleToggleKey(key)} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Check balance for this key"
                            disabled={syncingBalances || syncingKeyId === key.id}
                            onClick={() => void handleSyncBalances(key.id)}
                          >
                            <RotateCcw className={`h-3.5 w-3.5 text-muted-foreground ${syncingKeyId === key.id ? "animate-spin" : ""}`} />
                          </Button>
                          <Button variant="ghost" size="sm" aria-label="Delete BetterContact key" onClick={() => void handleDeleteKey(key)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How this connection works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. BetterContact receives the LinkedIn profile through the secure server function.</p>
          <p>2. The server submits the asynchronous enrichment request and waits for completion.</p>
          <p>3. Only the requested phone number, email, and basic profile details return to the app.</p>
          <p>4. Existing Lusha enrichment remains unchanged.</p>
        </CardContent>
      </Card>
    </div>
  );
};