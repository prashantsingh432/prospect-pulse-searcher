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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const userMetadata = user.user_metadata || {}
    const isAdmin = userMetadata.project_name === 'ADMIN'
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { method } = req
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (method === 'GET' && action === 'list') {
      // List all auth users
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
      
      if (error) {
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
      const { email, password, fullName, projectName, role } = await req.json()

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

      const effectiveProjectName = role === 'admin' ? 'ADMIN' : projectName

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          project_name: role === 'admin' ? 'ADMIN' : effectiveProjectName
        }
      })

      if (error) {
        return new Response(JSON.stringify({ error: error.message || 'Failed to create user' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Also insert into public.users table
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: fullName,
          role: role === 'admin' ? 'admin' : 'caller',
          project_name: role === 'admin' ? 'ADMIN' : effectiveProjectName,
          status: 'active'
        })

      if (insertError) {
        console.error('Error inserting into public.users:', insertError)
      }

      return new Response(JSON.stringify({ 
        success: true, 
        user: {
          id: data.user.id,
          email: data.user.email,
          name: fullName,
          role: role === 'admin' ? 'admin' : 'caller',
          project_name: role === 'admin' ? 'ADMIN' : effectiveProjectName
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (method === 'PUT' && action === 'update') {
      // Update auth user
      const { userId, email, fullName, projectName, role } = await req.json()
      
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email,
        user_metadata: {
          full_name: fullName,
          project_name: role === 'admin' ? 'ADMIN' : projectName
        }
      })

      if (error) {
        throw error
      }

      // Also update public.users table
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          email,
          name: fullName,
          role: role === 'admin' ? 'admin' : 'caller',
          project_name: role === 'admin' ? 'ADMIN' : projectName
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
      if (!userId) {
        try {
          const body = await req.json()
          userId = body?.userId ?? null
        } catch (_) {
          // ignore parse errors
        }
      }

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing userId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) {
        return new Response(JSON.stringify({ error: error.message || 'Failed to delete user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Also delete from public.users table
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      if (deleteError) {
        console.error('Error deleting from public.users:', deleteError)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})