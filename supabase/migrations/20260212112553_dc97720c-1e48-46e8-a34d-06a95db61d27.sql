
-- =====================================================
-- INSERT SPAM HISTORY RECORDS FOR ALL 30 ENTRIES
-- Then: Inactive → Spam, Active stays Active, Deactivated untouched
-- =====================================================

-- First, insert all spam history records
INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2025-12-12'::date, 'Spam reported by Mahima Rawat'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650681' AND sa.name = 'Mahima Rawat';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-06'::date, 'Spam reported by Sarika Negi'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208647' AND sa.name = 'Sarika Negi';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-07'::date, 'Spam reported by Anjali Bisht'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208654' AND sa.name = 'Anjali Bisht';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-08'::date, 'Spam reported by Sarika Negi'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208656' AND sa.name = 'Sarika Negi';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-12'::date, 'Spam reported by Shweta Gupta'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208099' AND sa.name = 'Shweta Gupta';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-12'::date, 'Spam reported by Devashish Basnet'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208663' AND sa.name = 'Devashish Basnet';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-13'::date, 'Spam reported by Abhay Nagrath'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650676' AND sa.name = 'Abhay Nagrath';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-15'::date, 'Spam reported by Monika Gurung'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650673' AND sa.name = 'Monika';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-19'::date, 'Spam reported by Archana'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650678' AND sa.name = 'Archana';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-20'::date, 'Spam reported by Apoorva Chauhan'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208049' AND sa.name = 'Apoorva Chauhan';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-20'::date, 'Spam reported by Rishita'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208664' AND sa.name = 'Rishita';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-22'::date, 'Spam reported by Shubhangi'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650688' AND sa.name = 'Shubhangi';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-27'::date, 'Spam reported by Muskan Tomar'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258237050' AND sa.name = 'Muskan Tomar';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-01-27'::date, 'Spam reported by Co-Existing DC/Monika'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650683' AND sa.name = 'Monika';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-02'::date, 'Spam reported by Shweta Gupta'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208649' AND sa.name = 'Shweta Gupta';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-02'::date, 'Spam reported by Arnima'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650677' AND sa.name = 'Arnima';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-02'::date, 'Spam reported by Mangaal'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650691' AND sa.name = 'Mangaal';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-02'::date, 'Spam reported by Riya Bhatt'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650672' AND sa.name = 'Riya Bhatt';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-03'::date, 'Spam reported by Sarika Negi'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208661' AND sa.name = 'Sarika Negi';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-03'::date, 'Spam reported by Aditi Kodari'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650686' AND sa.name = 'Aditi Kodari';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-03'::date, 'Spam reported by Shweta Gupta'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650674' AND sa.name = 'Shweta Gupta';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-04'::date, 'Spam reported by Mangaal'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650676' AND sa.name = 'Mangaal';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-04'::date, 'Spam reported by Mahak Kulhan'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650690' AND sa.name = 'Mahak Kulhan';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-09'::date, 'Spam reported by Aman Bhandari'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258207419' AND sa.name = 'Aman Bhandari';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-10'::date, 'Spam reported by Co-Existing SISCo/Sarika'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208662' AND sa.name = 'Sarika Negi';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-11'::date, 'Spam reported by Apoorva Chauhan'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208049' AND sa.name = 'Apoorva Chauhan';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-11'::date, 'Spam reported by Varnika'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208095' AND sa.name = 'Varnika';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-11'::date, 'Spam reported by Apoorva Chauhan'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919520650675' AND sa.name = 'Apoorva Chauhan';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-11'::date, 'Spam reported by Monika Gurung'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208645' AND sa.name = 'Monika';

INSERT INTO sim_spam_history (sim_id, agent_id, spam_date, remarks)
SELECT sm.id, sa.id, '2026-02-12'::date, 'Spam reported by Mahima Rawat'
FROM sim_master sm, sim_agents sa WHERE sm.sim_number = '+919258208657' AND sa.name = 'Mahima Rawat';

-- =====================================================
-- UPDATE spam_count based on total history entries per SIM
-- =====================================================
UPDATE sim_master sm SET 
  spam_count = sub.total_spam,
  last_spam_date = sub.latest_spam,
  risk_level = CASE 
    WHEN sub.total_spam >= 5 THEN 'High Risk'
    WHEN sub.total_spam >= 3 THEN 'Warning'
    ELSE 'Normal'
  END::sim_risk_level
FROM (
  SELECT ssh.sim_id, COUNT(*) as total_spam, MAX(ssh.spam_date) as latest_spam
  FROM sim_spam_history ssh
  GROUP BY ssh.sim_id
) sub
WHERE sm.id = sub.sim_id;

-- =====================================================
-- ONLY change Inactive SIMs to Spam (not Active, not Deactivated)
-- =====================================================
UPDATE sim_master SET current_status = 'Spam'
WHERE current_status = 'Inactive'
AND sim_number IN (
  '+919258207419', '+919258208049', '+919258208649',
  '+919258208662', '+919520650672', '+919520650677',
  '+919520650683', '+919520650686'
);
