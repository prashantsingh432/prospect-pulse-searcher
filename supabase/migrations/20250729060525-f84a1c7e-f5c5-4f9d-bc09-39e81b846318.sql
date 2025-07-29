-- Update project names for all users using pattern-based approach

-- Update Hungerbox users
UPDATE public.users 
SET project_name = 'Hungerbox' 
WHERE email LIKE '%.hungerbox@amplior.com' AND project_name IS NULL;

-- Update Data Team users  
UPDATE public.users 
SET project_name = 'Data Team' 
WHERE email LIKE '%datateam@amplior.com' AND project_name IS NULL;

-- Update Data Collection users
UPDATE public.users 
SET project_name = 'Data Collection' 
WHERE email LIKE '%.dc@amplior.com' AND project_name IS NULL;

-- Update remaining users to DTSS (default project)
UPDATE public.users 
SET project_name = 'DTSS' 
WHERE project_name IS NULL;