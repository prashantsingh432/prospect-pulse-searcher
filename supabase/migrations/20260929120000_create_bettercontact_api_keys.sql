-- Create bettercontact_api_keys table
CREATE TABLE IF NOT EXISTS public.bettercontact_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_value TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXHAUSTED', 'INVALID', 'SUSPENDED')),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster querying and round-robin key rotation
CREATE INDEX IF NOT EXISTS idx_bettercontact_keys_status 
  ON public.bettercontact_api_keys(status, is_active, last_used_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bettercontact_api_keys ENABLE ROW LEVEL SECURITY;

-- Admins can view, insert, update, and delete BetterContact API keys
DROP POLICY IF EXISTS "Admins can manage bettercontact keys" ON public.bettercontact_api_keys;
CREATE POLICY "Admins can manage bettercontact keys"
  ON public.bettercontact_api_keys
  FOR ALL
  TO authenticated
  USING (
    get_current_user_role() = 'admin' 
    OR (auth.jwt() -> 'user_metadata' ->> 'project_name') = 'ADMIN'
    OR (auth.jwt() -> 'user_metadata' ->> 'admin_level') IN ('super', 'sub')
  )
  WITH CHECK (
    get_current_user_role() = 'admin' 
    OR (auth.jwt() -> 'user_metadata' ->> 'project_name') = 'ADMIN'
    OR (auth.jwt() -> 'user_metadata' ->> 'admin_level') IN ('super', 'sub')
  );

-- Service role full access (for Edge Functions using service_role key)
DROP POLICY IF EXISTS "Service role full access on bettercontact keys" ON public.bettercontact_api_keys;
CREATE POLICY "Service role full access on bettercontact keys"
  ON public.bettercontact_api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
