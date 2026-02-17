
-- Sync last_spam_date to actual latest spam history date for all SIMs
UPDATE sim_master sm
SET last_spam_date = (
  SELECT MAX(spam_date)::timestamp WITH TIME ZONE
  FROM sim_spam_history ssh
  WHERE ssh.sim_id = sm.id
)
WHERE sm.spam_count > 0
AND EXISTS (SELECT 1 FROM sim_spam_history WHERE sim_id = sm.id);
