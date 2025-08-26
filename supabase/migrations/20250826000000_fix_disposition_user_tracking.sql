-- Fix disposition user tracking by ensuring proper user data is captured
-- This migration ensures that dispositions always have accurate user_name and project_name

-- First, ensure the dispositions table has the required columns (should already exist)
ALTER TABLE public.dispositions 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Update the sync_user_profile function to be more robust
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_rec record;
BEGIN
  -- Get current user info from auth
  SELECT 
    auth.uid() as id,
    auth.email() as email,
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'full_name' as full_name,
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'project_name' as project_name
  INTO user_rec
  WHERE auth.uid() IS NOT NULL;
  
  -- Only proceed if user is authenticated
  IF user_rec.id IS NOT NULL THEN
    -- Insert or update user in users table
    INSERT INTO public.users (id, email, name, role, project_name, last_active)
    VALUES (
      user_rec.id,
      user_rec.email,
      COALESCE(user_rec.full_name, split_part(user_rec.email, '@', 1)),
      CASE 
        WHEN user_rec.project_name = 'ADMIN' THEN 'admin'
        ELSE 'caller'
      END,
      COALESCE(user_rec.project_name, 'Unknown Project'),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.users.name),
      role = EXCLUDED.role,
      project_name = COALESCE(EXCLUDED.project_name, public.users.project_name, 'Unknown Project'),
      last_active = now();
  END IF;
END;
$function$;

-- Create a function to get user display info for dispositions
CREATE OR REPLACE FUNCTION public.get_user_display_info(user_uuid UUID)
RETURNS TABLE(display_name TEXT, display_project TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(u.name, split_part(u.email, '@', 1), 'Unknown User') as display_name,
    COALESCE(u.project_name, 'Unknown Project') as display_project
  FROM public.users u
  WHERE u.id = user_uuid;
  
  -- If no user found, return defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'Unknown User'::TEXT, 'Unknown Project'::TEXT;
  END IF;
END;
$function$;

-- Update existing dispositions that have NULL user_name or project_name
UPDATE public.dispositions 
SET 
  user_name = COALESCE(user_name, (SELECT display_name FROM public.get_user_display_info(user_id))),
  project_name = COALESCE(project_name, (SELECT display_project FROM public.get_user_display_info(user_id)))
WHERE user_name IS NULL OR project_name IS NULL;

-- Create an index for better performance on disposition queries
CREATE INDEX IF NOT EXISTS idx_dispositions_user_id ON public.dispositions(user_id);

-- Ensure RLS policies are still in place and working correctly
-- The existing policies should be sufficient, but let's verify the key ones exist

-- Verify that authenticated users can create dispositions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dispositions' 
    AND policyname = 'Authenticated users can create dispositions'
  ) THEN
    CREATE POLICY "Authenticated users can create dispositions" 
    ON public.dispositions 
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Verify that authenticated users can view all dispositions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dispositions' 
    AND policyname = 'Authenticated users can view all dispositions'
  ) THEN
    CREATE POLICY "Authenticated users can view all dispositions" 
    ON public.dispositions 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Add a comment to track this migration
COMMENT ON TABLE public.dispositions IS 'Dispositions table with proper user tracking - updated 2025-08-26';
