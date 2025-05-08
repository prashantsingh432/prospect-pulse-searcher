
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

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

    // Get the request body
    const { users } = await req.json();

    if (!Array.isArray(users)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body. Expected an array of users.' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Results array to track success/failure for each user
    const results = [];

    // Create each user
    for (const user of users) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true // Auto-confirm emails
        });

        if (error) {
          results.push({
            email: user.email,
            success: false,
            message: error.message
          });
          console.error(`Error creating user ${user.email}:`, error.message);
        } else {
          results.push({
            email: user.email,
            success: true,
            userId: data.user.id
          });
          
          // Insert into users table with 'caller' role
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: data.user.id,
              email: user.email,
              role: 'caller',
              name: user.email.split('@')[0] // Extract name from email
            });
          
          if (insertError) {
            console.error(`Error adding user ${user.email} to users table:`, insertError.message);
          }
        }
      } catch (err) {
        results.push({
          email: user.email,
          success: false,
          message: err.message || 'Unknown error'
        });
        console.error(`Exception creating user ${user.email}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
