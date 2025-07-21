
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log("Fetching users using admin API...");

    // List all users using admin API
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("Error listing users:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`Successfully fetched ${data.users.length} users`);

    // Enrich user data with additional info from users table
    const enrichedUsers = [];
    
    for (const user of data.users) {
      try {
        // Get additional user data from users table
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('role, name, status, last_active')
          .eq('id', user.id)
          .single();

        enrichedUsers.push({
          ...user,
          role: userData?.role || user.user_metadata?.role || 'caller',
          name: userData?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
          status: userData?.status || 'active',
          last_active: userData?.last_active
        });
      } catch (enrichError) {
        console.log(`Could not enrich user ${user.email}:`, enrichError);
        // Still add the user with basic info
        enrichedUsers.push({
          ...user,
          role: user.user_metadata?.role || 'caller',
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          status: 'active'
        });
      }
    }

    return new Response(
      JSON.stringify({ users: enrichedUsers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exception in list-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
