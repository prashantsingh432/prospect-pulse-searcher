import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  fetchLushaKeys,
  addLushaKeys,
  toggleLushaKeyStatus,
  deleteLushaKey,
  getLushaKeyStats,
  LushaApiKey,
  LushaCategory,
} from "@/services/lushaService";
import { Loader2, Plus, Trash2, Key, TrendingUp, AlertCircle } from "lucide-react";
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
        <CardHeader>
          <CardTitle>Manage API Keys</CardTitle>
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
                  <KeysTable keys={phoneKeys} onToggle={handleToggleActive} onDelete={handleDeleteKey} getStatusBadge={getStatusBadge} />
                )}
              </TabsContent>

              <TabsContent value="email">
                {emailKeys.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No email keys added yet. Add some above to get started.</AlertDescription>
                  </Alert>
                ) : (
                  <KeysTable keys={emailKeys} onToggle={handleToggleActive} onDelete={handleDeleteKey} getStatusBadge={getStatusBadge} />
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KeysTable = ({
  keys,
  onToggle,
  onDelete,
  getStatusBadge,
}: {
  keys: LushaApiKey[];
  onToggle: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>API Key</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Credits</TableHead>
          <TableHead>Last Used</TableHead>
          <TableHead>Active</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => (
          <TableRow key={key.id}>
            <TableCell className="font-mono text-sm">
              {key.key_value.substring(0, 12)}...{key.key_value.substring(key.key_value.length - 4)}
            </TableCell>
            <TableCell>{getStatusBadge(key.status)}</TableCell>
            <TableCell>{key.credits_remaining}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "Never"}
            </TableCell>
            <TableCell>
              <Switch checked={key.is_active} onCheckedChange={() => onToggle(key.id, key.is_active)} />
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onDelete(key.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
