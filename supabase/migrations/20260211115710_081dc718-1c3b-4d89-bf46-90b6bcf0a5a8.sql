
-- Create enums
CREATE TYPE public.sim_operator AS ENUM ('Airtel', 'Jio');
CREATE TYPE public.sim_status AS ENUM ('Active', 'Spam', 'Deactivated', 'Inactive');
CREATE TYPE public.sim_risk_level AS ENUM ('Normal', 'Warning', 'High Risk');

-- Entity 1: SIM_MASTER
CREATE TABLE public.sim_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sim_number TEXT NOT NULL UNIQUE,
  operator public.sim_operator NOT NULL,
  current_status public.sim_status NOT NULL DEFAULT 'Active',
  assigned_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  project_name TEXT,
  spam_count INTEGER NOT NULL DEFAULT 0,
  last_spam_date TIMESTAMPTZ,
  risk_level public.sim_risk_level NOT NULL DEFAULT 'Normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Entity 2: AGENT (we'll use the existing users table, but create a sim_agents table for SIM-specific agent data)
CREATE TABLE public.sim_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Entity 3: SPAM_HISTORY
CREATE TABLE public.sim_spam_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sim_id UUID NOT NULL REFERENCES public.sim_master(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.sim_agents(id) ON DELETE SET NULL,
  spam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT,
  marked_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Entity 4: DEACTIVATION_HISTORY
CREATE TABLE public.sim_deactivation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sim_id UUID NOT NULL REFERENCES public.sim_master(id) ON DELETE CASCADE,
  deactivated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  reactivated_date DATE,
  deactivated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Entity 5: SIM_AUDIT_LOG
CREATE TABLE public.sim_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sim_id UUID REFERENCES public.sim_master(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  performed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update trigger for sim_master
CREATE TRIGGER update_sim_master_updated_at
  BEFORE UPDATE ON public.sim_master
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sim_agents_updated_at
  BEFORE UPDATE ON public.sim_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.sim_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_spam_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_deactivation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin full access
CREATE POLICY "Admins full access sim_master" ON public.sim_master FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated read sim_master" ON public.sim_master FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins full access sim_agents" ON public.sim_agents FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated read sim_agents" ON public.sim_agents FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins full access sim_spam_history" ON public.sim_spam_history FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated read sim_spam_history" ON public.sim_spam_history FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins full access sim_deactivation_history" ON public.sim_deactivation_history FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated read sim_deactivation_history" ON public.sim_deactivation_history FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins full access sim_audit_log" ON public.sim_audit_log FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated read sim_audit_log" ON public.sim_audit_log FOR SELECT USING (auth.uid() IS NOT NULL);
