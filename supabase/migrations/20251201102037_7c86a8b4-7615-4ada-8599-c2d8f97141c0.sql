-- Create project_names table for managing available projects
CREATE TABLE IF NOT EXISTS public.project_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.project_names ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage projects
CREATE POLICY "Admins can manage projects"
ON public.project_names
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Allow authenticated users to read active projects
CREATE POLICY "Users can view active projects"
ON public.project_names
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create index for faster lookups
CREATE INDEX idx_project_names_active ON public.project_names(is_active);
CREATE INDEX idx_project_names_name ON public.project_names(name);