import { loadData } from '@/lib/data';
import { hasSupabaseConfig } from '@/lib/supabase';
import { requirePlannerMember } from '@/lib/planner-auth';
import Planner from './planner';
import AccessGate from './components/AccessGate';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!hasSupabaseConfig()) return <AccessGate setupRequired />;
  const access = await requirePlannerMember();
  if (access.status !== 200) return <AccessGate setupRequired={access.status === 503} />;
  let data;
  let connectionError = '';
  try { data = await loadData(access.client!); }
  catch (error) { data = { events: [], places: [], checklist: [] }; connectionError = error instanceof Error ? error.message : 'Không thể kết nối Supabase.'; }
  return <Planner initialData={data} initialNow={Date.now()} connectionError={connectionError} />;
}
