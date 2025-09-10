-- Fix the search_path issue for the admin_delete_user_cascade function
CREATE OR REPLACE FUNCTION public.admin_delete_user_cascade(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result BOOLEAN := FALSE;
BEGIN
    -- Delete from all tables that reference the user
    
    -- Delete dispositions
    DELETE FROM dispositions WHERE user_id = user_id_param;
    
    -- Delete activity logs
    DELETE FROM activity_logs WHERE user_id = user_id_param;
    
    -- Delete exports
    DELETE FROM exports WHERE user_id = user_id_param;
    
    -- Delete audit logs
    DELETE FROM audit_logs WHERE user_id = user_id_param OR target_id = user_id_param;
    
    -- Delete credits log
    DELETE FROM credits_log WHERE user_id = user_id_param;
    
    -- Delete notifications
    DELETE FROM notifications WHERE user_id = user_id_param;
    
    -- Delete project users
    DELETE FROM project_users WHERE user_id = user_id_param;
    
    -- Delete from users table
    DELETE FROM users WHERE id = user_id_param;
    
    -- Delete user profiles
    DELETE FROM user_profiles WHERE id = user_id_param;
    
    result := TRUE;
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail
    RAISE WARNING 'Error in admin_delete_user_cascade: %', SQLERRM;
    RETURN FALSE;
END;
$$;