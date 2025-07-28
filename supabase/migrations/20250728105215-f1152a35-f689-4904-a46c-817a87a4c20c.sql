-- Enable real-time for dispositions table
ALTER TABLE public.dispositions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispositions;

-- Add delete policy for dispositions
CREATE POLICY "Users can delete their own dispositions" 
ON public.dispositions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add admin delete policy for dispositions
CREATE POLICY "Admins can delete any disposition" 
ON public.dispositions 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() 
  AND users.role = 'admin'
));