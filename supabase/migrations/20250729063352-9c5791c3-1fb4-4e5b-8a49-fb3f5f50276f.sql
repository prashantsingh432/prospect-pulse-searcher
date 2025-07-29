-- Update users with the provided names and project assignments
UPDATE public.users SET name = 'Rishita Sharma', project_name = 'Dale Carnegie' WHERE email = 'Rishitas@amplior.com';
UPDATE public.users SET name = 'Vandita Tiwari', project_name = 'Dale Carnegie' WHERE email = 'Vanditat@amplior.com';
UPDATE public.users SET name = 'Sanjeevani Singhal', project_name = 'Dale Carnegie' WHERE email = 'Sanjeevanis@amplior.com';
UPDATE public.users SET name = 'Apoorva Chauhan', project_name = 'Dale Carnegie' WHERE email = 'Apoorvac@amplior.com';
UPDATE public.users SET name = 'Pooja Rautela', project_name = 'DTSS' WHERE email = 'Poojar@amplior.com';
UPDATE public.users SET name = 'Nandini Dabral', project_name = 'DTSS' WHERE email = 'Nandinid@amplior.com';
UPDATE public.users SET name = 'Vanshika Thapa', project_name = 'DTSS' WHERE email LIKE '%vanshika%';
UPDATE public.users SET name = 'Shrishti Negi', project_name = 'DTSS' WHERE email LIKE '%shrishti%';
UPDATE public.users SET name = 'Jaskirat Kaur', project_name = 'DTSS' WHERE email LIKE '%jaskirat%';
UPDATE public.users SET name = 'Sanskriti Gurung', project_name = 'DTSS' WHERE email LIKE '%sanskriti%';
UPDATE public.users SET name = 'Avani Rai', project_name = 'DTSS' WHERE email LIKE '%avani%';
UPDATE public.users SET name = 'Akshita Sati', project_name = 'DTSS' WHERE email LIKE '%akshita%';
UPDATE public.users SET name = 'Arjoo Rawat', project_name = 'DTSS' WHERE email LIKE '%arjoo%';
UPDATE public.users SET name = 'Subhiksha Rawat', project_name = 'DTSS' WHERE email LIKE '%subhiksha%';
UPDATE public.users SET name = 'Adarsh Kumar', project_name = 'Hungerbox' WHERE email LIKE '%adarsh%';
UPDATE public.users SET name = 'Anshika Bhandari', project_name = 'Hungerbox' WHERE email LIKE '%anshika%';
UPDATE public.users SET name = 'Khushi Chauhan', project_name = 'Hungerbox' WHERE email LIKE '%khushi%';
UPDATE public.users SET name = 'Sonali Prasad', project_name = 'Hungerbox' WHERE email LIKE '%sonali%';
UPDATE public.users SET name = 'Khushi Kuthal', project_name = 'Hungerbox' WHERE email LIKE '%khushi%';
UPDATE public.users SET name = 'Priyanshi Bhatt', project_name = 'Hungerbox' WHERE email LIKE '%priyanshi%';
UPDATE public.users SET name = 'Nikita Kohli', project_name = 'Hungerbox' WHERE email LIKE '%nikita%';
UPDATE public.users SET name = 'Kiren Topwal', project_name = 'Hungerbox' WHERE email LIKE '%kiren%';
UPDATE public.users SET name = 'Muskan Arora', project_name = 'Hungerbox' WHERE email LIKE '%muskan%';
UPDATE public.users SET name = 'Arushi Negi', project_name = 'Hungerbox' WHERE email LIKE '%arushi%';
UPDATE public.users SET name = 'Muskan Singh', project_name = 'Hungerbox' WHERE email LIKE '%muskan%';
UPDATE public.users SET name = 'Divyanshi Gurung', project_name = 'Hungerbox' WHERE email LIKE '%divyanshi%';
UPDATE public.users SET name = 'Shivani Panwar', project_name = 'Hungerbox' WHERE email LIKE '%shivani%';
UPDATE public.users SET name = 'Aarti Raunchhela', project_name = 'Hungerbox' WHERE email LIKE '%aarti%';
UPDATE public.users SET name = 'Prakriti Mondaiyka', project_name = 'DTSS' WHERE email LIKE '%prakriti%';
UPDATE public.users SET name = 'Prachi Singh', project_name = 'DTSS' WHERE email LIKE '%prachi%';
UPDATE public.users SET name = 'Aastha Bhandari', project_name = 'DTSS' WHERE email LIKE '%aastha%';
UPDATE public.users SET name = 'Simran Thapa', project_name = 'DTSS' WHERE email LIKE '%simran%';
UPDATE public.users SET name = 'Ayushi Mahara', project_name = 'DTSS' WHERE email LIKE '%ayushi%';
UPDATE public.users SET name = 'Manoj Singh Bisht', project_name = 'DTSS' WHERE email LIKE '%manoj%';
UPDATE public.users SET name = 'Ayush Bisht', project_name = 'DTSS' WHERE email LIKE '%ayush%';
UPDATE public.users SET name = 'Vikas Thapa', project_name = 'DTSS' WHERE email LIKE '%vikas%';
UPDATE public.users SET name = 'Harshika Kunwar', project_name = 'DTSS' WHERE email LIKE '%harshika%';
UPDATE public.users SET name = 'Kalpana Verma', project_name = 'DTSS' WHERE email LIKE '%kalpana%';
UPDATE public.users SET name = 'Neha Rana', project_name = 'DTSS' WHERE email LIKE '%neha%';
UPDATE public.users SET name = 'Aditi Tiwari', project_name = 'Terrior' WHERE email LIKE '%aditi%';
UPDATE public.users SET name = 'Akansha Sharma', project_name = 'UniQ' WHERE email LIKE '%akansha%';
UPDATE public.users SET name = 'Prashant Kanyal', project_name = 'ADMIN' WHERE email LIKE '%prashant%';

-- Set default project name for any remaining null values
UPDATE public.users SET project_name = 'DTSS' WHERE project_name IS NULL;

-- Enable realtime for dispositions table
ALTER TABLE dispositions REPLICA IDENTITY FULL;
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE dispositions;