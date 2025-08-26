-- Add denormalized user info to dispositions for reliable display
ALTER TABLE public.dispositions 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- No change to RLS needed; insert policy still enforces user_id = auth.uid()


