
-- Insert all agents
INSERT INTO sim_agents (name, project, status) VALUES
('Riya Bhatt', 'DC', 'Active'),
('Devashish Basnet', 'DTSS', 'Active'),
('Neha Rana', 'DTSS', 'Active'),
('Muskan Tomar', 'HungerBox', 'Active'),
('Ankita Negi', 'HR', 'Active'),
('Shagun Negi', 'HungerBox', 'Active'),
('Sarika Negi', 'HungerBox', 'Active'),
('Shweta Gupta', 'HungerBox', 'Active'),
('Anjali Bisht', 'HungerBox', 'Active'),
('Pooja-HB', 'HungerBox', 'Active'),
('Arushi Negi', 'HungerBox', 'Active'),
('Shubhangi', 'HungerBox', 'Active'),
('Shristi Negi', 'HungerBox', 'Active'),
('Unnati Thapliyal', 'laiqa', 'Active'),
('Kalpana Verma', 'SIS NAG', 'Active'),
('Adarsh Kukreti', 'TL', 'Active'),
('Jaskirat Kaur', 'HungerBox', 'Active'),
('Mahima Rawat', 'UniQ', 'Active'),
('Aditi Kodari', 'UniQ', 'Active'),
('Abhay Nagrath', 'UniQ', 'Active'),
('Archana', 'HungerBox', 'Active'),
('Monika', 'AltLeads', 'Active'),
('Aman Bhandari', 'DTSS', 'Active'),
('Mahak Kulhan', 'APS', 'Active'),
('Khushi Chauhan', 'APS', 'Active'),
('Arnima', 'SISCo', 'Active'),
('Apoorva Chauhan', 'KNL', 'Active'),
('Varnika', 'HB', 'Active');

-- Now update SIMs to link to their agents
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Riya Bhatt' LIMIT 1) WHERE sim_number = '+919520650672';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Devashish Basnet' LIMIT 1) WHERE sim_number = '+919258207428';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Neha Rana' LIMIT 1) WHERE sim_number = '+919258208660';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Muskan Tomar' LIMIT 1) WHERE sim_number = '+919258208048';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Ankita Negi' LIMIT 1) WHERE sim_number = '+919520650687';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Shagun Negi' LIMIT 1) WHERE sim_number = '+919258207385';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Sarika Negi' LIMIT 1) WHERE sim_number = '+919520650679';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Shweta Gupta' LIMIT 1) WHERE sim_number = '+919258208663';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Anjali Bisht' LIMIT 1) WHERE sim_number = '+919258208654';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Pooja-HB' LIMIT 1) WHERE sim_number = '+919258208655';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Arushi Negi' LIMIT 1) WHERE sim_number = '+919258208652';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Shubhangi' LIMIT 1) WHERE sim_number = '+919258208651';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Shristi Negi' LIMIT 1) WHERE sim_number = '+919258208047';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Unnati Thapliyal' LIMIT 1) WHERE sim_number = '+919258208045';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Kalpana Verma' LIMIT 1) WHERE sim_number = '+919258208646';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Adarsh Kukreti' LIMIT 1) WHERE sim_number = '+919258207387';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Jaskirat Kaur' LIMIT 1) WHERE sim_number = '+919258208096';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Mahima Rawat' LIMIT 1) WHERE sim_number = '+919258208657';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Aditi Kodari' LIMIT 1) WHERE sim_number = '+919520650673';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Abhay Nagrath' LIMIT 1) WHERE sim_number = '+919258208098';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Archana' LIMIT 1) WHERE sim_number = '+919258208648';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Monika' LIMIT 1) WHERE sim_number = '+919520650678';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Aman Bhandari' LIMIT 1) WHERE sim_number = '+919258207419';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Mahak Kulhan' LIMIT 1) WHERE sim_number = '+919520650681';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Khushi Chauhan' LIMIT 1) WHERE sim_number = '+919286405961';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Kalpana Verma' LIMIT 1) WHERE sim_number = '+919520650684';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Arnima' LIMIT 1) WHERE sim_number = '+919520650680';
UPDATE sim_master SET assigned_agent_id = (SELECT id FROM sim_agents WHERE name = 'Varnika' LIMIT 1) WHERE sim_number = '+919520650674';
