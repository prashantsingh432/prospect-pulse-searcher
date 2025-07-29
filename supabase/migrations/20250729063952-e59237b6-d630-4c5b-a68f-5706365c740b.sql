-- Add foreign key constraint between dispositions and users tables
ALTER TABLE public.dispositions 
ADD CONSTRAINT dispositions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update the current user's profile to ensure they exist in users table  
INSERT INTO public.users (id, email, name, role, project_name, last_active)
SELECT 
  '2b6764b4-2569-45c2-aa90-d2dc291be90b'::uuid,
  'Simrant@amplior.com',
  'Simran Thapa',
  'caller',
  'SIS 2.0',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE id = '2b6764b4-2569-45c2-aa90-d2dc291be90b'::uuid
);

-- Update the user's name and project correctly
UPDATE public.users 
SET name = 'Simran Thapa', project_name = 'SIS 2.0' 
WHERE id = '2b6764b4-2569-45c2-aa90-d2dc291be90b'::uuid;