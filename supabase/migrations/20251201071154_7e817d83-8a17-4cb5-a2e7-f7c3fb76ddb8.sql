-- Add company_linkedin_url column to rtne_requests table
ALTER TABLE rtne_requests 
ADD COLUMN IF NOT EXISTS company_linkedin_url TEXT;