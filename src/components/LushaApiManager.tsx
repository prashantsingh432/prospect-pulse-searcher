import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchLushaKeys,
  addLushaKeys,
  toggleLushaKeyStatus,
  deleteLushaKey,
  getLushaKeyStats,
  enrichProspect,
  enrichProspectByName,
  syncLushaKeyBalances,
  updateLushaKeyRenewalDate,
  updateLushaKeyRenewalDay,
  LushaApiKey,
  LushaCategory,
} from "@/services/lushaService";
import { Loader2, Plus, Trash2, Key, TrendingUp, AlertCircle, TestTube, CheckCircle, XCircle, Trash, RotateCcw, Calendar } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const LushaApiManager = () => {
  const { toast } = useToast();
  const [keys, setKeys] = useState<LushaApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingKeys, setAddingKeys] = useState(false);
  const [newKeysText, setNewKeysText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LushaCategory>("PHONE_ONLY");
  const [stats, setStats] = useState({
    phone: { total: 0, active: 0, exhausted: 0, invalid: 0, suspended: 0, totalCredits: 0 },
    email: { total: 0, active: 0, exhausted: 0, invalid: 0, suspended: 0, totalCredits: 0 },
  });

  // API Test State
  const [testMode, setTestMode] = useState<"linkedin" | "name">("linkedin");
  const [testLinkedInUrl, setTestLinkedInUrl] = useState("");
  const [testFirstName, setTestFirstName] = useState("");
  const [testLastName, setTestLastName] = useState("");
  const [testCompanyName, setTestCompanyName] = useState("");
  const [testCategory, setTestCategory] = useState<LushaCategory>("PHONE_ONLY");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [deletingAllKeys, setDeletingAllKeys] = useState(false);
  const [syncingBalances, setSyncingBalances] = useState(false);
  const [syncingKeyId, setSyncingKeyId] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
    loadStats();
  }, []);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const data = await fetchLushaKeys();
      setKeys(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load API keys: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const phoneStats = await getLushaKeyStats("PHONE_ONLY");
      const emailStats = await getLushaKeyStats("EMAIL_ONLY");
      setStats({ phone: phoneStats, email: emailStats });
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleAddKeys = async () => {
    if (!newKeysText.trim()) {
      toast({
        title: "Error",
        description: "Please paste at least one API key",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingKeys(true);
      const keyLines = newKeysText.split("\n").filter((line) => line.trim());
      const result = await addLushaKeys(keyLines, selectedCategory);

      if (result.success) {
        toast({
          title: "Success",
          description: `Added ${result.added} API key(s) successfully`,
        });
        setNewKeysText("");
        loadKeys();
        loadStats();
      } else {
        toast({
          title: "Partial Success",
          description: `Added ${result.added} key(s). ${result.errors.length} failed.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add keys: " + error.message,
        variant: "destructive",
      });
    } finally {
      setAddingKeys(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleLushaKeyStatus(id, !currentStatus);
      toast({
        title: "Success",
        description: `Key ${!currentStatus ? "activated" : "deactivated"}`,
      });
      loadKeys();
      loadStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update key: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      await deleteLushaKey(id);
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
      loadKeys();
      loadStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete key: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleSyncBalances = async (keyId?: string) => {
    try {
      if (keyId) {
        setSyncingKeyId(keyId);
      } else {
        setSyncingBalances(true);
      }
      const res = await syncLushaKeyBalances(keyId);
      if (res.success) {
        toast({
          title: "Balances Updated",
          description: res.message || "Key balances refreshed directly from Lusha",
        });
        await loadKeys();
        await loadStats();
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
      await updateLushaKeyRenewalDay(id, day);
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

  const handleDeleteAllKeys = async (category: LushaCategory) => {
    const keysToDelete = category === "PHONE_ONLY" ? phoneKeys : emailKeys;
    
    if (keysToDelete.length === 0) {
      toast({
        title: "No Keys",
        description: `No ${category === "PHONE_ONLY" ? "phone" : "email"} keys to delete`,
        variant: "destructive",
      });
      return;
    }

    try {
      setDeletingAllKeys(true);
      
      // Delete all keys one by one
      let deletedCount = 0;
      let failedCount = 0;
      
      for (const key of keysToDelete) {
        try {
          await deleteLushaKey(key.id);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete key ${key.id}:`, error);
          failedCount++;
        }
      }
      
      toast({
        title: "Success",
        description: `Deleted ${deletedCount} API key(s)${failedCount > 0 ? `. ${failedCount} failed.` : ""}`,
      });
      
      loadKeys();
      loadStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete keys: " + error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingAllKeys(false);
    }
  };

  const handleTestApi = async () => {
    if (testMode === "linkedin" && !testLinkedInUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a LinkedIn URL",
        variant: "destructive",
      });
      return;
    }

    if (testMode === "name" && (!testFirstName.trim() || !testCompanyName.trim())) {
      toast({
        title: "Error",
        description: "Please enter First Name and Company Name",
        variant: "destructive",
      });
      return;
    }

    try {
      setTestLoading(true);
      setTestResult(null);

      console.log("🧪 Starting API Test...");
      console.log(`📋 Mode: ${testMode}`);
      console.log(`🔍 Category: ${testCategory}`);

      let result;
      if (testMode === "linkedin") {
        console.log(`🔗 Testing with LinkedIn URL: ${testLinkedInUrl}`);
        result = await enrichProspect(testLinkedInUrl, testCategory);
      } else {
        console.log(`👤 Testing with Name: ${testFirstName} ${testLastName}, Company: ${testCompanyName}`);
        result = await enrichProspectByName(testFirstName, testLastName, testCompanyName, testCategory);
      }

      console.log("📊 Test Result:", result);
      setTestResult(result);

      if (result.success) {
        toast({
          title: "✅ API Test Successful!",
          description: `Found ${result.phone ? "phone" : ""}${result.phone && result.email ? " and " : ""}${result.email ? "email" : ""}`,
        });
      } else {
        toast({
          title: "❌ API Test Failed",
          description: result.message || result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ Test Error:", error);
      setTestResult({
        success: false,
        error: "Test Error",
        message: error.message,
      });
      toast({
        title: "Error",
        description: "Test failed: " + error.message,
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      EXHAUSTED: "secondary",
      INVALID: "destructive",
      SUSPENDED: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const phoneKeys = keys.filter((k) => k.category === "PHONE_ONLY");
  const emailKeys = keys.filter((k) => k.category === "EMAIL_ONLY");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone Keys Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Phone Keys Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Keys:</span>
                <span className="font-semibold">{stats.phone.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active:</span>
                <span className="font-semibold text-green-600">{stats.phone.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exhausted:</span>
                <span className="font-semibold text-yellow-600">{stats.phone.exhausted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invalid:</span>
                <span className="font-semibold text-red-600">{stats.phone.invalid}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Total Credits:
                </span>
                <span className="font-bold text-lg">{stats.phone.totalCredits}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Keys Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Email Keys Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Keys:</span>
                <span className="font-semibold">{stats.email.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active:</span>
                <span className="font-semibold text-green-600">{stats.email.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exhausted:</span>
                <span className="font-semibold text-yellow-600">{stats.email.exhausted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invalid:</span>
                <span className="font-semibold text-red-600">{stats.email.invalid}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Total Credits:
                </span>
                <span className="font-bold text-lg">{stats.email.totalCredits}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Test Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <TestTube className="h-5 w-5" />
            API Test Tool
          </CardTitle>
          <CardDescription className="text-blue-800">
            Test if the Lusha API is working before running enrichment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={testMode === "linkedin" ? "default" : "outline"}
              onClick={() => setTestMode("linkedin")}
              disabled={testLoading}
            >
              Test with LinkedIn URL
            </Button>
            <Button
              variant={testMode === "name" ? "default" : "outline"}
              onClick={() => setTestMode("name")}
              disabled={testLoading}
            >
              Test with Name + Company
            </Button>
          </div>

          {/* Category Selection */}
          <div className="flex gap-2">
            <Button
              variant={testCategory === "PHONE_ONLY" ? "default" : "outline"}
              onClick={() => setTestCategory("PHONE_ONLY")}
              disabled={testLoading}
              size="sm"
            >
              Phone Only
            </Button>
            <Button
              variant={testCategory === "EMAIL_ONLY" ? "default" : "outline"}
              onClick={() => setTestCategory("EMAIL_ONLY")}
              disabled={testLoading}
              size="sm"
            >
              Email Only
            </Button>
          </div>

          {/* Test Input Fields */}
          {testMode === "linkedin" ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium">LinkedIn URL</label>
              <Input
                placeholder="https://www.linkedin.com/in/username/"
                value={testLinkedInUrl}
                onChange={(e) => setTestLinkedInUrl(e.target.value)}
                disabled={testLoading}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">First Name</label>
                <Input
                  placeholder="John"
                  value={testFirstName}
                  onChange={(e) => setTestFirstName(e.target.value)}
                  disabled={testLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Last Name</label>
                <Input
                  placeholder="Smith"
                  value={testLastName}
                  onChange={(e) => setTestLastName(e.target.value)}
                  disabled={testLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Company Name</label>
                <Input
                  placeholder="Google"
                  value={testCompanyName}
                  onChange={(e) => setTestCompanyName(e.target.value)}
                  disabled={testLoading}
                />
              </div>
            </div>
          )}

          {/* Test Button */}
          <Button onClick={handleTestApi} disabled={testLoading} className="w-full">
            {testLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing API...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Run API Test
              </>
            )}
          </Button>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg border-2 ${testResult.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold ${testResult.success ? "text-green-900" : "text-red-900"}`}>
                    {testResult.success ? "✅ Test Successful!" : "❌ Test Failed"}
                  </h4>
                  <p className={`text-sm mt-1 ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                    {String(testResult.message || testResult.error || "No message")}
                  </p>

                  {/* Show extracted data if successful */}
                  {testResult.success && (
                    <div className="mt-3 space-y-1 text-sm">
                      {testResult.phone && (
                        <div className="flex justify-between">
                          <span className="font-medium">Phone:</span>
                          <span className="font-mono">{String(testResult.phone)}</span>
                        </div>
                      )}
                      {testResult.email && (
                        <div className="flex justify-between">
                          <span className="font-medium">Email:</span>
                          <span className="font-mono">{String(testResult.email)}</span>
                        </div>
                      )}
                      {testResult.fullName && (
                        <div className="flex justify-between">
                          <span className="font-medium">Name:</span>
                          <span>{String(testResult.fullName)}</span>
                        </div>
                      )}
                      {testResult.company && (
                        <div className="flex justify-between">
                          <span className="font-medium">Company:</span>
                          <span>{String(testResult.company)}</span>
                        </div>
                      )}
                      {testResult.title && (
                        <div className="flex justify-between">
                          <span className="font-medium">Title:</span>
                          <span>{String(testResult.title)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show error details if failed */}
                  {!testResult.success && testResult.rawData && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer font-medium">View Details</summary>
                      <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                        {(() => {
                          try {
                            return JSON.stringify(testResult.rawData, null, 2);
                          } catch (e) {
                            return `[Unable to display: ${e instanceof Error ? e.message : 'Circular reference or invalid data'}]`;
                          }
                        })()}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <Alert className="bg-blue-100 border-blue-300">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>How to use:</strong> Enter test data and click "Run API Test" to verify the API is working. Check the browser console (F12) for detailed logs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Add Keys Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add New API Keys</CardTitle>
          <CardDescription>Paste one API key per line to add them in bulk</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "PHONE_ONLY" ? "default" : "outline"}
              onClick={() => setSelectedCategory("PHONE_ONLY")}
            >
              Phone Only
            </Button>
            <Button
              variant={selectedCategory === "EMAIL_ONLY" ? "default" : "outline"}
              onClick={() => setSelectedCategory("EMAIL_ONLY")}
            >
              Email Only
            </Button>
          </div>
          <Textarea
            placeholder="Paste API keys here, one per line..."
            value={newKeysText}
            onChange={(e) => setNewKeysText(e.target.value)}
            rows={5}
          />
          <Button onClick={handleAddKeys} disabled={addingKeys}>
            {addingKeys ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Keys
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Keys Management Tabs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Manage API Keys</CardTitle>
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
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="phone">
              <TabsList>
                <TabsTrigger value="phone">Phone Keys ({phoneKeys.length})</TabsTrigger>
                <TabsTrigger value="email">Email Keys ({emailKeys.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="phone">
                {phoneKeys.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No phone keys added yet. Add some above to get started.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deletingAllKeys}>
                            {deletingAllKeys ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash className="mr-2 h-4 w-4" />
                                Delete All Phone Keys ({phoneKeys.length})
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete All Phone Keys?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all {phoneKeys.length} phone API keys from the system. 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteAllKeys("PHONE_ONLY")}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete All
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <KeysTable
                      keys={phoneKeys}
                      onToggle={handleToggleActive}
                      onDelete={handleDeleteKey}
                      onSyncKey={handleSyncBalances}
                      onUpdateRenewalDay={handleUpdateRenewalDay}
                      syncingKeyId={syncingKeyId}
                      getStatusBadge={getStatusBadge}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="email">
                {emailKeys.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No email keys added yet. Add some above to get started.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deletingAllKeys}>
                            {deletingAllKeys ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash className="mr-2 h-4 w-4" />
                                Delete All Email Keys ({emailKeys.length})
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete All Email Keys?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all {emailKeys.length} email API keys from the system. 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteAllKeys("EMAIL_ONLY")}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete All
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <KeysTable
                      keys={emailKeys}
                      onToggle={handleToggleActive}
                      onDelete={handleDeleteKey}
                      onSyncKey={handleSyncBalances}
                      onUpdateRenewalDay={handleUpdateRenewalDay}
                      syncingKeyId={syncingKeyId}
                      getStatusBadge={getStatusBadge}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
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

const KeysTable = ({
  keys,
  onToggle,
  onDelete,
  onSyncKey,
  onUpdateRenewalDay,
  syncingKeyId,
  getStatusBadge,
}: {
  keys: LushaApiKey[];
  onToggle: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  onSyncKey?: (id: string) => void;
  onUpdateRenewalDay: (id: string, day: number | null) => void;
  syncingKeyId?: string | null;
  getStatusBadge: (status: string) => JSX.Element;
}) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>API Key</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Credits</TableHead>
          <TableHead>Renews On</TableHead>
          <TableHead>Last Used</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => (
          <TableRow key={key.id}>
            <TableCell className="font-mono text-sm">
              {key.key_value.substring(0, 12)}...{key.key_value.substring(key.key_value.length - 4)}
            </TableCell>
            <TableCell>{getStatusBadge(key.status)}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`font-mono font-semibold ${
                  key.credits_remaining > 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-red-50 text-red-700 border-red-300"
                }`}
              >
                {key.credits_remaining} credits
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1 min-w-[130px]">
                <Select
                  value={key.renewal_day ? String(key.renewal_day) : "none"}
                  onValueChange={(val) => onUpdateRenewalDay(key.id, val === "none" ? null : parseInt(val))}
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
            <TableCell className="text-sm text-muted-foreground">
              {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "Never"}
            </TableCell>
            <TableCell>
              <Switch checked={key.is_active} onCheckedChange={() => onToggle(key.id, key.is_active)} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                {onSyncKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Refresh balance directly from Lusha"
                    disabled={syncingKeyId === key.id}
                    onClick={() => onSyncKey(key.id)}
                  >
                    <RotateCcw className={`h-3.5 w-3.5 text-muted-foreground ${syncingKeyId === key.id ? "animate-spin" : ""}`} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onDelete(key.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
