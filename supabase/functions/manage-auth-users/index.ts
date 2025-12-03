
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Admin client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create a client with the user's token to verify authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the user is authenticated using their token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const userMetadata = user.user_metadata || {}
    const isAdmin = userMetadata.project_name === 'ADMIN'
    
    if (!isAdmin) {
      console.error('User is not admin:', user.email, 'metadata:', userMetadata)
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { method } = req
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    console.log(`Processing ${method} request with action: ${action}`)

    if (method === 'GET' && action === 'list') {
      // List all auth users
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
      
      if (error) {
        console.error('Error listing users:', error)
        throw error
      }

      const enrichedUsers = users.map(authUser => ({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
        role: authUser.user_metadata?.project_name === 'ADMIN' ? 'admin' : 'caller',
        project_name: authUser.user_metadata?.project_name || 'Unknown',
        last_active: authUser.last_sign_in_at,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at,
        status: 'active'
      }))

      return new Response(JSON.stringify({ users: enrichedUsers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (method === 'POST' && action === 'create') {
      // Create new auth user
      const body = await req.json()
      const { email, password, fullName, projectName, role } = body

      console.log('Creating user with:', { email, fullName, role, projectName })

      const cleanEmail = (email || '').toString().trim().toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(cleanEmail)) {
        return new Response(JSON.stringify({ error: 'Invalid email format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (!password || password.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (!fullName || fullName.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Full name is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const effectiveProjectName = role === 'admin' ? 'ADMIN' : projectName

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          project_name: effectiveProjectName
        }
      })

      if (error) {
        console.error('Error creating user:', error)
        return new Response(JSON.stringify({ error: error.message || 'Failed to create user' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('User created successfully:', data.user.email)

      // Also insert into public.users table
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: fullName,
          role: role === 'admin' ? 'admin' : 'caller',
          project_name: effectiveProjectName,
          status: 'active'
        })

      if (insertError) {
        console.error('Error inserting into public.users:', insertError)
        // Don't fail the request if this fails, the auth user was created successfully
      }

      return new Response(JSON.stringify({ 
        success: true, 
        user: {
          id: data.user.id,
          email: data.user.email,
          name: fullName,
          role: role === 'admin' ? 'admin' : 'caller',
          project_name: effectiveProjectName
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (method === 'PUT' && action === 'update') {
      // Update auth user
      const body = await req.json()
      const { userId, email, fullName, projectName, role } = body
      
      console.log('Updating user:', userId, { email, fullName, role, projectName })

      if (!userId || !email || !fullName) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const effectiveProjectName = role === 'admin' ? 'ADMIN' : projectName

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email,
        user_metadata: {
          full_name: fullName,
          project_name: effectiveProjectName
        }
      })

      if (error) {
        console.error('Error updating user:', error)
        return new Response(JSON.stringify({ error: error.message || 'Failed to update user' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('User updated successfully:', data.user.email)

      // Also update public.users table
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          email,
          name: fullName,
          role: role === 'admin' ? 'admin' : 'caller',
          project_name: effectiveProjectName
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating public.users:', updateError)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (method === 'DELETE' && action === 'delete') {
      // Delete auth user - accept userId via body or query param
      let userId: string | null = url.searchParams.get('userId')
      
      console.log('DELETE request received:', { 
        method, 
        action, 
        userIdFromQuery: userId,
        url: req.url 
      })

      if (!userId) {
        try {
          const body = await req.json()
          userId = body?.userId ?? null
          console.log('Got userId from body:', userId)
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.log('No body or invalid JSON in DELETE request:', errorMessage)
        }
      }

      if (!userId) {
        console.error('Missing userId in DELETE request')
        return new Response(JSON.stringify({ error: 'Missing userId parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Attempting to delete user:', userId)

      try {
        // First get user info before deletion for logging
        const { data: userInfo, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (getUserError) {
          console.log('Warning: Could not get user info before deletion:', getUserError.message)
        } else {
          console.log('Deleting user:', userInfo?.user?.email || userId)
        }

        // Use the cascade delete function to clean up all related data first
        console.log('Calling admin_delete_user_cascade function for userId:', userId)
        const { data: cascadeResult, error: cascadeError } = await supabaseAdmin.rpc('admin_delete_user_cascade', {
          user_id_param: userId
        })

        if (cascadeError) {
          console.error('Error in cascade delete function:', cascadeError)
          // Still try to continue with auth user deletion
        } else {
          console.log('Cascade delete function result:', cascadeResult)
        }

        // Then delete from auth.users
        console.log('Attempting to delete from auth.users:', userId)
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteAuthError) {
          console.error('Error deleting from auth.users:', deleteAuthError)
          return new Response(JSON.stringify({ 
            error: `Failed to delete user from authentication: ${deleteAuthError.message}` 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('Successfully deleted user from auth.users:', userId)

        return new Response(JSON.stringify({ 
          success: true, 
          message: `User ${userInfo?.user?.email || userId} deleted successfully` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (deleteError) {
        console.error('Unexpected error during user deletion:', deleteError)
        const errorMessage = deleteError instanceof Error ? deleteError.message : 'Unknown error';
        return new Response(JSON.stringify({ 
          error: `Database error deleting user: ${errorMessage}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
