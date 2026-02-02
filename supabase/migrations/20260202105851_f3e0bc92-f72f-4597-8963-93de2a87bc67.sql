-- Add MRE (Mystery Request) tracking to rtne_requests
-- This allows agents to explicitly request numbers from RTNP
-- Only MRE-requested items will be visible on RTNP dashboard

ALTER TABLE public.rtne_requests
ADD COLUMN IF NOT EXISTS mre_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mre_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mre_requested_by UUID;

-- Add index for efficient RTNP dashboard queries
CREATE INDEX IF NOT EXISTS idx_rtne_mre_requested ON public.rtne_requests(mre_requested, project_name) WHERE mre_requested = true;