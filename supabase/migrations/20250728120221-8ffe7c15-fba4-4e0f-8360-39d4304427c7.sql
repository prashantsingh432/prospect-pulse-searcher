-- Ensure the current authenticated user exists in the users table
-- This function will be called to sync user data
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_rec record;
BEGIN
  -- Get current user info from auth
  SELECT 
    auth.uid() as id,
    auth.email() as email,
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'full_name' as full_name,
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'project_name' as project_name
  INTO user_rec
  WHERE auth.uid() IS NOT NULL;
  
  -- Only proceed if user is authenticated
  IF user_rec.id IS NOT NULL THEN
    -- Insert or update user in users table
    INSERT INTO public.users (id, email, name, role, last_active)
    VALUES (
      user_rec.id,
      user_rec.email,
      COALESCE(user_rec.full_name, split_part(user_rec.email, '@', 1)),
      CASE 
        WHEN user_rec.project_name = 'ADMIN' THEN 'admin'
        ELSE 'caller'
      END,
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name),
      role = EXCLUDED.role,
      last_active = now();
  END IF;
END;
$$;