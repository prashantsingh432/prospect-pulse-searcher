-- Add row_number column to master_prospects for persistent row positioning
ALTER TABLE master_prospects
ADD COLUMN row_number INTEGER;

-- Create rtne_requests table for tracking real-time number requests
CREATE TABLE rtne_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  full_name TEXT,
  city TEXT,
  job_title TEXT,
  company_name TEXT,
  email_address TEXT,
  primary_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  row_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID
);

-- Enable RLS on rtne_requests
ALTER TABLE rtne_requests ENABLE ROW LEVEL SECURITY;

-- RTNP and admins can view all requests
CREATE POLICY "RTNP and admins can view all requests"
ON rtne_requests
FOR SELECT
USING (
  auth.email() = 'realtimenumberprovider@amplior.com' OR
  get_current_user_role() = 'admin'
);

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON rtne_requests
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own requests
CREATE POLICY "Users can insert their own requests"
ON rtne_requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RTNP and admins can update all requests
CREATE POLICY "RTNP and admins can update requests"
ON rtne_requests
FOR UPDATE
USING (
  auth.email() = 'realtimenumberprovider@amplior.com' OR
  get_current_user_role() = 'admin'
);

-- Users can delete their own pending requests
CREATE POLICY "Users can delete their own pending requests"
ON rtne_requests
FOR DELETE
USING (user_id = auth.uid() AND status = 'pending');

-- Create trigger to update updated_at
CREATE TRIGGER update_rtne_requests_updated_at
BEFORE UPDATE ON rtne_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster project-based queries
CREATE INDEX idx_rtne_requests_project_status ON rtne_requests(project_name, status);
CREATE INDEX idx_rtne_requests_user ON rtne_requests(user_id, status);