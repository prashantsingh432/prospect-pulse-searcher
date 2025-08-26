import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DispositionRequest {
  prospect_id: number;
  disposition_type: 'not_interested' | 'wrong_number' | 'dnc' | 'call_back_later' | 'not_relevant' | 'others';
  custom_reason?: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client with user's auth token for authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })

    // Admin client for secure operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Authenticated user:', user.id)

    // Parse request body
    const body: DispositionRequest = await req.json()
    const { prospect_id, disposition_type, custom_reason } = body

    // Validate required fields
    if (!prospect_id || !disposition_type) {
      return new Response(
        JSON.stringify({ error: 'prospect_id and disposition_type are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // First, ensure the user exists in the users table by calling sync function
    console.log('Syncing user profile for:', user.id)
    try {
      await supabaseAdmin.rpc('sync_user_profile')
      console.log('User profile synced successfully')
    } catch (syncError) {
      console.warn('Could not sync user profile:', syncError)
    }

    // Fetch user profile from users table using admin client
    console.log('Fetching user profile for:', user.id)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('name, project_name, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // Continue with fallback values instead of failing
    }

    console.log('User profile found:', userProfile)

    // Determine user name with comprehensive fallbacks
    const userName = userProfile?.name ||
                     user.user_metadata?.full_name ||
                     userProfile?.email?.split('@')[0] ||
                     user.email?.split('@')[0] ||
                     'Unknown User'

    // Determine project name with comprehensive fallbacks
    const projectName = userProfile?.project_name ||
                        user.user_metadata?.project_name ||
                        'Unknown Project'

    console.log('Final user data for disposition:', {
      user_id: user.id,
      user_name: userName,
      project_name: projectName,
      source: {
        from_db: !!userProfile?.name,
        from_metadata: !!user.user_metadata?.full_name,
        from_email: !userProfile?.name && !user.user_metadata?.full_name
      }
    })

    // Prepare disposition data with user info
    const dispositionData = {
      prospect_id,
      user_id: user.id,
      disposition_type,
      custom_reason: disposition_type === 'others' ? custom_reason : null,
      user_name: userName,
      project_name: projectName
    }

    console.log('Creating disposition with data:', dispositionData)

    // Insert disposition using admin client to ensure it succeeds
    const { data: disposition, error: insertError } = await supabaseAdmin
      .from('dispositions')
      .insert(dispositionData)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting disposition:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create disposition', details: insertError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Disposition created successfully:', disposition)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: disposition,
        message: 'Disposition created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
