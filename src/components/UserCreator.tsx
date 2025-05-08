
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type UserToCreate = {
  email: string;
  password: string;
};

type UserCreationResult = {
  email: string;
  success: boolean;
  message?: string;
  userId?: string;
};

export const UserCreator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UserCreationResult[]>([]);
  const { toast } = useToast();

  const users: UserToCreate[] = [
    { email: "arnab.hungerbox@amplior.com", password: "arnab@123Amp1" },
    { email: "ayush.hungerbox@amplior.com", password: "ayush@123Amp12" },
    { email: "kushi.hungerbox@amplior.com", password: "kushi@123Amp13" },
    { email: "Anushka.hungerbox@amplior.com", password: "Anushka@13Amp1" },
    { email: "mahak.hungerbox@amplior.com", password: "mahak@123Amp18" },
    { email: "Ankita.dc@amplior.com", password: "ankita@123Amp" },
    { email: "rishita.dc@amplior.com", password: "rishita@124@Amp" },
    { email: "vandita.dc@amplior.com", password: "vandita@142PV" },
    { email: "shivam.datateam@amplior.com", password: "shivam@123Amp" }
  ];

  const createUsers = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      // Get the session for the authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create users",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Call our edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || "https://lodpoepylygsryjdkqjg.supabase.co"}/functions/v1/create-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ users }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create users");
      }

      setResults(data.results);
      
      // Count successful creations
      const successCount = data.results.filter((r: UserCreationResult) => r.success).length;
      
      toast({
        title: "Operation Complete",
        description: `Created ${successCount} out of ${users.length} users successfully.`,
        variant: successCount === users.length ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold">Bulk User Creation</CardTitle>
        <CardDescription>
          Create multiple user accounts for Amplior Prospect Pulse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription>
              This will create {users.length} new user accounts with the 'caller' role.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <h3 className="font-medium">Users to be created:</h3>
            <div className="rounded-md border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.email}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.password.substring(0, 3)}•••••••••
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {results.length > 0 && (
            <>
              <Separator className="my-4" />
              
              <div>
                <h3 className="font-medium mb-2">Results:</h3>
                <div className="rounded-md border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result) => (
                        <tr key={result.email}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{result.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {result.success ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                                <span className="text-sm">Success</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <XCircle className="h-5 w-5 text-red-500 mr-1" />
                                <span className="text-sm">Failed</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.message || (result.success ? 'User created successfully' : '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={createUsers}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Users...
            </>
          ) : "Create Users"}
        </Button>
      </CardFooter>
    </Card>
  );
};
