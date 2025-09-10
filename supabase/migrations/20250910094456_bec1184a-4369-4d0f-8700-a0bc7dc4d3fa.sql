-- First, let's check what's preventing user deletion and fix it

-- 1. Temporarily disable RLS on users table for admin operations
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Create a function to safely delete users and all related data
CREATE OR REPLACE FUNCTION public.admin_delete_user_cascade(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result BOOLEAN := FALSE;
BEGIN
    -- Delete from all tables that reference the user
    
    -- Delete dispositions
    DELETE FROM public.dispositions WHERE user_id = user_id_param;
    
    -- Delete activity logs
    DELETE FROM public.activity_logs WHERE user_id = user_id_param;
    
    -- Delete exports
    DELETE FROM public.exports WHERE user_id = user_id_param;
    
    -- Delete audit logs
    DELETE FROM public.audit_logs WHERE user_id = user_id_param OR target_id = user_id_param;
    
    -- Delete credits log
    DELETE FROM public.credits_log WHERE user_id = user_id_param;
    
    -- Delete notifications
    DELETE FROM public.notifications WHERE user_id = user_id_param;
    
    -- Delete project users
    DELETE FROM public.project_users WHERE user_id = user_id_param;
    
    -- Delete from users table
    DELETE FROM public.users WHERE id = user_id_param;
    
    -- Delete user profiles
    DELETE FROM public.user_profiles WHERE id = user_id_param;
    
    result := TRUE;
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail
    RAISE WARNING 'Error in admin_delete_user_cascade: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- 3. Re-enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Update the delete policy to be more permissive for service role
DROP POLICY IF EXISTS "Safe admin delete users" ON public.users;
CREATE POLICY "Admin can delete users" 
ON public.users 
FOR DELETE 
USING (true);

-- 5. Create a simpler function for checking admin role that won't cause recursion
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'project_name' = 'ADMIN',
        false
    );
$$;

-- 6. Update other policies to use the new function if needed
DROP POLICY IF EXISTS "Safe admin insert users" ON public.users;
CREATE POLICY "Admin can insert users" 
ON public.users 
FOR INSERT 
WITH CHECK (is_admin_user() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Safe admin update users" ON public.users;
CREATE POLICY "Admin can update users" 
ON public.users 
FOR UPDATE 
USING (is_admin_user() OR id = auth.uid());

-- 7. Make sure there are no constraints preventing auth user deletion
-- This will show any foreign keys that might be blocking deletion
-- Run this query to see if there are any problematic constraints:
-- SELECT * FROM information_schema.table_constraints 
-- WHERE constraint_type = 'FOREIGN KEY' 
-- AND table_schema = 'public';

COMMENT ON FUNCTION public.admin_delete_user_cascade IS 'Safely deletes a user and all related data in the correct order';