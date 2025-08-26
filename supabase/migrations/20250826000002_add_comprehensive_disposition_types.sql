-- Add comprehensive disposition types for better prospect tracking
-- Date: 2025-08-26
-- Purpose: Expand disposition options to cover all business scenarios

-- First, add all the new disposition types to the enum
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'not_connected';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'duplicate_prospect';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'irrelevant_company';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'contact_details_irrelevant';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'not_interested_in_company';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'reception_call_with_receptionist';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'hold_for_now';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'irrelevant_designation';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'irrelevant_location';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'do_not_call';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'contract_renewal_year';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'long_term_contract';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'no_requirements';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'call_back';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'follow_up';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'mail_sent';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'meeting_scheduled';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'meeting_successful';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'meeting_cancel';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'using_dtss_services';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'already_in_touch_with_project';
ALTER TYPE public.disposition_type ADD VALUE IF NOT EXISTS 'person_irrelevant';

-- Note: PostgreSQL doesn't allow removing enum values easily, so we keep the old ones
-- The old values (not_interested, wrong_number, dnc, call_back_later, not_relevant, others) remain available

-- Add a comment to document the comprehensive disposition types
COMMENT ON TYPE public.disposition_type IS 'Comprehensive disposition types covering all business scenarios - updated 2025-08-26';

-- Create an index on disposition_type for better query performance
CREATE INDEX IF NOT EXISTS idx_dispositions_disposition_type ON public.dispositions(disposition_type);

-- Add a comment to track this migration
COMMENT ON TABLE public.dispositions IS 'Dispositions table with comprehensive disposition types - updated 2025-08-26';
