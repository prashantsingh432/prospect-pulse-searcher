import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
}

async function verifyToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)
  const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key'
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )

  const payload = await verify(token, key)
  
  if (!payload) {
    throw new Error('Invalid token')
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired')
  }

  return payload
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify authentication for all requests
    const authHeader = req.headers.get('Authorization')
    let user
    
    try {
      user = await verifyToken(authHeader)
    } catch (error) {
      return new Response(JSON.stringify({ message: 'Unauthorized - invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST') {
      // Save new prospect
      const { name, job_title, company, location, linkedin_url } = await req.json()

      // Validate required fields
      if (!name || !linkedin_url) {
        return new Response(JSON.stringify({ message: 'Missing required fields: name and linkedin_url' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Check if prospect already exists
      const { data: existingProspect } = await supabaseAdmin
        .from('chrome_prospects')
        .select('id')
        .eq('linkedin_url', linkedin_url)
        .single()

      if (existingProspect) {
        return new Response(JSON.stringify({ message: 'Prospect already exists' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Insert new prospect
      const { data: prospect, error } = await supabaseAdmin
        .from('chrome_prospects')
        .insert({
          user_id: user.user_id,
          name,
          job_title,
          company,
          location,
          linkedin_url
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting prospect:', error)
        return new Response(JSON.stringify({ message: 'Failed to save prospect' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Prospect saved successfully:', prospect.name)

      return new Response(JSON.stringify(prospect), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'GET') {
      // Get user's prospects with pagination
      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const search = url.searchParams.get('search') || ''
      
      const offset = (page - 1) * limit

      let query = supabaseAdmin
        .from('chrome_prospects')
        .select('*', { count: 'exact' })
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,job_title.ilike.%${search}%`)
      }

      const { data: prospects, error, count } = await query

      if (error) {
        console.error('Error fetching prospects:', error)
        return new Response(JSON.stringify({ message: 'Failed to fetch prospects' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({
        prospects,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil((count || 0) / limit)
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'DELETE') {
      // Delete prospect
      const url = new URL(req.url)
      const prospectId = url.searchParams.get('id')

      if (!prospectId) {
        return new Response(JSON.stringify({ message: 'Prospect ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabaseAdmin
        .from('chrome_prospects')
        .delete()
        .eq('id', prospectId)
        .eq('user_id', user.user_id) // Ensure user can only delete their own prospects

      if (error) {
        console.error('Error deleting prospect:', error)
        return new Response(JSON.stringify({ message: 'Failed to delete prospect' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ message: 'Prospect deleted successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Prospects API error:', error)
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})