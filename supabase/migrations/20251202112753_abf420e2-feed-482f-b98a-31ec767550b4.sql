-- Add additional phone number columns to rtne_requests table
ALTER TABLE public.rtne_requests 
ADD COLUMN IF NOT EXISTS phone2 text,
ADD COLUMN IF NOT EXISTS phone3 text,
ADD COLUMN IF NOT EXISTS phone4 text;