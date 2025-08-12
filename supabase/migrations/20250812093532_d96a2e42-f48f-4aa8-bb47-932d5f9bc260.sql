-- Step 1: Fix Infinite Recursion - Drop problematic policies and create safe ones

-- Drop all existing problematic policies on users table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view basic user info for dispositi" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Create a safe security definer function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the role from user_metadata in auth.users
    SELECT COALESCE(
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'project_name',
        'caller'
    ) INTO user_role;
    
    -- Return 'admin' if project_name is 'ADMIN', otherwise 'caller'
    IF user_role = 'ADMIN' THEN
        RETURN 'admin';
    ELSE
        RETURN 'caller';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create safe RLS policies without recursion
CREATE POLICY "Safe admin read all users"
ON public.users
FOR SELECT
USING (
    auth.uid() IS NOT NULL 
    AND (
        get_user_role_safe() = 'admin'
        OR id = auth.uid()
    )
);

CREATE POLICY "Safe admin update users"
ON public.users
FOR UPDATE
USING (
    auth.uid() IS NOT NULL 
    AND (
        get_user_role_safe() = 'admin'
        OR id = auth.uid()
    )
);

CREATE POLICY "Safe admin insert users"
ON public.users
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND get_user_role_safe() = 'admin'
);

CREATE POLICY "Safe admin delete users"
ON public.users
FOR DELETE
USING (
    auth.uid() IS NOT NULL 
    AND get_user_role_safe() = 'admin'
);

-- Enable realtime for users table
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Add to realtime publication if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;
END $$;