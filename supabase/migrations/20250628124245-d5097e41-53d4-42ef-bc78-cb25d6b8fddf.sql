
-- First, let's create a function to seed users in Supabase Auth with metadata
-- This will be used to create all the users with their project names and full names

-- Create or replace the function to create users with metadata
CREATE OR REPLACE FUNCTION create_auth_user_with_metadata(
  user_email TEXT,
  user_password TEXT,
  project_name TEXT,
  full_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create user in auth.users with metadata
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    raw_app_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    json_build_object('project_name', project_name, 'full_name', full_name)::jsonb,
    '{}'::jsonb,
    FALSE,
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;
  
  -- Also update the users table with the same information
  INSERT INTO public.users (id, email, name, role)
  VALUES (new_user_id, user_email, full_name, 'caller')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;
    
  RETURN new_user_id;
END;
$$;

-- Now let's seed all the users from your list
SELECT create_auth_user_with_metadata('Rishitas@amplior.com', 'Rishitaamp@234', 'Dale Carnegie', 'Rishita Sharma');
SELECT create_auth_user_with_metadata('Vanditat@amplior.com', 'Vanditaamp@567', 'Dale Carnegie', 'Vandita Tiwari');
SELECT create_auth_user_with_metadata('Sanjeevanis@amplior.com', 'Sanjeevaniamp@789', 'Dale Carnegie', 'Sanjeevani Singhal');
SELECT create_auth_user_with_metadata('Apoorvac@amplior.com', 'Apoorvaamp@456', 'Dale Carnegie', 'Apoorva Chauhan');
SELECT create_auth_user_with_metadata('Poojar@amplior.com', 'Poojaamp@321', 'DTSS', 'Pooja Rautela');
SELECT create_auth_user_with_metadata('Nandinid@amplior.com', 'Nandiniamp@654', 'DTSS', 'Nandini Dabral');
SELECT create_auth_user_with_metadata('Vanshikat@amplior.com', 'Vanshikaamp@987', 'DTSS', 'Vanshika Thapa');
SELECT create_auth_user_with_metadata('Shrishtin@amplior.com', 'Shrishtiamp@432', 'DTSS', 'Shrishti Negi');
SELECT create_auth_user_with_metadata('Jaskiratk@amplior.com', 'Jaskiratamp@765', 'DTSS', 'Jaskirat Kaur');
SELECT create_auth_user_with_metadata('Sanskritig@amplior.com', 'Sanskritiamp@123', 'DTSS', 'Sanskriti Gurung');
SELECT create_auth_user_with_metadata('Avanir@amplior.com', 'Avaniamp@543', 'DTSS', 'Avani Rai');
SELECT create_auth_user_with_metadata('Akshitas@amplior.com', 'Akshitaamp@876', 'DTSS', 'Akshita Sati');
SELECT create_auth_user_with_metadata('Arjoor@amplior.com', 'Arjooamp@345', 'DTSS', 'Arjoo Rawat');
SELECT create_auth_user_with_metadata('Subhikshar@amplior.com', 'Subhikshaamp@678', 'DTSS', 'Subhiksha Rawat');
SELECT create_auth_user_with_metadata('Adarshk@amplior.com', 'Adarshamp@912', 'Hungerbox', 'Adarsh Kumar');
SELECT create_auth_user_with_metadata('Anshikab@amplior.com', 'Anshikaamp@234', 'Hungerbox', 'Anshika Bhandari');
SELECT create_auth_user_with_metadata('Khushic@amplior.com', 'Khushiamp@567', 'Hungerbox', 'Khushi Chauhan');
SELECT create_auth_user_with_metadata('Sonalip@amplior.com', 'Sonaliamp@890', 'Hungerbox', 'Sonali Prasad');
SELECT create_auth_user_with_metadata('Khushik@amplior.com', 'Khushiamp@432', 'Hungerbox', 'Khushi Kuthal');
SELECT create_auth_user_with_metadata('Priyanshib@amplior.com', 'Priyanshiamp@765', 'Hungerbox', 'Priyanshi Bhatt');
SELECT create_auth_user_with_metadata('Nikitak@amplior.com', 'Nikitaamp@198', 'Hungerbox', 'Nikita Kohli');
SELECT create_auth_user_with_metadata('Kirent@amplior.com', 'Kirenamp@543', 'Hungerbox', 'Kiren Topwal');
SELECT create_auth_user_with_metadata('Muskana@amplior.com', 'Muskanamp@876', 'Hungerbox', 'Muskan Arora');
SELECT create_auth_user_with_metadata('Arushin@amplior.com', 'Arushiamp@321', 'Hungerbox', 'Arushi Negi');
SELECT create_auth_user_with_metadata('Muskans@amplior.com', 'Muskanamp@654', 'Hungerbox', 'Muskan Singh');
SELECT create_auth_user_with_metadata('Divyanshig@amplior.com', 'Divyanshiamp@234', 'Hungerbox', 'Divyanshi Gurung');
SELECT create_auth_user_with_metadata('Shivanip@amplior.com', 'Shivaniamp@567', 'laiqa/perfect corp', 'Shivani Panwar');
SELECT create_auth_user_with_metadata('Aartir@amplior.com', 'Aartiamp@890', 'Priya Living', 'Aarti Raunchhela');
SELECT create_auth_user_with_metadata('Prakritim@amplior.com', 'Prakritiamp@432', 'SIS', 'Prakriti Mondaiyka');
SELECT create_auth_user_with_metadata('Prachis@amplior.com', 'Prachiamp@765', 'SIS', 'Prachi Singh');
SELECT create_auth_user_with_metadata('Aasthab@amplior.com', 'Aasthaamp@198', 'SIS', 'Aastha Bhandari');
SELECT create_auth_user_with_metadata('Simrant@amplior.com', 'Simranamp@543', 'SIS 2.0', 'Simran Thapa');
SELECT create_auth_user_with_metadata('Ayushim@amplior.com', 'Ayushiamp@876', 'SIS 2.0', 'Ayushi Mahara');
SELECT create_auth_user_with_metadata('Manojb@amplior.com', 'Manojamp@321', 'SIS NAG', 'Manoj Singh Bisht');
SELECT create_auth_user_with_metadata('Ayushb@amplior.com', 'Ayushamp@654', 'SIS NAG', 'Ayush Bisht');
SELECT create_auth_user_with_metadata('Vikast@amplior.com', 'Vikasamp@987', 'SIS NAG', 'Vikas Thapa');
SELECT create_auth_user_with_metadata('Harshikak@amplior.com', 'Harshikaamp@234', 'SIS NAG', 'Harshika Kunwar');
SELECT create_auth_user_with_metadata('Kalpanav@amplior.com', 'Kalpanaamp@567', 'SIS NAG', 'Kalpana Verma');
SELECT create_auth_user_with_metadata('Nehar@amplior.com', 'Nehaamp@890', 'SIS NAG', 'Neha Rana');
SELECT create_auth_user_with_metadata('Aditit@amplior.com', 'Aditiamp@432', 'SIS NAG', 'Aditi Tiwari');
SELECT create_auth_user_with_metadata('Akanshas@amplior.com', 'Akanshaamp@765', 'UniQ', 'Akansha Sharma');
SELECT create_auth_user_with_metadata('Prashantk@amplior.com', 'PrashantADMIN@123', 'ADMIN', 'Prashant Kanyal');

-- Drop the function after seeding (cleanup)
DROP FUNCTION IF EXISTS create_auth_user_with_metadata(TEXT, TEXT, TEXT, TEXT);
