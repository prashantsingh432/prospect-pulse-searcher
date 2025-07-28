-- Drop the existing admin delete policy that might cause recursion
DROP POLICY IF EXISTS "Admins can delete any disposition" ON public.dispositions;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Add admin delete policy using the security definer function
CREATE POLICY "Admins can delete any disposition" 
ON public.dispositions 
FOR DELETE 
USING (public.get_current_user_role() = 'admin');