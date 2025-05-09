
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lodpoepylygsryjdkqjg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZHBvZXB5bHlnc3J5amRrcWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDM3NzIsImV4cCI6MjA2MTc3OTc3Mn0.RUoYlrKR4D2wwzDSTU7rGp9Xg1wvG-Mz2i9wk94DHlw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    global: {
      headers: {
        'x-application-name': 'prospect-pulse',
      },
    }
  }
);
