import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dcdvbqlobtmeppfceapj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_mzHTU0PoV5vmNeVUFG2eqw_-OWu0a0-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
