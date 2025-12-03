-- Add company_linkedin_url column to prospects table for Data Management export
ALTER TABLE public.prospects 
ADD COLUMN IF NOT EXISTS company_linkedin_url text;