import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pciupzqugjejjvxesmqd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaXVwenF1Z2plamp2eGVzbXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODcyMDcsImV4cCI6MjA3MjQ2MzIwN30.VwdY-MVWXtFKr8Djcs6nX3Q33qvhdHjrM-dpffTxBwk';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

