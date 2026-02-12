
-- Step 0: Create missing agent "Nisha Rawat"
INSERT INTO sim_agents (name, status) VALUES ('Nisha Rawat', 'Active')
ON CONFLICT DO NOTHING;

-- Step 1: Insert missing SIM +919520650682 (Nisha Rawat)
INSERT INTO sim_master (sim_number, operator, current_status)
VALUES ('+919520650682', 'Jio', 'Active')
ON CONFLICT (sim_number) DO UPDATE SET current_status = 'Active';

-- Step 2: Set the 27 currently-in-use SIMs to Active with agent assignments
-- First set all 27 to Active
UPDATE sim_master SET current_status = 'Active'
WHERE sim_number IN (
  '+919258207385','+919520650681','+919258208661','+919520650691',
  '+919258208646','+919520650690','+919258208045','+919258208648',
  '+919258208096','+919258208655','+919258208660','+919520650674',
  '+919258208652','+919520650679','+919520650688','+919520650687',
  '+919258208047','+919520650676','+919520650673','+919258208048',
  '+919520650678','+919258208098','+919520650680','+919258237050',
  '+919286405961','+919258207428','+919520650682'
);

-- Step 3: Update agent assignments for active SIMs
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Shagun Negi' LIMIT 1) WHERE sim_number = '+919258207385';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Mahak Kulhan' LIMIT 1) WHERE sim_number = '+919520650681';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Rishita' LIMIT 1) WHERE sim_number = '+919258208661';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Mahima Rawat' LIMIT 1) WHERE sim_number = '+919520650691';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Kalpana Verma' LIMIT 1) WHERE sim_number = '+919258208646';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Anjali Bisht' LIMIT 1) WHERE sim_number = '+919520650690';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Unnati Thapliyal' LIMIT 1) WHERE sim_number = '+919258208045';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Apoorva Chauhan' LIMIT 1) WHERE sim_number = '+919258208648';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Jaskirat Kaur' LIMIT 1) WHERE sim_number = '+919258208096';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Pooja-HB' LIMIT 1) WHERE sim_number = '+919258208655';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Neha Rana' LIMIT 1) WHERE sim_number = '+919258208660';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Varnika' LIMIT 1) WHERE sim_number = '+919520650674';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Arushi Negi' LIMIT 1) WHERE sim_number = '+919258208652';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Sarika Negi' LIMIT 1) WHERE sim_number = '+919520650679';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Shweta Gupta' LIMIT 1) WHERE sim_number = '+919520650688';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Shubhangi' LIMIT 1) WHERE sim_number = '+919520650687';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Shristi Negi' LIMIT 1) WHERE sim_number = '+919258208047';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Mangaal' LIMIT 1) WHERE sim_number = '+919520650676';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Aditi Kodari' LIMIT 1) WHERE sim_number = '+919520650673';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Muskan Tomar' LIMIT 1) WHERE sim_number = '+919258208048';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Monika' LIMIT 1) WHERE sim_number = '+919520650678';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Abhay Nagrath' LIMIT 1) WHERE sim_number = '+919258208098';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Arnima' LIMIT 1) WHERE sim_number = '+919520650680';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Aman Bhandari' LIMIT 1) WHERE sim_number = '+919258237050';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Khushi Chauhan' LIMIT 1) WHERE sim_number = '+919286405961';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Devashish Basnet' LIMIT 1) WHERE sim_number = '+919258207428';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Nisha Rawat' LIMIT 1) WHERE sim_number = '+919520650682';

-- Step 4: Set 23 Deactivated SIMs (clear agent assignments)
UPDATE sim_master 
SET current_status = 'Deactivated', assigned_agent_id = NULL, project_name = NULL
WHERE sim_number IN (
  '+919258208653','+919258207098','+919258257200','+919258208097',
  '+919258208665','+919258237049','+919528177492','+919258208046',
  '+919258207384','+919258208650','+919258207386','+919258207097',
  '+919258208658','+919258207099','+919259537568','+919258208659',
  '+919258208654','+919258208099','+919258257194','+919258208664',
  '+919258208663','+919258208656','+919258208647'
);

-- Step 5: Mark ALL remaining SIMs (not Active, not Deactivated) as Inactive (Not in Used)
UPDATE sim_master 
SET current_status = 'Inactive', assigned_agent_id = NULL, project_name = NULL
WHERE sim_number NOT IN (
  -- Active 27
  '+919258207385','+919520650681','+919258208661','+919520650691',
  '+919258208646','+919520650690','+919258208045','+919258208648',
  '+919258208096','+919258208655','+919258208660','+919520650674',
  '+919258208652','+919520650679','+919520650688','+919520650687',
  '+919258208047','+919520650676','+919520650673','+919258208048',
  '+919520650678','+919258208098','+919520650680','+919258237050',
  '+919286405961','+919258207428','+919520650682',
  -- Deactivated 23
  '+919258208653','+919258207098','+919258257200','+919258208097',
  '+919258208665','+919258237049','+919528177492','+919258208046',
  '+919258207384','+919258208650','+919258207386','+919258207097',
  '+919258208658','+919258207099','+919259537568','+919258208659',
  '+919258208654','+919258208099','+919258257194','+919258208664',
  '+919258208663','+919258208656','+919258208647'
);
