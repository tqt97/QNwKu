import { loadData } from '@/lib/data';
import Planner from './planner';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let data;
  let connectionError = '';
  try { data = await loadData(); }
  catch (error) { data = { events: [], places: [], checklist: [] }; connectionError = error instanceof Error ? error.message : 'Không thể kết nối Supabase.'; }
  return <Planner initialData={data} connectionError={connectionError} />;
}
