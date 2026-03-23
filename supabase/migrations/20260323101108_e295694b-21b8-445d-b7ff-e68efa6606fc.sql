
CREATE OR REPLACE FUNCTION public.admin_delete_user_cascade(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    -- Nullify sim references (don't delete sim data, just remove user reference)
    UPDATE sim_spam_history SET marked_by = NULL WHERE marked_by = user_id_param;
    UPDATE sim_deactivation_history SET deactivated_by = NULL WHERE deactivated_by = user_id_param;
    UPDATE sim_audit_log SET performed_by = NULL WHERE performed_by = user_id_param;
    
    -- Nullify master_prospects created_by
    UPDATE master_prospects SET created_by = NULL WHERE created_by = user_id_param;
    
    -- Delete from users table
    DELETE FROM users WHERE id = user_id_param;
    
    -- Delete user profiles
    DELETE FROM user_profiles WHERE id = user_id_param;
    
    result := TRUE;
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in admin_delete_user_cascade: %', SQLERRM;
    RETURN FALSE;
END;
$function$;
