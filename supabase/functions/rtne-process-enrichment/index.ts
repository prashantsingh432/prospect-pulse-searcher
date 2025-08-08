import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const master_prospect_id: string = body.master_prospect_id;

    if (!master_prospect_id) {
      return new Response(JSON.stringify({ error: "master_prospect_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Mark job processing and then completed (stub until external APIs configured)
    const { data: job, error: jobErr } = await supabaseAdmin
      .from("enrichment_jobs")
      .insert({ master_prospect_id, status: "processing" })
      .select("id")
      .single();
    if (jobErr) throw jobErr;

    // Simulate enrichment result
    const result = { email_suggestions: [], phone_suggestions: [] };

    const { error: updErr } = await supabaseAdmin
      .from("enrichment_jobs")
      .update({ status: "completed", result })
      .eq("id", job.id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("rtne-process-enrichment error", e);
    return new Response(JSON.stringify({ error: e.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
