export type EventItem = { id: string; title: string; starts_at: string; location: string; note: string; accent: string };
export type Place = { id: string; name: string; category: string; area: string; dish: string; map_url: string; event_id: string | null; visited: boolean };
export type ChecklistItem = { id: string; event_id: string | null; title: string; done: boolean };
export type AppData = { events: EventItem[]; places: Place[]; checklist: ChecklistItem[] };
