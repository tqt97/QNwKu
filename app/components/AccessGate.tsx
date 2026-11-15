'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Heart, LockKeyhole, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { plannerEmail } from '@/lib/supabase';

export default function AccessGate({ setupRequired = false }: { setupRequired?: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (setupRequired || !plannerEmail) return;
    setBusy(true);
    setMessage('');
    const client = createClient();
    if (!client) { setMessage('Chưa kết nối được với nơi lưu giữ bí mật.'); setBusy(false); return; }
    const { error } = await client.auth.signInWithPassword({ email: plannerEmail, password });
    if (error) { setMessage('Mật khẩu chưa đúng rồi, thử lại nhé ♡'); setBusy(false); return; }
    const { data: { user } } = await client.auth.getUser();
    const { data: member, error: memberError } = user
      ? await client.from('planner_members').select('user_id').eq('user_id', user.id).maybeSingle()
      : { data: null, error: null };
    if (memberError || !member) {
      await client.auth.signOut();
      setMessage('Tài khoản này chưa được mời vào góc nhỏ của tụi mình.');
      setBusy(false);
      return;
    }
    router.replace('/');
    router.refresh();
  }

  return <main className="gate-shell">
    <div className="gate-glow gate-glow-one"/><div className="gate-glow gate-glow-two"/>
    <section className="gate-card" aria-labelledby="gate-title">
      <div className="gate-art" aria-hidden="true"><span className="gate-sparkle gate-sparkle-left"><Sparkles size={19}/></span><span className="gate-lock"><LockKeyhole size={25}/><Heart className="gate-heart" size={13} fill="currentColor"/></span><span className="gate-sparkle gate-sparkle-right">✦</span></div>
      <p className="gate-kicker">MỘT GÓC NHỎ RIÊNG TƯ</p>
      <h1 id="gate-title">Chỉ dành cho<br/>tụi mình thôi ♡</h1>
      <p className="gate-copy">Nhập mật khẩu để mở lại những cuộc hẹn và điều dễ thương mình đã cất giữ nhé.</p>
      {setupRequired ? <div className="gate-message" role="status">Góc nhỏ đang chờ được kết nối. Hãy hoàn tất cấu hình Supabase để mở khóa.</div> : <form className="gate-form" onSubmit={unlock}>
        <label htmlFor="gate-password">Mật khẩu riêng của tụi mình</label>
        <div className="gate-input-wrap"><input id="gate-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" autoFocus required value={password} onChange={event => setPassword(event.target.value)} placeholder="Nhập mật khẩu nhé"/><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>
        {message && <p className="gate-message" role="alert">{message}</p>}
        <button className="gate-submit" type="submit" disabled={busy}>{busy ? 'Đang mở cửa...' : <><span>Mở cửa vào nhà mình</span><Heart size={16} fill="currentColor"/></>}</button>
      </form>}
      <div className="gate-foot"><span>♡</span> Chuyện nhỏ của riêng hai đứa <span>♡</span></div>
    </section>
  </main>;
}
