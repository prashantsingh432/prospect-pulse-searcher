import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { apiKey, params } = await req.json();

    console.log(`🔑 Received API key ending in ...${apiKey.slice(-4)}`);
    console.log(`📋 Parameters:`, params);

    // Build Lusha API URL
    const lushaUrl = new URL("https://api.lusha.com/v2/person");

    // Add parameters to URL
    if (params.linkedinUrl) {
      lushaUrl.searchParams.append("linkedinUrl", params.linkedinUrl);
    }
    if (params.firstName) {
      lushaUrl.searchParams.append("firstName", params.firstName);
    }
    if (params.lastName) {
      lushaUrl.searchParams.append("lastName", params.lastName);
    }
    if (params.companyName) {
      lushaUrl.searchParams.append("companyName", params.companyName);
    }

    // Always request both phones and emails
    lushaUrl.searchParams.append("revealPhones", "true");
    lushaUrl.searchParams.append("revealEmails", "true");

    console.log(`🔗 Calling Lusha API: ${lushaUrl.toString().substring(0, 100)}...`);

    // Make the actual API call to Lusha
    const lushaResponse = await fetch(lushaUrl.toString(), {
      method: "GET",
      headers: {
        "api_key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const responseData = await lushaResponse.json();

    console.log(`📊 Lusha Response Status: ${lushaResponse.status}`);
    console.log(`📊 Lusha Response Data:`, responseData);

    // Return the response
    return new Response(
      JSON.stringify({
        status: lushaResponse.status,
        data: responseData,
        error: lushaResponse.status !== 200 ? `HTTP ${lushaResponse.status}` : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`❌ Error in lusha-enrich-proxy:`, error);

    return new Response(
      JSON.stringify({
        status: 0,
        data: null,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
