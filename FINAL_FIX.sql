-- FINAL FIX for Disposition User Tracking Issue
-- This will solve the "Unknown Agent (Project: N/A)" problem once and for all
-- Copy and paste this into Supabase Dashboard → SQL Editor → Run

-- ============================================================================
-- STEP 1: Fix RLS Policies on Users Table
-- ============================================================================

-- Drop ALL existing conflicting policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Safe admin read all users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view basic user info for disposition history" ON public.users;
DROP POLICY IF EXISTS "All authenticated users can read user profiles for dispositions" ON public.users;

-- Create ONE simple policy: All authenticated users can read user profiles
CREATE POLICY "Authenticated users can read all user profiles" 
ON public.users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Keep the update policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- STEP 2: Ensure Dispositions Table Has User Data Columns
-- ============================================================================

-- Add columns if they don't exist
ALTER TABLE public.dispositions 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- ============================================================================
-- STEP 3: Backfill Existing Dispositions with User Data
-- ============================================================================

-- Update all existing dispositions that have missing user data
UPDATE public.dispositions 
SET 
  user_name = COALESCE(
    dispositions.user_name, 
    users.name, 
    split_part(users.email, '@', 1), 
    'Unknown User'
  ),
  project_name = COALESCE(
    dispositions.project_name, 
    users.project_name, 
    'Unknown Project'
  )
FROM public.users 
WHERE dispositions.user_id = users.id
  AND (dispositions.user_name IS NULL OR dispositions.project_name IS NULL);

-- ============================================================================
-- STEP 4: Create Trigger for Future Dispositions
-- ============================================================================

-- Function to automatically populate user data on disposition insert
CREATE OR REPLACE FUNCTION public.auto_populate_disposition_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Only populate if data is missing
  IF NEW.user_name IS NULL OR NEW.project_name IS NULL THEN
    SELECT 
      COALESCE(NEW.user_name, u.name, split_part(u.email, '@', 1), 'Unknown User'),
      COALESCE(NEW.project_name, u.project_name, 'Unknown Project')
    INTO NEW.user_name, NEW.project_name
    FROM public.users u
    WHERE u.id = NEW.user_id;
    
    -- Final fallbacks if user not found
    NEW.user_name := COALESCE(NEW.user_name, 'Unknown User');
    NEW.project_name := COALESCE(NEW.project_name, 'Unknown Project');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_populate_disposition_user_data_trigger ON public.dispositions;
CREATE TRIGGER auto_populate_disposition_user_data_trigger
  BEFORE INSERT ON public.dispositions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_disposition_user_data();

-- ============================================================================
-- STEP 5: Verification Query
-- ============================================================================

-- Test query to verify the fix works
SELECT 
  'VERIFICATION RESULTS' as test_type,
  COUNT(*) as total_dispositions,
  COUNT(CASE WHEN user_name IS NOT NULL AND user_name != 'Unknown User' THEN 1 END) as dispositions_with_names,
  COUNT(CASE WHEN project_name IS NOT NULL AND project_name != 'Unknown Project' THEN 1 END) as dispositions_with_projects
FROM public.dispositions;

-- Show sample dispositions to verify
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
LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 DISPOSITION FIX COMPLETED!';
  RAISE NOTICE '✅ RLS policies updated - all users can now read user profiles';
  RAISE NOTICE '✅ Existing dispositions backfilled with user data';
  RAISE NOTICE '✅ Trigger created for future dispositions';
  RAISE NOTICE '📱 Frontend should now show proper names instead of "Unknown Agent"';
  RAISE NOTICE '🔄 Refresh your browser to see the changes';
END $$;
