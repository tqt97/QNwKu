'use client';

import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppData, ChecklistItem, EventItem, Place } from '@/lib/types';

export type RealtimeStatus = 'connecting' | 'connected' | 'offline' | 'sync-error' | 'demo';

function upsert<T extends { id: string }>(rows: T[], row: T) {
  const index = rows.findIndex(current => current.id === row.id);
  if (index < 0) return [row, ...rows];
  return rows.map(current => current.id === row.id ? row : current);
}

function sortEvents(events: EventItem[]) {
  return [...events].sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
}

export function usePlannerRealtime(setData: Dispatch<SetStateAction<AppData>>, setStatus: (status: RealtimeStatus) => void) {
  useEffect(() => {
    const client = supabase;
    if (!client) { setStatus('demo'); return; }

    let syncGeneration = 0;
    let changedDuringSnapshot = { events: false, places: false, checklist: false };
    const channel = client
      .channel('planner-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, payload => {
        changedDuringSnapshot.events = true;
        if (payload.eventType === 'DELETE') {
          const id = String(payload.old.id ?? '');
          setData(current => ({ ...current, events: current.events.filter(row => row.id !== id), checklist: current.checklist.filter(row => row.event_id !== id) }));
          return;
        }
        const event = payload.new as EventItem;
        setData(current => ({ ...current, events: sortEvents(upsert(current.events, event)) }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'places' }, payload => {
        changedDuringSnapshot.places = true;
        if (payload.eventType === 'DELETE') {
          const id = String(payload.old.id ?? '');
          setData(current => ({ ...current, places: current.places.filter(row => row.id !== id) }));
          return;
        }
        const place = payload.new as Place;
        setData(current => ({ ...current, places: upsert(current.places, place) }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, payload => {
        changedDuringSnapshot.checklist = true;
        if (payload.eventType === 'DELETE') {
          const id = String(payload.old.id ?? '');
          setData(current => ({ ...current, checklist: current.checklist.filter(row => row.id !== id) }));
          return;
        }
        const item = payload.new as ChecklistItem;
        setData(current => ({ ...current, checklist: upsert(current.checklist, item) }));
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
          changedDuringSnapshot = { events: false, places: false, checklist: false };
          const generation = ++syncGeneration;
          void Promise.all([
            client.from('events').select('*').order('starts_at'),
            client.from('places').select('*').order('created_at', { ascending: false }),
            client.from('checklist_items').select('*').order('created_at'),
          ]).then(([events, places, checklist]) => {
            if (generation !== syncGeneration) return;
            if (events.error || places.error || checklist.error) { setStatus('sync-error'); return; }
            setData(current => ({
              events: changedDuringSnapshot.events ? current.events : sortEvents((events.data ?? []) as EventItem[]),
              places: changedDuringSnapshot.places ? current.places : (places.data ?? []) as Place[],
              checklist: changedDuringSnapshot.checklist ? current.checklist : (checklist.data ?? []) as ChecklistItem[],
            }));
          }).catch(() => { if (generation === syncGeneration) setStatus('sync-error'); });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setStatus('offline');
        }
      });

    return () => {
      syncGeneration += 1;
      void client.removeChannel(channel);
    };
  }, [setData, setStatus]);
}
