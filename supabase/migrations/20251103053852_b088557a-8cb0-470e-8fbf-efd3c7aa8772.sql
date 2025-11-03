-- Add INSERT policy for prospects table to allow data uploads
CREATE POLICY "Authenticated users can insert prospects"
ON public.prospects
FOR INSERT
TO authenticated
WITH CHECK (true);