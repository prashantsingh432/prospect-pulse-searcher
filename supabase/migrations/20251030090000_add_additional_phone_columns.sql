-- Add additional phone number columns to rtne_requests table
ALTER TABLE rtne_requests
ADD COLUMN IF NOT EXISTS phone_2 TEXT,
ADD COLUMN IF NOT EXISTS phone_3 TEXT,
ADD COLUMN IF NOT EXISTS phone_4 TEXT;

-- Add comments for documentation
COMMENT ON COLUMN rtne_requests.primary_phone IS 'Primary contact phone number';
COMMENT ON COLUMN rtne_requests.phone_2 IS 'Secondary contact phone number';
COMMENT ON COLUMN rtne_requests.phone_3 IS 'Tertiary contact phone number';
COMMENT ON COLUMN rtne_requests.phone_4 IS 'Quaternary contact phone number';
