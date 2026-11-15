import { createClient } from './supabase/server';

export async function requirePlannerMember() {
  const client = await createClient();
  if (!client) return { client: null, userId: null, status: 503 as const };
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims?.sub) return { client: null, userId: null, status: 401 as const };
  const userId = data.claims.sub;
  const { data: member, error: memberError } = await client.from('planner_members').select('user_id').eq('user_id', userId).maybeSingle();
  if (memberError) return { client: null, userId: null, status: 503 as const };
  if (!member) return { client: null, userId: null, status: 403 as const };
  return { client, userId, status: 200 as const };
}
