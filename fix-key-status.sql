-- Fix Lusha API Key Status
-- This script resets the key status from EXHAUSTED to ACTIVE
-- and updates the credits to match the Lusha dashboard (16 credits)

-- Update the key ending in ...4ecc
UPDATE lusha_api_keys
SET 
  status = 'ACTIVE',
  is_active = true,
  credits_remaining = 16,
  last_used_at = NULL
WHERE key_value LIKE '%4ecc';

-- Verify the update
SELECT 
  id,
  RIGHT(key_value, 8) as key_ending,
  category,
  status,
  is_active,
  credits_remaining,
  last_used_at
FROM lusha_api_keys
WHERE key_value LIKE '%4ecc';
