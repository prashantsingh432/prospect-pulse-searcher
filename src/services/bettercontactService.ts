import { supabase, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

export type BetterContactMode = "phone" | "email" | "both";

export interface BetterContactInput {
  firstName?: string;
  lastName?: string;
  companyDomain?: string;
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

export interface BetterContactApiKey {
  id: string;
  status: string;
  is_active: boolean;
  credits_remaining: number | null;
  account_email: string | null;
  renewal_date?: string | null;
  renewal_day?: number | null;
  last_used_at: string | null;
  created_at: string;
  key_value?: string;
}

type BetterContactKeyTable = {
  select: (columns: string) => any;
  insert: (values: Record<string, unknown>) => any;
  update: (values: Record<string, unknown>) => any;
  delete: () => any;
};

const betterContactKeys = (): BetterContactKeyTable =>
  (supabase as unknown as { from: (table: string) => BetterContactKeyTable }).from("bettercontact_api_keys");

export async function fetchBetterContactKeys(): Promise<BetterContactApiKey[]> {
  const { data, error } = await betterContactKeys()
    .select("id,key_value,status,is_active,credits_remaining,account_email,renewal_date,renewal_day,last_used_at,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as BetterContactApiKey[];
}

export async function addBetterContactKeys(keys: string[]) {
  const results = { success: true, added: 0, errors: [] as string[] };
  const uniqueKeys = [...new Set(keys.map((key) => key.trim()).filter(Boolean))];

  for (const key of uniqueKeys) {
    const { error } = await betterContactKeys().insert({
      key_value: key,
      status: "ACTIVE",
      is_active: true,
    });

    if (error) {
      results.errors.push(`${key.slice(0, 8)}...: ${error.message}`);
    } else {
      results.added += 1;
    }
  }

  results.success = results.errors.length === 0;

  // Auto-sync balances for newly added keys
  if (results.added > 0) {
    try {
      await syncBetterContactBalances();
    } catch (e) {
      console.warn("Auto-sync failed on add:", e);
    }
  }

  return results;
}

export async function toggleBetterContactKeyStatus(id: string, isActive: boolean) {
  const { error } = await betterContactKeys().update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function deleteBetterContactKey(id: string) {
  const { error } = await betterContactKeys().delete().eq("id", id);
  if (error) throw error;
}

export async function updateBetterContactKeyRenewalDate(id: string, renewalDate: string | null) {
  const { error } = await betterContactKeys().update({ renewal_date: renewalDate || null }).eq("id", id);
  if (error) throw error;
}

export async function updateBetterContactKeyRenewalDay(id: string, renewalDay: number | null) {
  const { error } = await betterContactKeys().update({ renewal_day: renewalDay || null }).eq("id", id);
  if (error) throw error;
}

export async function syncBetterContactBalances(keyId?: string): Promise<{ success: boolean; message?: string; results?: any[] }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {
      success: false,
      message: "Please sign in again before checking balance.",
    };
  }

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "sync_balances",
        keyId,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!payload || !payload.success) {
      return {
        success: false,
        message: payload?.error || payload?.message || "Failed to sync balances",
      };
    }

    return payload;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error checking balance",
    };
  }
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
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: input.firstName?.trim() || undefined,
        lastName: input.lastName?.trim() || undefined,
        companyDomain: input.companyDomain?.trim() || undefined,
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