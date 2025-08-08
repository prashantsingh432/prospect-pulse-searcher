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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { data: auth } = await supabaseUser.auth.getUser();
    const caller = auth?.user;
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify admin
    const { data: roleRow, error: roleErr } = await supabaseAdmin
      .rpc("get_current_user_role")
      .single();
    if (roleErr) throw roleErr;
    const role = roleRow as unknown as string | null;
    if (role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const action: string = body.action;

    if (action === "reassign_credit") {
      const { master_prospect_id, to_project_id } = body;
      if (!master_prospect_id || !to_project_id) {
        return new Response(JSON.stringify({ error: "master_prospect_id and to_project_id are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Clear previous credit flags
      const { error: clearErr } = await supabaseAdmin
        .from("project_prospects")
        .update({ credit_allocated: false, credited_at: null })
        .eq("master_prospect_id", master_prospect_id);
      if (clearErr) throw clearErr;

      // Ensure mapping exists to target project
      const { data: mapping, error: mapErr } = await supabaseAdmin
        .from("project_prospects")
        .select("id")
        .eq("project_id", to_project_id)
        .eq("master_prospect_id", master_prospect_id)
        .maybeSingle();
      if (mapErr) throw mapErr;
      if (!mapping) {
        const { error: insMapErr } = await supabaseAdmin
          .from("project_prospects")
          .insert({ project_id: to_project_id, master_prospect_id, added_by: caller.id, credit_allocated: true, credited_at: new Date().toISOString() });
        if (insMapErr) throw insMapErr;
      } else {
        const { error: setCreditErr } = await supabaseAdmin
          .from("project_prospects")
          .update({ credit_allocated: true, credited_at: new Date().toISOString() })
          .eq("id", mapping.id);
        if (setCreditErr) throw setCreditErr;
      }

      const { error: logErr } = await supabaseAdmin
        .from("credits_log")
        .insert({ master_prospect_id, project_id: to_project_id, user_id: caller.id, action: "override", details: { reason: "Admin override reassign" } });
      if (logErr) throw logErr;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("rtne-admin-override error", e);
    return new Response(JSON.stringify({ error: e.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
