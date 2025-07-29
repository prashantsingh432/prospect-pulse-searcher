-- Create RLS policy to allow authenticated users to view basic user info for disposition history
CREATE POLICY "Allow authenticated users to view basic user info for disposition history" 
ON public.users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);