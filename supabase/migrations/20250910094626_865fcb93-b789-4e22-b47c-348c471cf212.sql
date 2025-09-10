-- Fix all functions to have proper search_path settings

-- Update all existing functions to have proper search_path
ALTER FUNCTION public.update_users_updated_at() SET search_path = 'public';
ALTER FUNCTION public.set_updated_at() SET search_path = 'public';
ALTER FUNCTION public.get_user_role_safe() SET search_path = 'public';
ALTER FUNCTION public.sync_user_profile() SET search_path = 'public';
ALTER FUNCTION public.get_current_user_role() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.is_admin_user() SET search_path = 'public';