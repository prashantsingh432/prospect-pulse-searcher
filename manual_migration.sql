-- Manual Migration Script for Disposition User Tracking Fix
-- Execute this in Supabase Dashboard → SQL Editor

-- Step 1: Ensure dispositions table has required columns
ALTER TABLE public.dispositions
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Step 2: Fix RLS policies for users table to allow all authenticated users to read basic user info
-- Drop conflicting policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Safe admin read all users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view basic user info for disposition history" ON public.users;

-- Create a single, clear policy that allows all authenticated users to read user info
CREATE POLICY "Authenticated users can read all user profiles for disposition display"
ON public.users
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Keep the update policy for users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Step 3: Create helper function to get user display info
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

-- Step 4: Update existing dispositions with missing user data
UPDATE public.dispositions
SET
  user_name = COALESCE(user_name, (SELECT display_name FROM public.get_user_display_info(user_id))),
  project_name = COALESCE(project_name, (SELECT display_project FROM public.get_user_display_info(user_id)))
WHERE user_name IS NULL OR project_name IS NULL;

-- Step 5: Create performance index
CREATE INDEX IF NOT EXISTS idx_dispositions_user_id ON public.dispositions(user_id);

-- Step 6: Ensure disposition RLS policies exist and are correct
DROP POLICY IF EXISTS "Authenticated users can create dispositions" ON public.dispositions;
DROP POLICY IF EXISTS "Authenticated users can view all dispositions" ON public.dispositions;

CREATE POLICY "Authenticated users can view all dispositions"
ON public.dispositions
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create dispositions"
ON public.dispositions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Step 7: Create a trigger to automatically populate user data on disposition insert
CREATE OR REPLACE FUNCTION public.populate_disposition_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Only populate if user_name or project_name is missing
  IF NEW.user_name IS NULL OR NEW.project_name IS NULL THEN
    SELECT
      COALESCE(NEW.user_name, u.name, split_part(u.email, '@', 1), 'Unknown User'),
      COALESCE(NEW.project_name, u.project_name, 'Unknown Project')
    INTO NEW.user_name, NEW.project_name
    FROM public.users u
    WHERE u.id = NEW.user_id;

    -- If user not found, use fallbacks
    IF NEW.user_name IS NULL THEN
      NEW.user_name := 'Unknown User';
    END IF;
    IF NEW.project_name IS NULL THEN
      NEW.project_name := 'Unknown Project';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS populate_disposition_user_data_trigger ON public.dispositions;
CREATE TRIGGER populate_disposition_user_data_trigger
  BEFORE INSERT ON public.dispositions
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_disposition_user_data();

-- Verification query - run this to check the results
SELECT 
  d.id,
  d.disposition_type,
  d.user_name,
  d.project_name,
  d.created_at,
  u.name as actual_user_name,
  u.project_name as actual_project_name
FROM public.dispositions d
LEFT JOIN public.users u ON d.user_id = u.id
ORDER BY d.created_at DESC
LIMIT 10;
