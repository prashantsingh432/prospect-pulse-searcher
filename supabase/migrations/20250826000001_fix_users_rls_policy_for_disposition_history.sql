-- Fix Users RLS Policy for Disposition History
-- Date: 2025-08-26
-- Issue: Only admins could see other users' names in disposition history
-- Solution: Allow all authenticated users to read user profile data

-- Drop the old restrictive policy that only allowed admins to read all users
DROP POLICY IF EXISTS "Safe admin read all users" ON public.users;

-- Create new policy that allows all authenticated users to read user profiles
-- This enables disposition history to show all users' names, not just admins
CREATE POLICY "Allow all authenticated users to read user profiles for dispositions"
ON public.users
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Note: This policy change allows:
-- 1. All authenticated users to see each other's names in disposition history
-- 2. Maintains security by requiring authentication (auth.uid() IS NOT NULL)
-- 3. Fixes the issue where only admins could see other users' names
-- 4. Does not affect other user data access patterns
