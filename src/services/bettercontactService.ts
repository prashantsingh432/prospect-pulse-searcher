import { supabase } from "@/integrations/supabase/client";

export type BetterContactMode = "phone" | "email" | "both";

export interface BetterContactInput {
  firstName: string;
  lastName: string;
  companyDomain: string;
  linkedinUrl?: string;
  mode: BetterContactMode;
}

export interface BetterContactResult {
  success: boolean;
  phone?: string | null;
  email?: string | null;
  fullName?: string | null;
  company?: string | null;
  title?: string | null;
  city?: string | null;
  message?: string;
  error?: string;
  rawData?: unknown;
}

const EDGE_FUNCTION_URL =
  "https://lodpoepylygsryjdkqjg.supabase.co/functions/v1/bettercontact-enrich";

export async function enrichBetterContact(
  input: BetterContactInput,
): Promise<BetterContactResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {
      success: false,
      error: "Not authenticated",
      message: "Please sign in again before testing BetterContact.",
    };
  }

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        companyDomain: input.companyDomain.trim(),
        linkedinUrl: input.linkedinUrl?.trim() || undefined,
        mode: input.mode,
      }),
    });

    const payload = (await response.json().catch(() => null)) as BetterContactResult | null;

    if (!payload) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        message: "BetterContact returned an unreadable response.",
      };
    }

    return payload;
  } catch (error) {
    return {
      success: false,
      error: "Network error",
      message: error instanceof Error ? error.message : "Unable to reach BetterContact.",
    };
  }
}