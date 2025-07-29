-- SQL Queries to Update Project Names for All Users
-- Run these in Supabase SQL Editor

-- 1. First, let's see current state
SELECT email, name, project_name FROM public.users WHERE project_name IS NULL ORDER BY email;

-- 2. Update users with specific project assignments based on email patterns
-- You'll need to modify these based on your actual project assignments

-- Update Hungerbox users
UPDATE public.users 
SET project_name = 'Hungerbox'
WHERE email LIKE '%.hungerbox@amplior.com' AND project_name IS NULL;

-- Update Data Team users
UPDATE public.users 
SET project_name = 'Data Team'
WHERE email LIKE '%datateam@amplior.com' AND project_name IS NULL;

-- Update DC (Data Collection) users
UPDATE public.users 
SET project_name = 'Data Collection'
WHERE email LIKE '%.dc@amplior.com' AND project_name IS NULL;

-- Update remaining users to DTSS (default project)
UPDATE public.users 
SET project_name = 'DTSS'
WHERE project_name IS NULL;

-- 3. Alternative: Update specific users individually (modify as needed)
-- Replace these with actual project assignments:

UPDATE public.users SET project_name = 'SIS 2.0' WHERE email = 'Aartir@amplior.com';
UPDATE public.users SET project_name = 'DTSS' WHERE email = 'Aasthab@amplior.com';
UPDATE public.users SET project_name = 'DTSS' WHERE email = 'Adarshk@amplior.com';
UPDATE public.users SET project_name = 'SIS 2.0' WHERE email = 'Aditit@amplior.com';
UPDATE public.users SET project_name = 'DTSS' WHERE email = 'Akanshas@amplior.com';
UPDATE public.users SET project_name = 'SIS 2.0' WHERE email = 'Akshitas@amplior.com';
UPDATE public.users SET project_name = 'Data Collection' WHERE email = 'Ankita.dc@amplior.com';
UPDATE public.users SET project_name = 'DTSS' WHERE email = 'Anshikab@amplior.com';
UPDATE public.users SET project_name = 'Hungerbox' WHERE email = 'Anushka.hungerbox@amplior.com';
UPDATE public.users SET project_name = 'SIS 2.0' WHERE email = 'Apoorvac@amplior.com';
-- Add more as needed...

-- 4. Verify the updates
SELECT email, name, project_name, role FROM public.users ORDER BY project_name, email;

-- 5. Count users per project
SELECT project_name, COUNT(*) as user_count 
FROM public.users 
GROUP BY project_name 
ORDER BY user_count DESC;