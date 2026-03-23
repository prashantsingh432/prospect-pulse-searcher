
-- Fix user_profiles FK to cascade on delete
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix rtne_requests FK columns to SET NULL on delete
ALTER TABLE public.rtne_requests DROP CONSTRAINT IF EXISTS rtne_requests_phone1_disposition_by_fkey;
ALTER TABLE public.rtne_requests ADD CONSTRAINT rtne_requests_phone1_disposition_by_fkey FOREIGN KEY (phone1_disposition_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.rtne_requests DROP CONSTRAINT IF EXISTS rtne_requests_phone2_disposition_by_fkey;
ALTER TABLE public.rtne_requests ADD CONSTRAINT rtne_requests_phone2_disposition_by_fkey FOREIGN KEY (phone2_disposition_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.rtne_requests DROP CONSTRAINT IF EXISTS rtne_requests_phone3_disposition_by_fkey;
ALTER TABLE public.rtne_requests ADD CONSTRAINT rtne_requests_phone3_disposition_by_fkey FOREIGN KEY (phone3_disposition_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.rtne_requests DROP CONSTRAINT IF EXISTS rtne_requests_phone4_disposition_by_fkey;
ALTER TABLE public.rtne_requests ADD CONSTRAINT rtne_requests_phone4_disposition_by_fkey FOREIGN KEY (phone4_disposition_by) REFERENCES auth.users(id) ON DELETE SET NULL;
