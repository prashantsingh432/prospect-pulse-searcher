
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
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
        console.log(`Creating user: ${user.email} with role: ${user.role}`);
        
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true, // Auto-confirm emails
          user_metadata: {
            role: user.role || 'caller',
            full_name: user.email.split('@')[0]
          }
        });

        if (error) {
          console.error(`Error creating user ${user.email}:`, error.message);
          results.push({
            email: user.email,
            success: false,
            message: error.message
          });
        } else {
          console.log(`User ${user.email} created successfully with ID: ${data.user.id}`);
          
          // Insert into users table
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: data.user.id,
              email: user.email,
              role: user.role || 'caller',
              name: user.email.split('@')[0]
            });
          
          if (insertError) {
            console.error(`Error adding user ${user.email} to users table:`, insertError.message);
            // Don't fail the request if this fails, as the auth user is already created
          }

          results.push({
            email: user.email,
            success: true,
            userId: data.user.id,
            message: 'User created successfully'
          });
        }
      } catch (err) {
        console.error(`Exception creating user ${user.email}:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.push({
          email: user.email,
          success: false,
          message: errorMessage
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exception in create-users function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
