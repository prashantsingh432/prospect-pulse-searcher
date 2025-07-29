-- Add project_name column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Update the sync_user_profile function to properly handle project_name
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
    INSERT INTO public.users (id, email, name, role, project_name, last_active)
    VALUES (
      user_rec.id,
      user_rec.email,
      COALESCE(user_rec.full_name, split_part(user_rec.email, '@', 1)),
      CASE 
        WHEN user_rec.project_name = 'ADMIN' THEN 'admin'
        ELSE 'caller'
      END,
      COALESCE(user_rec.project_name, 'Unknown Project'),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.users.name),
      role = EXCLUDED.role,
      project_name = COALESCE(EXCLUDED.project_name, public.users.project_name, 'Unknown Project'),
      last_active = now();
  END IF;
END;
$function$;