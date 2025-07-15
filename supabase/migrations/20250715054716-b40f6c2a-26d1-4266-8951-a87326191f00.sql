-- First, add the missing prospect_designation column
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS prospect_designation text;

-- Set replica identity to enable deletes (required for realtime)
ALTER TABLE prospects REPLICA IDENTITY FULL;

-- Clear all existing data from prospects table to prepare for fresh data upload
DELETE FROM prospects;