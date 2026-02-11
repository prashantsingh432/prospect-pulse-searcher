
-- First, drop the incorrect foreign key constraint
ALTER TABLE sim_master DROP CONSTRAINT IF EXISTS sim_master_assigned_agent_id_fkey;

-- Add correct foreign key to sim_agents
ALTER TABLE sim_master ADD CONSTRAINT sim_master_assigned_agent_id_fkey 
  FOREIGN KEY (assigned_agent_id) REFERENCES sim_agents(id);

-- Now insert SIMs linked to agents
WITH agent_lookup AS (
  SELECT id, name FROM sim_agents
)
INSERT INTO sim_master (sim_number, operator, current_status, assigned_agent_id, project_name, spam_count, risk_level)
VALUES
('+919520650672', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Riya Bhatt'), 'DC', 0, 'Normal'),
('+919258207428', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Devashish Basnet'), 'DTSS', 0, 'Normal'),
('+919258208660', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Neha Rana'), 'DTSS', 0, 'Normal'),
('+919258208048', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Muskan Tomar'), 'HungerBox', 0, 'Normal'),
('+919520650687', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Ankita Negi'), 'HR', 0, 'Normal'),
('+919258207385', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Shagun Negi'), 'HungerBox', 0, 'Normal'),
('+919520650679', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Sarika Negi'), 'HungerBox', 0, 'Normal'),
('+919258208663', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Shweta Gupta'), 'HungerBox', 0, 'Normal'),
('+919258208654', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Anjali Bisht'), 'HungerBox', 0, 'Normal'),
('+919258208655', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Pooja-HB'), 'HungerBox', 0, 'Normal'),
('+919258208652', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Arushi Negi'), 'HungerBox', 0, 'Normal'),
('+919258208651', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Shubhangi'), 'HungerBox', 0, 'Normal'),
('+919258208047', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Shristi Negi'), 'HungerBox', 0, 'Normal'),
('+919520650683', 'Jio', 'Active', NULL, 'HungerBox', 0, 'Normal'),
('+919258208045', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Unnati Thapliyal'), 'laiqa', 0, 'Normal'),
('+919258208646', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Kalpana Verma'), 'SIS NAG', 0, 'Normal'),
('+919258207387', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Adarsh Kukreti'), 'TL', 0, 'Normal'),
('+919258208096', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Jaskirat Kaur'), 'HungerBox', 0, 'Normal'),
('+919258208657', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Mahima Rawat'), 'UniQ', 0, 'Normal'),
('+919520650673', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Aditi Kodari'), 'UniQ', 0, 'Normal'),
('+919258208098', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Abhay Nagrath'), 'UniQ', 0, 'Normal'),
('+919258208648', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Archana'), 'HungerBox', 0, 'Normal'),
('+919520650678', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Monika'), 'AltLeads', 0, 'Normal'),
('+919258208662', 'Jio', 'Active', NULL, 'SISCo', 0, 'Normal'),
('+919258207419', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Aman Bhandari'), 'DTSS', 0, 'Normal'),
('+919520650681', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Mahak Kulhan'), 'APS', 0, 'Normal'),
('+919286405961', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Khushi Chauhan'), 'APS', 0, 'Normal'),
('+919520650684', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Kalpana Verma'), 'SISCo', 0, 'Normal'),
('+919520650680', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Arnima'), 'SISCo', 0, 'Normal'),
('+919520650689', 'Jio', 'Active', NULL, 'HB', 0, 'Normal'),
('+919520650674', 'Jio', 'Active', (SELECT id FROM agent_lookup WHERE name='Varnika'), 'HB', 0, 'Normal');
