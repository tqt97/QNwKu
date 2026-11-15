'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, Heart, MapPin, Plus } from 'lucide-react';
import type { EventItem } from '@/lib/types';
import { formatAppDateTime } from '@/lib/dates';

type Props = { featured?: EventItem; initialNow: number; onEdit: () => void; onScrollToEvents: () => void };

function countdown(date: string, now: number) {
  const seconds = Math.max(0, Math.floor((new Date(date).getTime() - now) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor((seconds % 86400) / 3600), minutes: Math.floor((seconds % 3600) / 60), seconds: seconds % 60, passed: new Date(date).getTime() < now };
}

export default function HeroCard({ featured, initialNow, onEdit, onScrollToEvents }: Props) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clock = featured ? countdown(featured.starts_at, now) : null;

  return <section className="hero-card">
    <div className="hero-sparkle sparkle-one">✦</div><div className="hero-sparkle sparkle-two">✧</div>
    <div className="hero-top"><span className="pill"><Heart size={13} fill="currentColor"/> {featured ? 'NGÀY TỤI MÌNH GẶP NHAU' : 'THÊM MỘT KHOẢNH KHẮC'}</span><button type="button" className="icon-button hero-edit" aria-label="Sửa sự kiện" onClick={onEdit}><CalendarDays size={17}/></button></div>
    {featured ? <><h2>{featured.title}</h2><p className="hero-date"><CalendarDays size={15}/>{formatAppDateTime(featured.starts_at)}<span className="dot">·</span><MapPin size={15}/>{featured.location || 'Chưa chọn địa điểm'}</p>
      <div className="countdown" aria-label="Thời gian đếm ngược">{clock?.passed ? <div className="today-message">Hẹn hò đang diễn ra đó! Tận hưởng từng phút bên nhau nha ♡</div> : <>{[[clock?.days ?? 0,'ngày'],[clock?.hours ?? 0,'giờ'],[clock?.minutes ?? 0,'phút'],[clock?.seconds ?? 0,'giây']].map(([n,label]) => <div className="time-unit" key={String(label)}><strong>{String(n).padStart(2,'0')}</strong><span>{label}</span></div>)}</>}</div>
      <div className="hero-bottom"><span>đếm từng chút một để gặp cậu <span className="heart-pulse">♥</span></span><button type="button" className="text-button scroll-down" aria-label="Cuộn xuống những dịp sắp tới" onClick={onScrollToEvents}><ChevronDown size={20}/></button></div>
    </> : <><h2>Ngày gặp nhau<br/>đang chờ được lên lịch</h2><p className="hero-date">Tạo một sự kiện để bắt đầu đếm ngược ♡</p><button type="button" className="primary-button" onClick={onEdit}><Plus size={17}/>Tạo sự kiện đầu tiên</button></>}
  </section>;
}
