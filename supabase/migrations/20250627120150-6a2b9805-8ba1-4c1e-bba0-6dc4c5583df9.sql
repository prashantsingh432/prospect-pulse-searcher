
-- Add new columns for additional contact numbers
ALTER TABLE prospects
ADD COLUMN IF NOT EXISTS prospect_number2 text,
ADD COLUMN IF NOT EXISTS prospect_number3 text,
ADD COLUMN IF NOT EXISTS prospect_number4 text;

-- Add comments to document the purpose of each column
COMMENT ON COLUMN prospects.prospect_number IS 'Primary contact number';
COMMENT ON COLUMN prospects.prospect_number2 IS 'Secondary contact number (optional)';
COMMENT ON COLUMN prospects.prospect_number3 IS 'Tertiary contact number (optional)';
COMMENT ON COLUMN prospects.prospect_number4 IS 'Quaternary contact number (optional)';
