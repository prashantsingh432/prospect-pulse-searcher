
-- Delete duplicate spam history entries, keeping one per sim_id + spam_date
DELETE FROM sim_spam_history
WHERE id NOT IN (
  SELECT DISTINCT ON (sim_id, spam_date) id
  FROM sim_spam_history
  ORDER BY sim_id, spam_date, created_at ASC
);

-- Add unique constraint to prevent future duplicates on same sim + same date
ALTER TABLE sim_spam_history ADD CONSTRAINT unique_sim_spam_per_date UNIQUE (sim_id, spam_date);

-- Now recalculate spam_count for all sims based on actual distinct spam dates
UPDATE sim_master
SET spam_count = (
  SELECT count(*) FROM sim_spam_history WHERE sim_spam_history.sim_id = sim_master.id
),
risk_level = (CASE
  WHEN (SELECT count(*) FROM sim_spam_history WHERE sim_spam_history.sim_id = sim_master.id) > 3 THEN 'High Risk'
  ELSE 'Normal'
END)::sim_risk_level;
