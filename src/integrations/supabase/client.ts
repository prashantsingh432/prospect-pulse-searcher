
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ⚠️  Fill in your NEW Supabase project credentials in the .env file at the project root.
// VITE_SUPABASE_URL  → Project Settings → API → Project URL
// VITE_SUPABASE_ANON_KEY → Project Settings → API → anon / public key

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    '[Supabase] Missing credentials. Open .env in the project root and set ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.'
  );
}

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
