-- Add phone disposition columns to rtne_requests table
-- Each phone can be marked as 'correct', 'wrong', or null (not yet dispositioned)

ALTER TABLE public.rtne_requests
ADD COLUMN IF NOT EXISTS phone1_disposition TEXT CHECK (phone1_disposition IN ('correct', 'wrong')),
ADD COLUMN IF NOT EXISTS phone1_disposition_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone1_disposition_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS phone2_disposition TEXT CHECK (phone2_disposition IN ('correct', 'wrong')),
ADD COLUMN IF NOT EXISTS phone2_disposition_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone2_disposition_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS phone3_disposition TEXT CHECK (phone3_disposition IN ('correct', 'wrong')),
ADD COLUMN IF NOT EXISTS phone3_disposition_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone3_disposition_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS phone4_disposition TEXT CHECK (phone4_disposition IN ('correct', 'wrong')),
ADD COLUMN IF NOT EXISTS phone4_disposition_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone4_disposition_by UUID REFERENCES auth.users(id);

-- Add comment explaining the columns
COMMENT ON COLUMN public.rtne_requests.phone1_disposition IS 'Disposition status for primary phone: correct or wrong';
COMMENT ON COLUMN public.rtne_requests.phone2_disposition IS 'Disposition status for phone 2: correct or wrong';
COMMENT ON COLUMN public.rtne_requests.phone3_disposition IS 'Disposition status for phone 3: correct or wrong';
COMMENT ON COLUMN public.rtne_requests.phone4_disposition IS 'Disposition status for phone 4: correct or wrong';