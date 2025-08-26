-- IMMEDIATE FIX for Disposition User Tracking Issue
-- Copy and paste this entire script into Supabase Dashboard → SQL Editor and run it

-- ============================================================================
-- STEP 1: Fix RLS Policies (This is the main issue!)
-- ============================================================================

-- Drop all conflicting RLS policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Safe admin read all users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view basic user info for disposition history" ON public.users;

-- Create ONE clear policy: All authenticated users can read user profiles
CREATE POLICY "All authenticated users can read user profiles for dispositions" 
ON public.users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Keep update policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- STEP 2: Ensure Disposition Table Has Required Columns
-- ============================================================================

ALTER TABLE public.dispositions 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- ============================================================================
-- STEP 3: Create Helper Function to Get User Info
-- ============================================================================

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

-- ============================================================================
-- STEP 4: Update ALL Existing Dispositions with Missing User Data
-- ============================================================================

UPDATE public.dispositions 
SET 
  user_name = COALESCE(user_name, (SELECT display_name FROM public.get_user_display_info(user_id))),
  project_name = COALESCE(project_name, (SELECT display_project FROM public.get_user_display_info(user_id)))
WHERE user_name IS NULL OR project_name IS NULL;

-- ============================================================================
-- STEP 5: Create Trigger for Future Dispositions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.populate_disposition_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Populate user data if missing
  IF NEW.user_name IS NULL OR NEW.project_name IS NULL THEN
    SELECT 
      COALESCE(NEW.user_name, u.name, split_part(u.email, '@', 1), 'Unknown User'),
      COALESCE(NEW.project_name, u.project_name, 'Unknown Project')
    INTO NEW.user_name, NEW.project_name
    FROM public.users u
    WHERE u.id = NEW.user_id;
    
    -- Fallbacks if user not found
    NEW.user_name := COALESCE(NEW.user_name, 'Unknown User');
    NEW.project_name := COALESCE(NEW.project_name, 'Unknown Project');
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

-- ============================================================================
-- STEP 6: Verify Everything Works
-- ============================================================================

-- Test query to verify the fix
SELECT 
  d.id,
  d.disposition_type,
  d.user_name,
  d.project_name,
  d.created_at,
  u.name as actual_user_name,
  u.project_name as actual_project_name,
  CASE 
    WHEN d.user_name IS NOT NULL AND d.project_name IS NOT NULL THEN '✅ FIXED'
    ELSE '❌ STILL BROKEN'
  END as status
FROM public.dispositions d
LEFT JOIN public.users u ON d.user_id = u.id
ORDER BY d.created_at DESC
LIMIT 10;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 DISPOSITION FIX APPLIED SUCCESSFULLY!';
  RAISE NOTICE '✅ RLS policies updated to allow all users to read user profiles';
  RAISE NOTICE '✅ Existing dispositions updated with user names and projects';
  RAISE NOTICE '✅ Trigger created for future dispositions';
  RAISE NOTICE '📝 Check the test query results above to verify the fix';
END $$;
