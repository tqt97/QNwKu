import type { AppData, ChecklistItem, EventItem, Place } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function loadData(supabase: SupabaseClient): Promise<AppData> {
  const [events, places, checklist] = await Promise.all([
    supabase.from('events').select('*').order('starts_at'),
    supabase.from('places').select('*').order('created_at', { ascending: false }),
    supabase.from('checklist_items').select('*').order('created_at'),
  ]);
  if (events.error || places.error || checklist.error) throw new Error(events.error?.message ?? places.error?.message ?? checklist.error?.message);
  return { events: (events.data ?? []) as EventItem[], places: (places.data ?? []) as Place[], checklist: (checklist.data ?? []) as ChecklistItem[] };
}
