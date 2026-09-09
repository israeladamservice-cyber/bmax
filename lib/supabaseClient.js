import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmqkqdzzmyzkoltxnnqt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tHE9rIwNAsYile9BPJwCBA_pMGRyI5S';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
