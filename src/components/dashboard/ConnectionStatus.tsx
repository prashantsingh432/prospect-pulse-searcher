
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { ConnectionTestResult } from "@/services/connectionService";

interface ConnectionStatusProps {
  status: ConnectionTestResult | null;
  onRetry: () => void;
}

export const ConnectionStatus = ({ status, onRetry }: ConnectionStatusProps) => {
  if (!status) {
    return (
      <Alert variant="default" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Checking Connection</AlertTitle>
        <AlertDescription>
          Verifying connection to the database...
        </AlertDescription>
      </Alert>
    );
  }

  if (!status.success || !status.connected) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>
          <p>{status.message || "Failed to connect to the database. Please check your network and Supabase configuration."}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            Retry Connection
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default" className="bg-green-50 text-green-800 border-green-200 mb-6">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertTitle>Connected</AlertTitle>
      <AlertDescription>
        {status.message || "Successfully connected to database."}
      </AlertDescription>
    </Alert>
  );
};
