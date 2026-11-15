import { supabase } from './supabase';
import type { AppData, ChecklistItem, EventItem, Place } from './types';

const demo: AppData = {
  events: [
    { id: 'demo-1', title: 'Ngày mình gặp nhau ♡', starts_at: '2026-12-20T10:00:00+07:00', location: 'Đà Lạt', note: 'Một ngày thật chậm bên nhau', accent: 'pink' },
    { id: 'demo-2', title: 'Hẹn hò cuối tuần', starts_at: '2026-12-27T18:30:00+07:00', location: 'TP. Hồ Chí Minh', note: 'Ăn tối rồi đi dạo nhé', accent: 'lilac' },
  ],
  places: [
    { id: 'place-1', name: 'Tiệm cà phê Nhà Bên Suối', category: 'Cà phê', area: 'Đà Lạt', dish: 'Cacao nóng & bánh sừng bò', map_url: 'https://maps.google.com/?q=cafe+Da+Lat', event_id: 'demo-1', visited: false },
    { id: 'place-2', name: 'Một chiếc quán lẩu xinh', category: 'Ăn tối', area: 'TP. Hồ Chí Minh', dish: 'Lẩu nấm', map_url: '', event_id: null, visited: false },
  ],
  checklist: [
    { id: 'check-1', event_id: 'demo-1', title: 'Sạc dự phòng', done: true },
    { id: 'check-2', event_id: 'demo-1', title: 'Áo khoác ấm cho hai đứa', done: false },
    { id: 'check-3', event_id: 'demo-1', title: 'Máy ảnh và pin', done: false },
  ],
};
export const fallbackData = demo;

export async function loadData(): Promise<AppData> {
  if (!supabase) return demo;
  const [events, places, checklist] = await Promise.all([
    supabase.from('events').select('*').order('starts_at'),
    supabase.from('places').select('*').order('created_at', { ascending: false }),
    supabase.from('checklist_items').select('*').order('created_at'),
  ]);
  if (events.error || places.error || checklist.error) throw new Error(events.error?.message ?? places.error?.message ?? checklist.error?.message);
  return { events: (events.data ?? []) as EventItem[], places: (places.data ?? []) as Place[], checklist: (checklist.data ?? []) as ChecklistItem[] };
}
