-- Create disposition types enum
CREATE TYPE public.disposition_type AS ENUM (
  'not_interested',
  'wrong_number', 
  'dnc',
  'call_back_later',
  'not_relevant',
  'others'
);

-- Create dispositions table
CREATE TABLE public.dispositions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id INTEGER NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  disposition_type disposition_type NOT NULL,
  custom_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dispositions ENABLE ROW LEVEL SECURITY;

-- Create policies for dispositions
CREATE POLICY "Authenticated users can view all dispositions" 
ON public.dispositions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create dispositions" 
ON public.dispositions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dispositions_updated_at
BEFORE UPDATE ON public.dispositions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_dispositions_prospect_id ON public.dispositions(prospect_id);
CREATE INDEX idx_dispositions_created_at ON public.dispositions(created_at DESC);