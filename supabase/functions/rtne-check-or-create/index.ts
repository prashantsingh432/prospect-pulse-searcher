import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeLinkedInUrl(url: string): string {
  if (!url) return "";
  let normalized = url.trim().toLowerCase();
  normalized = normalized.replace(/^https?:\/\//, "").replace(/^www\./, "");
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}

function extractLinkedInUsername(url: string): string | null {
  const n = normalizeLinkedInUrl(url);
  const m = n.match(/linkedin\.com\/in\/([^\/]+)/i);
  return m && m[1] ? m[1] : null;
}

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

    interface Row {
      prospect_linkedin: string;
      full_name?: string;
      company_name?: string;
      prospect_city?: string;
      prospect_designation?: string;
    }
    const body = await req.json();
    const projectName: string = body.projectName?.toString()?.trim();
    const row: Row = body.row;

    if (!projectName) {
      return new Response(JSON.stringify({ error: "projectName is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!row?.prospect_linkedin) {
      return new Response(JSON.stringify({ error: "prospect_linkedin is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Normalize LinkedIn fields
    const username = extractLinkedInUsername(row.prospect_linkedin);
    if (!username) {
      return new Response(JSON.stringify({ error: "Invalid LinkedIn URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const canonical_url = `linkedin.com/in/${username}`;

    // Upsert project by name and ensure membership
    let { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, owner_id")
      .eq("name", projectName)
      .maybeSingle();
    if (projErr) throw projErr;

    let project_id = project?.id as string | undefined;
    let createdProject = false;
    if (!project_id) {
      const { data: projIns, error: projInsErr } = await supabaseAdmin
        .from("projects")
        .insert({ name: projectName, owner_id: caller.id })
        .select("id, owner_id")
        .single();
      if (projInsErr) throw projInsErr;
      project_id = projIns.id;
      project = projIns;
      createdProject = true;
    }

    // Ensure membership for caller
    const { data: memberCheck, error: memberCheckErr } = await supabaseAdmin
      .from("project_users")
      .select("id")
      .eq("project_id", project_id)
      .eq("user_id", caller.id)
      .maybeSingle();
    if (memberCheckErr) throw memberCheckErr;
    if (!memberCheck) {
      const role = project!.owner_id === caller.id ? "owner" : "member";
      const { error: addMemErr } = await supabaseAdmin
        .from("project_users")
        .insert({ project_id, user_id: caller.id, role });
      if (addMemErr) throw addMemErr;
    }

    // Check for existing master by linkedin_id or canonical_url
    let { data: existing, error: existErr } = await supabaseAdmin
      .from("master_prospects")
      .select("id")
      .or(`linkedin_id.eq.${username},canonical_url.eq.${canonical_url}`)
      .maybeSingle();
    if (existErr && existErr.code !== "PGRST116") throw existErr;

    let master_id: string;
    let createdMaster = false;

    if (!existing) {
      const { data: upserted, error: upsertErr } = await supabaseAdmin
        .from("master_prospects")
        .insert({
          linkedin_id: username,
          canonical_url,
          full_name: row.full_name ?? null,
          company_name: row.company_name ?? null,
          prospect_city: row.prospect_city ?? null,
          prospect_designation: row.prospect_designation ?? null,
          created_by: caller.id,
        })
        .select("id")
        .single();

      if (upsertErr) {
        // Handle race: fetch existing if unique violation
        const { data: race, error: raceErr } = await supabaseAdmin
          .from("master_prospects")
          .select("id")
          .or(`linkedin_id.eq.${username},canonical_url.eq.${canonical_url}`)
          .maybeSingle();
        if (raceErr) throw upsertErr;
        if (!race) throw upsertErr;
        master_id = race.id;
      } else {
        master_id = upserted.id;
        createdMaster = true;
      }
    } else {
      master_id = existing.id;
    }

    // Try to map to project (idempotent)
    let credit_allocated = false;

    // Determine if any mapping exists for this master across projects
    const { count: mappingCount, error: countErr } = await supabaseAdmin
      .from("project_prospects")
      .select("id", { count: "exact", head: true })
      .eq("master_prospect_id", master_id);
    if (countErr) throw countErr;

    const isFirstMapping = (mappingCount ?? 0) === 0;

    const { data: mapping, error: mapErr } = await supabaseAdmin
      .from("project_prospects")
      .insert({
        project_id,
        master_prospect_id: master_id,
        added_by: caller.id,
        credit_allocated: isFirstMapping,
        credited_at: isFirstMapping ? new Date().toISOString() : null,
      })
      .select("id, credit_allocated, credited_at")
      .maybeSingle();

    if (mapErr && !(mapErr as any).message?.includes("duplicate key")) {
      throw mapErr;
    }

    if (isFirstMapping) {
      credit_allocated = true;
      const { error: logErr } = await supabaseAdmin
        .from("credits_log")
        .insert({
          master_prospect_id: master_id,
          project_id,
          user_id: caller.id,
          action: "allocate",
          details: { reason: "First mapping credit" },
        });
      if (logErr) console.error("credits_log error", logErr);
    }

    // Enqueue enrichment job
    const { error: jobErr } = await supabaseAdmin
      .from("enrichment_jobs")
      .insert({ master_prospect_id: master_id, status: "pending" });
    if (jobErr) console.error("enrichment_jobs error", jobErr);

    // Notify project owner
    const ownerId = project!.owner_id as string;
    const { error: notifErr } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: ownerId,
        type: "rtne_new_prospect",
        payload: { master_prospect_id: master_id, project_id, created_by: caller.id, username },
      });
    if (notifErr) console.error("notifications error", notifErr);

    // Audit
    const { error: auditErr } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: caller.id,
        action: createdMaster ? "rtne_create_master" : "rtne_link_existing",
        target_table: "master_prospects",
        target_id: master_id,
        details: { project_id, username, credit_allocated },
      });
    if (auditErr) console.error("audit error", auditErr);

    // Build response data
    // Query existing mappings to show duplicates/owners/projects
    const { data: mappings } = await supabaseAdmin
      .from("project_prospects")
      .select("created_at, credit_allocated, credited_at, projects(name, owner_id), added_by")
      .eq("master_prospect_id", master_id);

    const response = {
      success: true,
      createdMaster,
      creditAllocated: credit_allocated,
      message: createdMaster
        ? "Created new master prospect and mapped to project"
        : "Already in DB — showing existing mappings",
      master_prospect_id: master_id,
      mappings,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("rtne-check-or-create error", e);
    return new Response(JSON.stringify({ error: e.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
