-- Fix the security linter warnings by setting proper search_path

-- Fix the get_user_role_safe function
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the role from user_metadata in auth.users
    SELECT COALESCE(
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'project_name',
        'caller'
    ) INTO user_role;
    
    -- Return 'admin' if project_name is 'ADMIN', otherwise 'caller'
    IF user_role = 'ADMIN' THEN
        RETURN 'admin';
    ELSE
        RETURN 'caller';
    END IF;
END;
$$;

-- Fix the update_users_updated_at function
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;