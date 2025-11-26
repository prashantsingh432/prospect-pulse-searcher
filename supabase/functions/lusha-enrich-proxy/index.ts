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

    // Build request body for Lusha API
    const requestBody: any = {
      revealPhones: true,
      revealEmails: true,
    };

    // Add parameters based on what's provided
    if (params.linkedinUrl) {
      requestBody.linkedinUrl = params.linkedinUrl;
      console.log(`🔗 Using LinkedIn URL: ${params.linkedinUrl}`);
    } else if (params.firstName || params.lastName || params.companyName) {
      // For name + company search
      if (params.firstName) requestBody.firstName = params.firstName;
      if (params.lastName) requestBody.lastName = params.lastName;
      if (params.companyName) requestBody.company = params.companyName; // ✅ CORRECT: "company" not "companyName"
      console.log(`👤 Using Name + Company: ${params.firstName} ${params.lastName} @ ${params.companyName}`);
    }

    console.log(`📤 Request Body:`, requestBody);

    // ✅ CORRECT: POST to /person/contact endpoint with JSON body
    const lushaResponse = await fetch("https://api.lusha.com/person/contact", {
      method: "POST",  // ✅ CORRECT: POST not GET
      headers: {
        "Authorization": apiKey,  // ✅ CORRECT: "Authorization" not "api_key"
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),  // ✅ CORRECT: Send as JSON body
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
