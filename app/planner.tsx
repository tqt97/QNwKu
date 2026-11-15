'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { CalendarDays, Check, ChevronRight, Coffee, Heart, MapPin, Plus, Sparkles, X } from 'lucide-react';
import type { AppData, ChecklistItem, EventItem, Place } from '@/lib/types';
import { dateToLocalInput, localInputToISO } from '@/lib/dates';
import EventRow from './components/EventRow';
import PlaceRow from './components/PlaceRow';
import ChecklistRow from './components/ChecklistRow';
import HeroCard from './components/HeroCard';
import { usePlannerRealtime, type RealtimeStatus } from './hooks/usePlannerRealtime';

type FormKind = 'event' | 'place' | 'check' | null;
const tableFor = { event: 'events', place: 'places', check: 'checklist_items' } as const;
const blankEvent = { title: '', starts_at: '', location: '', note: '' };
const blankPlace = { name: '', category: 'Ăn uống', area: '', dish: '', map_url: '', event_id: '' };
const blankCheck = { title: '', event_id: '' };

function handleDialogKeyboard(event: ReactKeyboardEvent<HTMLElement>, close: () => void) {
  if (event.key === 'Escape') { event.preventDefault(); close(); return; }
  if (event.key !== 'Tab') return;
  const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')).filter(element => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

export default function Planner({ initialData, initialNow, connectionError }: { initialData: AppData; initialNow: number; connectionError: string }) {
  const [data, setData] = useState(initialData);
  const [now, setNow] = useState(initialNow);
  const [kind, setKind] = useState<FormKind>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [pendingCheckIds, setPendingCheckIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState<'home' | 'events' | 'places'>('home');
  const [openPlaceActions, setOpenPlaceActions] = useState<string | null>(null);
  const [openEventActions, setOpenEventActions] = useState<string | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');

  usePlannerRealtime(setData, setRealtimeStatus);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (kind || showAddPicker || !returnFocusRef.current) return;
    returnFocusRef.current.focus();
    returnFocusRef.current = null;
  }, [kind, showAddPicker]);
  useEffect(() => {
    if (!openPlaceActions && !openEventActions) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-actions-root]')) {
        setOpenPlaceActions(null);
        setOpenEventActions(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPlaceActions(null);
        setOpenEventActions(null);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openPlaceActions, openEventActions]);

  const upcoming = useMemo(() => data.events.filter(e => new Date(e.starts_at).getTime() >= now).sort((a,b) => +new Date(a.starts_at) - +new Date(b.starts_at)), [data.events, now]);
  const featured = upcoming[0] ?? [...data.events].sort((a,b) => +new Date(b.starts_at) - +new Date(a.starts_at))[0];
  const visibleEvents = useMemo(() => {
    const sorted = [...data.events].sort((a,b) => +new Date(a.starts_at) - +new Date(b.starts_at));
    return tab === 'home' ? sorted.filter(event => new Date(event.starts_at).getTime() >= now) : sorted;
  }, [data.events, now, tab]);

  async function saveItem() {
    if (!kind) return;
    const table = tableFor[kind];
    const payload: Record<string, unknown> = { ...form };
    if (kind === 'event') {
      if (!payload.title || !payload.starts_at) { setToast('Bạn nhập tên và thời gian sự kiện nhé ♡'); return; }
      try { payload.starts_at = localInputToISO(String(payload.starts_at)); }
      catch (error) { setToast(error instanceof Error ? error.message : 'Ngày giờ chưa hợp lệ.'); return; }
      payload.accent = 'pink';
    }
    if (kind === 'place') { payload.name = String(payload.name ?? '').trim(); if (!payload.name) { setToast('Ghi tên món hoặc quán trước nha ♡'); return; } payload.event_id = payload.event_id || null; payload.visited = editing ? form.visited === 'true' : false; }
    if (kind === 'check') { if (!String(payload.title ?? '').trim()) { setToast('Viết một việc cần chuẩn bị nhé ♡'); return; } payload.title = String(payload.title).trim(); payload.event_id = payload.event_id || null; payload.done = editing ? form.done === 'true' : false; }
    setBusy(true);
    try {
      const response = await fetch(`/api/${table}`, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { id: editing, ...payload } : payload) });
      const result = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(result?.error ?? 'Lưu chưa thành công.');
      if (result) setData(current => {
        const key = kind === 'check' ? 'checklist' : kind === 'place' ? 'places' : 'events';
        const list = current[key] as Array<{id:string}>;
        return { ...current, [key]: editing ? list.map(row => row.id === editing ? result : row) : [result, ...list.filter(row => row.id !== result.id)] };
      });
      setToast(editing ? 'Đã cập nhật rồi nè ✨' : 'Đã thêm vào kế hoạch ♡'); closeForm();
    } catch (error) { setToast(error instanceof Error ? error.message : 'Có lỗi xảy ra.'); }
    finally { setBusy(false); }
  }

  function closeForm() { setKind(null); setEditing(null); setForm({}); }
  function rememberDialogFocus() {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return;
    const menu = active.closest('.place-actions-menu');
    returnFocusRef.current = menu?.parentElement?.querySelector<HTMLElement>('button[aria-controls]') ?? active;
  }
  function openCreate(nextKind: Exclude<FormKind, null>, eventId = '') {
    if (!showAddPicker) rememberDialogFocus();
    setEditing(null);
    setForm(nextKind === 'event' ? { ...blankEvent } : nextKind === 'place' ? { ...blankPlace, event_id: eventId } : { ...blankCheck, event_id: eventId });
    setKind(nextKind);
  }
  function chooseAddKind(nextKind: Exclude<FormKind, null>) {
    setShowAddPicker(false);
    openCreate(nextKind);
  }
  function openEdit(nextKind: Exclude<FormKind, null>, item: EventItem | Place | ChecklistItem) {
    rememberDialogFocus();
    setEditing(item.id);
    const values = { ...item } as unknown as Record<string, unknown>;
    if (nextKind === 'event') values.starts_at = dateToLocalInput(String(values.starts_at));
    Object.keys(values).forEach(key => { if (values[key] === null) values[key] = ''; });
    setForm(Object.fromEntries(Object.entries(values).map(([k,v]) => [k, String(v ?? '')])));
    setKind(nextKind);
  }
  async function deleteItem(itemKind: Exclude<FormKind, null>, item: EventItem | Place | ChecklistItem) {
    const relatedChecklistCount = itemKind === 'event' ? data.checklist.filter(row => row.event_id === item.id).length : 0;
    const confirmation = itemKind === 'event' && relatedChecklistCount
      ? `Xóa lịch hẹn này và ${relatedChecklistCount} việc chuẩn bị liên quan? Thao tác này không thể hoàn tác.`
      : 'Xóa mục này khỏi kế hoạch nha?';
    if (!window.confirm(confirmation)) return;
    try {
      const response = await fetch(`/api/${tableFor[itemKind]}?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      if (!response.ok) {
        let message = 'Xóa chưa thành công.';
        try { const body = await response.json(); message = body.error ?? message; } catch {}
        throw new Error(message);
      }
      if (itemKind === 'event') {
        setData(current => ({ ...current, events: current.events.filter(row => row.id !== item.id), checklist: current.checklist.filter(row => row.event_id !== item.id) }));
      } else {
        const key = itemKind === 'place' ? 'places' : 'checklist';
        setData(current => ({ ...current, [key]: current[key].filter(row => row.id !== item.id) }));
      }
      setToast('Đã xóa khỏi danh sách.');
    } catch (error) { setToast(error instanceof Error ? error.message : 'Xóa chưa thành công.'); }
  }
  async function toggleCheck(item: ChecklistItem) {
    if (pendingCheckIds.has(item.id)) return;
    const updated = { ...item, done: !item.done };
    setPendingCheckIds(current => new Set(current).add(item.id));
    setData(current => ({ ...current, checklist: current.checklist.map(row => row.id === item.id ? updated : row) }));
    try {
      const response = await fetch('/api/checklist_items', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(updated) });
      if (!response.ok) throw new Error('Chưa cập nhật được checklist.');
    } catch {
      setData(current => ({ ...current, checklist: current.checklist.map(row => row.id === item.id ? item : row) }));
      setToast('Chưa cập nhật được checklist. Đã khôi phục trạng thái trước đó.');
    } finally { setPendingCheckIds(current => { const next = new Set(current); next.delete(item.id); return next; }); }
  }
  async function togglePlaceVisited(place: Place) {
    const updated = { ...place, visited: !place.visited };
    setData(current => ({ ...current, places: current.places.map(row => row.id === place.id ? updated : row) }));
    try {
      const response = await fetch('/api/places', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error ?? 'Chưa cập nhật được danh sách muốn thử.'); }
    } catch (error) {
      setData(current => ({ ...current, places: current.places.map(row => row.id === place.id ? place : row) }));
      setToast(error instanceof Error ? error.message : 'Chưa cập nhật được danh sách muốn thử.');
    }
  }

  const eventName = (id: string | null) => data.events.find(e => e.id === id)?.title;
  const activeChecklist = featured ? data.checklist.filter(item => item.event_id === featured.id || item.event_id === null) : data.checklist;
  const doneCount = activeChecklist.filter(item => item.done).length;
  const visiblePlaces = tab === 'home' ? data.places.slice(0, 3) : data.places;

  return <main className="app-shell">
    <header className="topbar"><a href="#home" className="brand"><span className="brand-mark"><Heart className="brand-heart" size={19} fill="currentColor" /></span><span><span className="brand-name">KU</span> ơi, mình đi đâu thế</span></a><span className="topbar-note"><Sparkles size={15}/><span>một góc nhỏ của hai đứa</span><span className="sync-label" role="status" aria-live="polite">{realtimeStatus === 'connected' ? 'đang đồng bộ trực tiếp' : realtimeStatus === 'offline' ? 'kết nối trực tiếp bị gián đoạn' : realtimeStatus === 'sync-error' ? 'chưa tải lại được dữ liệu mới' : 'đang kết nối dữ liệu'}</span></span></header>

    <div className="layout" id="home">
      <aside className="side-intro"><div className="sticker">♡</div><h1>Những ngày<br/>mình mong chờ</h1><p className="intro-copy">Lưu lại những nơi muốn đến, những món muốn thử và mọi điều nho nhỏ trước ngày gặp nhau.</p><div className="side-note"><span>💌</span><p>“Đi đâu cũng được,<br/>miễn là đi cùng nhau.”</p></div><span className="side-flower">✿</span></aside>

      <section className="content">
        <div className="mobile-welcome"><h1>Những ngày mình mong chờ</h1></div>
        {connectionError && <div className="connection-warning">Chưa đọc được dữ liệu Supabase: {connectionError}</div>}
        {tab !== 'places' && <HeroCard featured={featured} initialNow={initialNow} onEdit={()=>featured ? openEdit('event',featured) : openCreate('event')} onScrollToEvents={()=>document.getElementById('upcoming-events')?.scrollIntoView({behavior:'smooth',block:'start'})} />}

        {(tab === 'home' || tab === 'events') && <section className="section-block" id="upcoming-events">
          <div className="section-heading"><div><p className="eyebrow">LỊCH HẸN DỄ THƯƠNG</p><h2>{tab === 'events' ? 'Tất cả sự kiện' : 'Những dịp sắp tới'}</h2></div><button className="add-button" aria-label="Thêm sự kiện" onClick={() => openCreate('event')}><Plus size={17}/><span>Thêm sự kiện</span></button></div>
          <div className="event-list">{visibleEvents.length ? visibleEvents.map((event,index) => <EventRow key={event.id} event={event} featured={index === 0} actionsOpen={openEventActions === event.id} onToggleActions={()=>{setOpenPlaceActions(null);setOpenEventActions(current=>current===event.id?null:event.id)}} onEdit={()=>{setOpenEventActions(null);openEdit('event',event)}} onDelete={()=>{setOpenEventActions(null);void deleteItem('event',event)}} />) : <p className="empty-state">{tab === 'home' && data.events.length ? 'Chưa có lịch hẹn sắp tới. Mình lên kèo mới nha ♡' : 'Chưa có lịch hẹn nào. Mình tạo chiếc đầu tiên nha ♡'}</p>}</div>
        </section>}


        {(tab === 'home' || tab === 'places') && <section className="section-block places-section">
          <div className="section-heading"><div><p className="eyebrow">MÓN NGON, QUÁN XINH MÌNH MUỐN THỬ</p><h2>Chỗ xinh mình muốn ghé</h2></div><button className="add-button" aria-label="Thêm món hoặc quán muốn thử" onClick={()=>openCreate('place')}><Plus size={17}/><span>Thêm mới</span></button></div>
          <div className="place-list">{visiblePlaces.length ? visiblePlaces.map(place=><PlaceRow key={place.id} place={place} actionsOpen={openPlaceActions===place.id} onToggleVisited={()=>void togglePlaceVisited(place)} onToggleActions={()=>{setOpenEventActions(null);setOpenPlaceActions(current=>current===place.id?null:place.id)}} onEdit={()=>{setOpenPlaceActions(null);openEdit('place',place)}} onDelete={()=>{setOpenPlaceActions(null);void deleteItem('place',place)}} />) : <p className="empty-state">Chưa lưu món hay quán nào. Thấy gì hay thì ghi lại ở đây nha ♡</p>}</div>
          {tab==='home'&&data.places.length>3&&<button className="see-all" onClick={()=>setTab('places')}>Xem tất cả địa điểm <ChevronRight size={15}/></button>}
        </section>}

        {(tab === 'home' || tab === 'events') && <section className="section-block checklist-section">
          <div className="section-heading"><div><p className="eyebrow">CHUẨN BỊ MỘT CHÚT</p><h2>Đừng quên mang theo</h2></div><span className="progress-label">{doneCount}/{activeChecklist.length} xong</span></div>
          <div className="checklist-card"><div className="progress-track"><span style={{width:`${activeChecklist.length ? doneCount / activeChecklist.length * 100 : 0}%`}}/></div>
            {activeChecklist.length ? activeChecklist.map(item=><ChecklistRow key={item.id} item={item} eventLabel={eventName(item.event_id)} pending={pendingCheckIds.has(item.id)} onToggle={()=>void toggleCheck(item)} onEdit={()=>openEdit('check',item)} onDelete={()=>void deleteItem('check',item)} />) : <p className="empty-state">Chưa có gì cần chuẩn bị. Có thể thêm ngay nè!</p>}
            <button className="add-check" onClick={()=>openCreate('check',featured?.id)}><Plus size={15}/> Thêm một việc cần chuẩn bị</button>
          </div>
        </section>}

        <footer className="footer-note"><span>made with</span><Heart size={13} fill="currentColor"/><span>and lots of love</span><Coffee size={14}/></footer>
      </section>
    </div>

    <nav className="mobile-nav" aria-label="Điều hướng"><button className={tab==='home'?'nav-active':''} aria-current={tab==='home'?'page':undefined} onClick={()=>setTab('home')}><Heart size={18}/><span>Nhà mình</span></button><button className={tab==='events'?'nav-active':''} aria-current={tab==='events'?'page':undefined} onClick={()=>setTab('events')}><CalendarDays size={18}/><span>Sự kiện</span></button><button className={tab==='places'?'nav-active':''} aria-current={tab==='places'?'page':undefined} onClick={()=>setTab('places')}><MapPin size={18}/><span>Địa điểm</span></button><button className="nav-add" onClick={event=>{returnFocusRef.current=event.currentTarget;setShowAddPicker(true)}}><Plus size={20}/><span>Thêm mới</span></button></nav>

    {showAddPicker&&<div className="modal-backdrop add-picker-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowAddPicker(false)}}><section className="form-modal add-picker" role="dialog" aria-modal="true" aria-labelledby="add-picker-title" onKeyDown={e=>handleDialogKeyboard(e,()=>setShowAddPicker(false))}><div className="modal-heading"><div><p className="eyebrow">THÊM VÀO KẾ HOẠCH</p><h2 id="add-picker-title">Mình muốn thêm gì nhỉ?</h2></div><button type="button" className="icon-button" onClick={()=>setShowAddPicker(false)} aria-label="Đóng"><X size={19}/></button></div><div className="add-picker-options"><button type="button" className="add-picker-option" autoFocus onClick={()=>chooseAddKind('event')}><CalendarDays size={20}/><span><strong>Sự kiện</strong><small>Ngày hẹn và giờ mình gặp nhau</small></span><ChevronRight size={17}/></button><button type="button" className="add-picker-option" onClick={()=>chooseAddKind('check')}><Check size={20}/><span><strong>Chuẩn bị</strong><small>Việc nhỏ hoặc món cần mang theo</small></span><ChevronRight size={17}/></button><button type="button" className="add-picker-option" onClick={()=>chooseAddKind('place')}><Heart size={20}/><span><strong>Lưu lại</strong><small>Tên món hoặc quán mình muốn thử</small></span><ChevronRight size={17}/></button></div></section></div>}

    {kind&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeForm()}}><section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title" onKeyDown={e=>handleDialogKeyboard(e,closeForm)}><div className="modal-heading"><div><p className="eyebrow">THÊM VÀO THẾ GIỚI NHỎ</p><h2 id="form-title">{editing?'Sửa một chút nha':kind==='event'?'Tạo lịch hẹn mới':kind==='place'?'Lưu điều mình muốn thử':'Thêm việc cần chuẩn bị'}</h2></div><button type="button" className="icon-button" onClick={closeForm} aria-label="Đóng"><X size={19}/></button></div>
      <form onSubmit={e=>{e.preventDefault();void saveItem()}}>
        {kind==='event'&&<><label>Tên sự kiện<input autoFocus placeholder="Ví dụ: Cuối tuần mình đi Đà Lạt" value={form.title??''} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Ngày và giờ<input type="datetime-local" value={form.starts_at??''} onChange={e=>setForm({...form,starts_at:e.target.value})}/></label><label>Địa điểm<input placeholder="Đà Lạt, quán cà phê..." value={form.location??''} onChange={e=>setForm({...form,location:e.target.value})}/></label><label>Lời nhắn nhỏ<textarea rows={3} placeholder="Điều gì đó muốn nhớ về ngày này..." value={form.note??''} onChange={e=>setForm({...form,note:e.target.value})}/></label></>}
        {kind==='place'&&<label>Món hoặc quán mình muốn thử<input autoFocus placeholder="Matcha latte, quán cà phê cạnh hồ..." value={form.name??''} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
        {kind==='check'&&<><label>Việc cần chuẩn bị<input autoFocus placeholder="Ví dụ: Sạc dự phòng" value={form.title??''} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Cho sự kiện<select value={form.event_id??''} onChange={e=>setForm({...form,event_id:e.target.value})}><option value="">Việc chung</option>{data.events.map(event=><option key={event.id} value={event.id}>{event.title}</option>)}</select></label></>}
        <div className="modal-actions"><button type="button" className="cancel-button" onClick={closeForm}>Để sau</button><button type="submit" className="primary-button" disabled={busy}>{busy?'Đang lưu...':<><Heart size={15} fill="currentColor"/>{editing?'Lưu thay đổi':'Lưu lại ♡'}</>}</button></div>
      </form>
    </section></div>}
    {toast&&<div className="toast" role="status">{toast}</div>}
  </main>;
}
