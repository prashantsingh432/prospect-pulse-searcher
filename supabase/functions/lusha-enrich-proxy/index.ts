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

    // Build query parameters for Lusha API v2 (GET method, not POST!)
    const queryParams: Record<string, string> = {};

    // Add parameters based on what's provided
    if (params.linkedinUrl) {
      queryParams.linkedinUrl = params.linkedinUrl;
      console.log(`🔗 Using LinkedIn URL: ${params.linkedinUrl}`);
    } else if (params.firstName || params.lastName || params.companyName) {
      // For name + company search
      if (params.firstName) queryParams.firstName = params.firstName;
      if (params.lastName) queryParams.lastName = params.lastName;
      if (params.companyName) queryParams.companyName = params.companyName;
      console.log(`👤 Using Name + Company: ${params.firstName} ${params.lastName} @ ${params.companyName}`);
    }

    // Build URL with query parameters
    const searchParams = new URLSearchParams(queryParams);
    const lushaUrl = `https://api.lusha.com/v2/person?${searchParams}`;

    console.log(`📤 Request URL:`, lushaUrl);

    // ✅ FIXED: GET request to /v2/person with query parameters
    const lushaResponse = await fetch(lushaUrl, {
      method: "GET",  // ✅ FIXED: GET not POST!
      headers: {
        "api_key": apiKey,  // ✅ CORRECT: Lusha requires "api_key" header
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        status: 0,
        data: null,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
