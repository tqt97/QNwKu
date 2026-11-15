export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const plannerEmail = process.env.NEXT_PUBLIC_PLANNER_EMAIL;
export const hasSupabaseConfig = () => Boolean(supabaseUrl && supabaseAnonKey && plannerEmail);
