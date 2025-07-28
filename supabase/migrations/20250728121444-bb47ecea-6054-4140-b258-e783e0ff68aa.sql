-- Update RLS policy to allow all authenticated users to create dispositions
DROP POLICY IF EXISTS "Authenticated users can create dispositions" ON public.dispositions;

CREATE POLICY "Authenticated users can create dispositions" 
ON public.dispositions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);