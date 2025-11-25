-- Create lusha_api_keys table
CREATE TABLE IF NOT EXISTS public.lusha_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_value TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('PHONE_ONLY', 'EMAIL_ONLY')),
  credits_remaining INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXHAUSTED', 'INVALID', 'SUSPENDED')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_lusha_keys_category_status ON public.lusha_api_keys(category, status, is_active, last_used_at);

-- Enable RLS
ALTER TABLE public.lusha_api_keys ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage lusha keys"
  ON public.lusha_api_keys
  FOR ALL
  USING (get_current_user_role() = 'admin');

-- Service role can read and update (for the edge function)
CREATE POLICY "Service role can read and update lusha keys"
  ON public.lusha_api_keys
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can update lusha keys"
  ON public.lusha_api_keys
  FOR UPDATE
  USING (true);