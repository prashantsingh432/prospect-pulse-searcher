-- Clean up duplicate rtne_requests records, keeping only the one with most data for each row_number
-- This is a one-time cleanup to fix the duplicate records issue

-- Delete duplicate records, keeping the one with the most data (has primary_phone/email/full_name)
WITH ranked_records AS (
  SELECT 
    id,
    row_number,
    user_id,
    project_name,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, project_name, row_number 
      ORDER BY 
        CASE WHEN primary_phone IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE WHEN email_address IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE WHEN full_name IS NOT NULL THEN 1 ELSE 0 END DESC,
        updated_at DESC
    ) as rn
  FROM rtne_requests
)
DELETE FROM rtne_requests
WHERE id IN (
  SELECT id FROM ranked_records WHERE rn > 1
);

-- Add a comment documenting this cleanup
COMMENT ON TABLE rtne_requests IS 'RTNE requests table - cleaned up duplicate records on 2025-12-03';