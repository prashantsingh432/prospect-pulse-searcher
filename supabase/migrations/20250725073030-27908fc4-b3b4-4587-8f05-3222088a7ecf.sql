-- Add RLS policies for UPDATE and DELETE operations on prospects table

-- Allow authenticated users to update prospects
CREATE POLICY "Authenticated users can update prospects" 
ON public.prospects 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete prospects
CREATE POLICY "Authenticated users can delete prospects" 
ON public.prospects 
FOR DELETE 
TO authenticated
USING (true);