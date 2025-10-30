-- Ensure users table has project_name column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Create index for faster project-based queries
CREATE INDEX IF NOT EXISTS idx_users_project_name ON users(project_name);

-- Update RLS policy to allow RTNP user to read all users' project info
CREATE POLICY IF NOT EXISTS "RTNP can view all users"
ON users
FOR SELECT
USING (
  auth.email() = 'realtimenumberprovider@amplior.com' OR
  get_current_user_role() = 'admin'
);

-- Add comment
COMMENT ON COLUMN users.project_name IS 'Project assignment for the user (e.g., Hungerbox, DTSS, DC)';
