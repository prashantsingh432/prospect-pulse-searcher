-- Add missing prospect_designation column to prospects table
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS prospect_designation text;

-- Clear all existing data from prospects table to prepare for fresh data upload
DELETE FROM prospects;