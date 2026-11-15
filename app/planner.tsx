'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronRight, Clock3, Coffee, Heart, MapPin, MoreHorizontal, Plus, Sparkles, Trash2, X } from 'lucide-react';
import type { AppData, ChecklistItem, EventItem, Place } from '@/lib/types';

type FormKind = 'event' | 'place' | 'check' | null;
const tableFor = { event: 'events', place: 'places', check: 'checklist_items' } as const;
const blankEvent = { title: '', starts_at: '', location: '', note: '' };
const blankPlace = { name: '', category: 'Ăn uống', area: '', dish: '', map_url: '', event_id: '' };
const blankCheck = { title: '', event_id: '' };

function asLocalInput(date: string) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function prettyDate(date: string) { return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(date)); }
function prettyTime(date: string) { return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(date)); }
function countdown(date: string, now: number) {
  const seconds = Math.max(0, Math.floor((new Date(date).getTime() - now) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor((seconds % 86400) / 3600), minutes: Math.floor((seconds % 3600) / 60), seconds: seconds % 60, passed: new Date(date).getTime() < now };
}

export default function Planner({ initialData, connectionError }: { initialData: AppData; connectionError: string }) {
  const [data, setData] = useState(initialData);
  const [now, setNow] = useState(0);
  const [kind, setKind] = useState<FormKind>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState<'home' | 'events' | 'places'>('home');
  const [openPlaceActions, setOpenPlaceActions] = useState<string | null>(null);
  const [openEventActions, setOpenEventActions] = useState<string | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);

  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3000); return () => clearTimeout(timer); }, [toast]);
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
  const clock = featured ? countdown(featured.starts_at, now) : null;

  async function saveItem() {
    if (!kind) return;
    const table = tableFor[kind];
    const payload: Record<string, unknown> = { ...form };
    if (kind === 'event') {
      if (!payload.title || !payload.starts_at) { setToast('Bạn nhập tên và thời gian sự kiện nhé ♡'); return; }
      payload.starts_at = new Date(String(payload.starts_at)).toISOString();
      payload.accent = 'pink';
    }
    if (kind === 'place') { payload.name = String(payload.name ?? '').trim(); if (!payload.name) { setToast('Ghi tên món hoặc quán trước nha ♡'); return; } payload.event_id = payload.event_id || null; payload.visited = editing ? form.visited === 'true' : false; }
    if (kind === 'check') { if (!payload.title) { setToast('Viết một việc cần chuẩn bị nhé ♡'); return; } payload.event_id = payload.event_id || null; payload.done = false; }
    setBusy(true);
    try {
      const response = await fetch(`/api/${table}`, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { id: editing, ...payload } : payload) });
      const result = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(result?.error ?? 'Lưu chưa thành công.');
      if (result) setData(current => {
        const key = kind === 'check' ? 'checklist' : kind === 'place' ? 'places' : 'events';
        const list = current[key] as Array<{id:string}>;
        return { ...current, [key]: editing ? list.map(row => row.id === editing ? result : row) : [result, ...list] };
      });
      setToast(editing ? 'Đã cập nhật rồi nè ✨' : 'Đã thêm vào kế hoạch ♡'); closeForm();
    } catch (error) { setToast(error instanceof Error ? error.message : 'Có lỗi xảy ra.'); }
    finally { setBusy(false); }
  }

  function closeForm() { setKind(null); setEditing(null); setForm({}); }
  function openCreate(nextKind: Exclude<FormKind, null>, eventId = '') {
    setEditing(null);
    setForm(nextKind === 'event' ? { ...blankEvent } : nextKind === 'place' ? { ...blankPlace, event_id: eventId } : { ...blankCheck, event_id: eventId });
    setKind(nextKind);
  }
  function chooseAddKind(nextKind: Exclude<FormKind, null>) {
    setShowAddPicker(false);
    openCreate(nextKind);
  }
  function openEdit(nextKind: Exclude<FormKind, null>, item: EventItem | Place | ChecklistItem) {
    setEditing(item.id);
    const values = { ...item } as unknown as Record<string, unknown>;
    if (nextKind === 'event') values.starts_at = asLocalInput(String(values.starts_at));
    Object.keys(values).forEach(key => { if (values[key] === null) values[key] = ''; });
    setForm(Object.fromEntries(Object.entries(values).map(([k,v]) => [k, String(v ?? '')])));
    setKind(nextKind);
  }
  async function deleteItem(itemKind: Exclude<FormKind, null>, item: EventItem | Place | ChecklistItem) {
    if (!window.confirm('Xóa mục này khỏi kế hoạch nha?')) return;
    const response = await fetch(`/api/${tableFor[itemKind]}?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    if (!response.ok) { const body = await response.json(); setToast(body.error ?? 'Xóa chưa thành công.'); return; }
    const key = itemKind === 'event' ? 'events' : itemKind === 'place' ? 'places' : 'checklist';
    setData(current => ({ ...current, [key]: current[key].filter(row => row.id !== item.id) }));
    setToast('Đã xóa khỏi danh sách.');
  }
  async function toggleCheck(item: ChecklistItem) {
    const updated = { ...item, done: !item.done };
    setData(current => ({ ...current, checklist: current.checklist.map(row => row.id === item.id ? updated : row) }));
    const response = await fetch('/api/checklist_items', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(updated) });
    if (!response.ok) { setData(current => ({ ...current, checklist: current.checklist.map(row => row.id === item.id ? item : row) })); setToast('Chưa cập nhật được checklist.'); }
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
  const activeChecklist = featured ? data.checklist.filter(item => item.event_id === featured.id) : data.checklist;
  const doneCount = activeChecklist.filter(item => item.done).length;
  const visiblePlaces = tab === 'home' ? data.places.slice(0, 3) : data.places;

  return <main className="app-shell">
    <header className="topbar"><a href="#home" className="brand"><span className="brand-mark"><Heart size={19} fill="currentColor" /></span><span>KU ơi, mình đi đâu thế<small>Lên kèo đi chơi thôi ♡</small></span></a><span className="topbar-note"><Sparkles size={15}/> một góc nhỏ của hai đứa</span></header>

    <div className="layout" id="home">
      <aside className="side-intro"><div className="sticker">♡</div><h1>Những ngày<br/>mình mong chờ</h1><p className="intro-copy">Lưu lại những nơi muốn đến, những món muốn thử và mọi điều nho nhỏ trước ngày gặp nhau.</p><div className="side-note"><span>💌</span><p>“Đi đâu cũng được,<br/>miễn là đi cùng nhau.”</p></div><span className="side-flower">✿</span></aside>

      <section className="content">
        {connectionError && <div className="connection-warning">Chưa đọc được dữ liệu Supabase: {connectionError}</div>}
        {tab !== 'places' && <section className="hero-card">
          <div className="hero-sparkle sparkle-one">✦</div><div className="hero-sparkle sparkle-two">✧</div>
          <div className="hero-top"><span className="pill"><Heart size={13} fill="currentColor"/> {featured ? 'NGÀY TỤI MÌNH GẶP NHAU' : 'THÊM MỘT KHOẢNH KHẮC'}</span><button className="icon-button hero-edit" aria-label="Sửa sự kiện" onClick={() => featured ? openEdit('event', featured) : openCreate('event')}><CalendarDays size={17}/></button></div>
          {featured ? <><h2>{featured.title}</h2><p className="hero-date"><CalendarDays size={15}/>{prettyDate(featured.starts_at)}<span className="dot">·</span><MapPin size={15}/>{featured.location || 'Chưa chọn địa điểm'}</p>
            <div className="countdown" aria-label="Thời gian đếm ngược">{clock?.passed ? <div className="today-message">Hẹn hò đang diễn ra đó! Tận hưởng từng phút bên nhau nha ♡</div> : <>{[[clock?.days ?? 0,'ngày'],[clock?.hours ?? 0,'giờ'],[clock?.minutes ?? 0,'phút'],[clock?.seconds ?? 0,'giây']].map(([n,label]) => <div className="time-unit" key={String(label)}><strong>{String(n).padStart(2,'0')}</strong><span>{label}</span></div>)}</>}</div>
            <div className="hero-bottom"><span>đếm từng chút một để gặp cậu <span className="heart-pulse">♥</span></span><button type="button" className="text-button scroll-down" aria-label="Cuộn xuống những dịp sắp tới" onClick={()=>document.getElementById('upcoming-events')?.scrollIntoView({behavior:'smooth',block:'start'})}><ChevronDown size={20}/></button></div>
          </> : <><h2>Ngày gặp nhau<br/>đang chờ được lên lịch</h2><p className="hero-date">Tạo một sự kiện để bắt đầu đếm ngược ♡</p><button className="primary-button" onClick={() => openCreate('event')}><Plus size={17}/>Tạo sự kiện đầu tiên</button></>}
        </section>}

        {(tab === 'home' || tab === 'events') && <section className="section-block" id="upcoming-events">
          <div className="section-heading"><div><p className="eyebrow">LỊCH HẸN DỄ THƯƠNG</p><h2>{tab === 'events' ? 'Tất cả sự kiện' : 'Những dịp sắp tới'}</h2></div><button className="add-button" aria-label="Thêm sự kiện" onClick={() => openCreate('event')}><Plus size={17}/><span>Thêm sự kiện</span></button></div>
          <div className="event-list">{data.events.length ? data.events.map((event,index) => <article className={`event-row ${index === 0 ? 'event-row-featured' : ''}`} key={event.id}>
            <div className="event-datebox"><span>{new Intl.DateTimeFormat('vi-VN',{month:'short'}).format(new Date(event.starts_at)).replace('.','')}</span><strong>{new Date(event.starts_at).getDate()}</strong></div><div className="event-copy"><h3>{event.title}</h3><p><span className="event-meta-item"><Clock3 size={13}/>{prettyTime(event.starts_at)}</span><span className="event-meta-item"><MapPin size={13}/>{event.location || 'Chưa có địa điểm'}</span></p></div><div className="event-actions-root" data-actions-root><button type="button" className="event-more" data-actions-root aria-label={`Thao tác với ${event.title}`} aria-expanded={openEventActions===event.id} aria-controls={`event-actions-${event.id}`} onClick={()=>{setOpenPlaceActions(null);setOpenEventActions(current=>current===event.id?null:event.id)}}><MoreHorizontal size={19}/></button><div className="event-actions-menu" data-actions-root id={`event-actions-${event.id}`} hidden={openEventActions!==event.id}><button type="button" onClick={()=>{setOpenEventActions(null);openEdit('event',event)}}>Sửa</button><button type="button" onClick={()=>{setOpenEventActions(null);void deleteItem('event',event)}}>Xóa</button></div></div>
          </article>) : <p className="empty-state">Chưa có lịch hẹn nào. Mình tạo chiếc đầu tiên nha ♡</p>}</div>
        </section>}

        {(tab === 'home' || tab === 'events') && <section className="section-block checklist-section">
          <div className="section-heading"><div><p className="eyebrow">CHUẨN BỊ MỘT CHÚT</p><h2>Đừng quên mang theo</h2></div><span className="progress-label">{doneCount}/{activeChecklist.length} xong</span></div>
          <div className="checklist-card"><div className="progress-track"><span style={{width:`${activeChecklist.length ? doneCount / activeChecklist.length * 100 : 0}%`}}/></div>
            {activeChecklist.length ? activeChecklist.map(item=><div className="check-row" key={item.id}><button className={`checkbox ${item.done?'checked':''}`} aria-label={item.done?'Bỏ đánh dấu':'Đánh dấu hoàn thành'} onClick={()=>void toggleCheck(item)}>{item.done&&<Check size={14}/>}</button><button className={`check-title ${item.done?'is-done':''}`} onClick={()=>openEdit('check',item)}>{item.title}</button>{eventName(item.event_id)&&<span className="check-event">{eventName(item.event_id)}</span>}<button className="mini-delete" aria-label="Xóa checklist" onClick={()=>void deleteItem('check',item)}><X size={15}/></button></div>) : <p className="empty-state">Chưa có gì cần chuẩn bị. Có thể thêm ngay nè!</p>}
            <button className="add-check" onClick={()=>openCreate('check',featured?.id)}><Plus size={15}/> Thêm một việc cần chuẩn bị</button>
          </div>
        </section>}

        {(tab === 'home' || tab === 'places') && <section className="section-block places-section">
          <div className="section-heading"><div><p className="eyebrow">MÓN NGON, QUÁN XINH MÌNH MUỐN THỬ</p><h2>Chỗ xinh mình muốn ghé</h2></div><button className="add-button" aria-label="Thêm món hoặc quán muốn thử" onClick={()=>openCreate('place')}><Plus size={17}/><span>Thêm mới</span></button></div>
          <div className="place-list">{visiblePlaces.length ? visiblePlaces.map(place=><article className="place-row" key={place.id}>
            <button className={`checkbox ${place.visited?'checked':''}`} aria-label={place.visited?`Bỏ đánh dấu đã thử ${place.name}`:`Đánh dấu đã thử ${place.name}`} onClick={()=>void togglePlaceVisited(place)}>{place.visited&&<Check size={14}/>}</button><span className={`place-note-title ${place.visited?'is-done':''}`}>{place.name}</span><button type="button" className="place-more" data-actions-root aria-label={`Thao tác với ${place.name}`} aria-expanded={openPlaceActions===place.id} aria-controls={`place-actions-${place.id}`} onClick={()=>{setOpenEventActions(null);setOpenPlaceActions(current=>current===place.id?null:place.id)}}>···</button><div className="place-actions-menu" data-actions-root id={`place-actions-${place.id}`} hidden={openPlaceActions!==place.id}><button type="button" onClick={()=>{setOpenPlaceActions(null);openEdit('place',place)}}>Chỉnh sửa</button><button type="button" onClick={()=>{setOpenPlaceActions(null);void deleteItem('place',place)}}>Xóa mục</button></div>
          </article>) : <p className="empty-state">Chưa lưu món hay quán nào. Thấy gì hay thì ghi lại ở đây nha ♡</p>}</div>
          {tab==='home'&&data.places.length>3&&<button className="see-all" onClick={()=>setTab('places')}>Xem tất cả địa điểm <ChevronRight size={15}/></button>}
        </section>}

        <footer className="footer-note"><span>made with</span><Heart size={13} fill="currentColor"/><span>and lots of love</span><Coffee size={14}/></footer>
      </section>
    </div>

    <nav className="mobile-nav" aria-label="Điều hướng"><button className={tab==='home'?'nav-active':''} onClick={()=>setTab('home')}><Heart size={18}/><span>Nhà mình</span></button><button className={tab==='events'?'nav-active':''} onClick={()=>setTab('events')}><CalendarDays size={18}/><span>Sự kiện</span></button><button className={tab==='places'?'nav-active':''} onClick={()=>setTab('places')}><MapPin size={18}/><span>Địa điểm</span></button><button className="nav-add" onClick={()=>setShowAddPicker(true)}><Plus size={20}/><span>Thêm mới</span></button></nav>

    {showAddPicker&&<div className="modal-backdrop add-picker-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowAddPicker(false)}}><section className="form-modal add-picker" role="dialog" aria-modal="true" aria-labelledby="add-picker-title" onKeyDown={e=>{if(e.key==='Escape')setShowAddPicker(false)}}><div className="modal-heading"><div><p className="eyebrow">THÊM VÀO KẾ HOẠCH</p><h2 id="add-picker-title">Mình muốn thêm gì nhỉ?</h2></div><button type="button" className="icon-button" onClick={()=>setShowAddPicker(false)} aria-label="Đóng"><X size={19}/></button></div><div className="add-picker-options"><button type="button" className="add-picker-option" autoFocus onClick={()=>chooseAddKind('event')}><CalendarDays size={20}/><span><strong>Sự kiện</strong><small>Ngày hẹn và giờ mình gặp nhau</small></span><ChevronRight size={17}/></button><button type="button" className="add-picker-option" onClick={()=>chooseAddKind('check')}><Check size={20}/><span><strong>Chuẩn bị</strong><small>Việc nhỏ hoặc món cần mang theo</small></span><ChevronRight size={17}/></button><button type="button" className="add-picker-option" onClick={()=>chooseAddKind('place')}><Heart size={20}/><span><strong>Lưu lại</strong><small>Tên món hoặc quán mình muốn thử</small></span><ChevronRight size={17}/></button></div></section></div>}

    {kind&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeForm()}}><section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><div className="modal-heading"><div><p className="eyebrow">THÊM VÀO THẾ GIỚI NHỎ</p><h2 id="form-title">{editing?'Sửa một chút nha':kind==='event'?'Tạo lịch hẹn mới':kind==='place'?'Lưu điều mình muốn thử':'Thêm việc cần chuẩn bị'}</h2></div><button className="icon-button" onClick={closeForm} aria-label="Đóng"><X size={19}/></button></div>
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
