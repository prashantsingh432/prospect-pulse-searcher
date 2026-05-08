-- ============================================================
-- Add company_domain and prospect_located_from columns
-- to the prospects table
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS company_domain text;

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS prospect_located_from text;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prospects' 
ORDER BY ordinal_position;
