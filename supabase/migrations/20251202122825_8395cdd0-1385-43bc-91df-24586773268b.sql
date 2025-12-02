-- Add UPDATE policy for users to update their own RTNE requests
-- This is critical for data persistence - users need to save enriched data

CREATE POLICY "Users can update their own requests" 
ON public.rtne_requests 
FOR UPDATE 
USING (user_id = auth.uid());

-- Also add a comment to document this
COMMENT ON POLICY "Users can update their own requests" ON public.rtne_requests IS 'Allows users to update their own RTNE requests to persist enriched data';