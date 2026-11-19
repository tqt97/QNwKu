'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Plus, Send, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type SettingsResponse = { reminder_times: string[]; timezone: string };
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

function decodeKey(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

export default function ReminderSettings() {
  const [times, setTimes] = useState<string[]>(['07:00']);
  const [newTime, setNewTime] = useState('07:00');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIosDevice(ios);
    setIosNeedsInstall(ios && !standalone);
    const onInstallPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); setIosNeedsInstall(false); };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window) || !('showNotification' in ServiceWorkerRegistration.prototype)) {
      setPermission('unsupported');
    } else {
      setPermission(Notification.permission);
      void navigator.serviceWorker.ready.then(registration => registration.pushManager.getSubscription()).then(async subscription => {
        if (subscription) {
          await saveSubscription(subscription);
          setSubscribed(true);
        } else setSubscribed(false);
      }).catch(() => setMessage('Chưa đồng bộ được đăng ký thông báo trên thiết bị này. Hãy tải lại trang hoặc bật thông báo lại.'));
    }
    void fetch('/api/reminders/settings').then(response => response.ok ? response.json() : null).then((settings: SettingsResponse | null) => {
      if (settings?.reminder_times) setTimes(settings.reminder_times);
    }).catch(() => {});
    const client = createClient();
    const channel = client?.channel('shared-reminder-settings').on('postgres_changes', {
      event: '*', schema: 'public', table: 'reminder_settings', filter: 'id=eq.1',
    }, payload => {
      const row = (payload.new ?? {}) as { reminder_times?: string[] };
      if (row.reminder_times) setTimes(row.reminder_times);
    }).subscribe();
    return () => {
      if (client && channel) void client.removeChannel(channel);
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function saveSubscription(subscription: PushSubscription) {
    const response = await fetch('/api/reminders/subscriptions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()),
    });
    if (!response.ok) throw new Error('Chưa lưu được thiết bị nhận thông báo.');
  }

  async function enablePush() {
    setBusy(true); setMessage('');
    try {
      if (iosNeedsInstall) {
        setMessage('Trên iPhone/iPad dùng iOS/iPadOS 16.4 trở lên, hãy nhấn Chia sẻ → Thêm vào Màn hình chính, mở app vừa cài rồi bật thông báo trong đó.');
        return;
      }
      // iOS requires the permission request to start directly from the user's tap.
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        setMessage(result === 'denied'
          ? 'Quyền thông báo đang bị chặn. Hãy mở Cài đặt của trình duyệt, vào Quyền trang web/Thông báo, cho phép website này rồi quay lại bật.'
          : 'Cho phép thông báo để nhận nhắc lịch trên thiết bị này.');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!applicationServerKey) throw new Error('Thiếu cấu hình khóa push công khai của ứng dụng.');
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(applicationServerKey) });
      await saveSubscription(subscription);
      setSubscribed(true);
      setMessage('Thiết bị này đã sẵn sàng nhận nhắc lịch ♡');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Chưa bật được thông báo.'); }
    finally { setBusy(false); }
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  }

  async function sendTestNotification() {
    setBusy(true); setMessage('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setSubscribed(false);
        throw new Error('Thiết bị chưa còn đăng ký push. Hãy bật thông báo lại.');
      }
      const response = await fetch('/api/reminders/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      const result = await response.json();
      if (response.status === 404 || result.statusCode === 404 || result.statusCode === 410) {
        if (result.statusCode === 404 || result.statusCode === 410) await subscription.unsubscribe();
        setSubscribed(false);
      }
      if (!response.ok) throw new Error(result.error ?? 'Chưa gửi được thông báo thử.');
      setMessage(result.message ?? 'Đã gửi thông báo thử tới thiết bị này.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Chưa gửi được thông báo thử.'); }
    finally { setBusy(false); }
  }

  async function disablePush() {
    setBusy(true); setMessage('');
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch('/api/reminders/subscriptions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        if (!response.ok) throw new Error('Chưa xóa được thiết bị khỏi danh sách nhận thông báo.');
        await subscription.unsubscribe();
      }
      setSubscribed(false); setMessage('Đã tắt thông báo trên thiết bị này.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Chưa tắt được thông báo.'); }
    finally { setBusy(false); }
  }

  async function saveTimes(next: string[]) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/reminders/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reminder_times: next }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Chưa lưu được khung giờ.');
      setTimes(result.reminder_times);
      setMessage('Đã đồng bộ khung giờ cho cả ứng dụng ♡');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Chưa lưu được khung giờ.'); }
    finally { setBusy(false); }
  }

  function addTime() {
    const next = [...new Set([...times, newTime])].sort();
    if (next.length > 8) { setMessage('Có thể đặt tối đa 8 khung giờ mỗi ngày.'); return; }
    if (next.length === times.length) { setMessage('Khung giờ này đã có rồi.'); return; }
    void saveTimes(next);
  }

  return <details className="reminder-settings">
    <summary><Bell size={17}/><span>Nhắc lịch</span><small>Thiết lập chung cho hai người</small></summary>
    <div className="reminder-panel">
      <div className="reminder-panel-heading"><div><h2>Nhắc mình những ngày mong chờ</h2><p>Gửi theo giờ Việt Nam (Asia/Ho_Chi_Minh), chỉ khi có sự kiện tương lai.</p></div></div>
      <div className="reminder-times" aria-label="Khung giờ nhắc lịch">
        {times.length ? times.map(time => <div className="reminder-time" key={time}><time>{time}</time><button type="button" disabled={busy} aria-label={`Xóa khung giờ ${time}`} onClick={() => void saveTimes(times.filter(value => value !== time))}><X size={15}/></button></div>) : <p>Chưa đặt khung giờ nhắc.</p>}
      </div>
      <div className="reminder-add-time"><label htmlFor="reminder-time-input">Thêm giờ</label><input id="reminder-time-input" type="time" value={newTime} onChange={event => setNewTime(event.target.value)}/><button type="button" disabled={busy} onClick={addTime}><Plus size={15}/> Thêm</button></div>
      <div className="reminder-device">
        <div><strong>Thông báo trên thiết bị này</strong><p>Để nhận push trên thiết bị khác, bật thông báo riêng trên thiết bị đó.</p></div>
        {permission === 'unsupported' ? <span className="reminder-unsupported">Trình duyệt này chưa hỗ trợ Web Push.</span> : subscribed ? <div className="reminder-device-actions"><button type="button" disabled={busy} className="reminder-toggle" onClick={() => void sendTestNotification()}><Send size={15}/> {busy ? 'Đang gửi…' : 'Gửi thử'}</button><button type="button" disabled={busy} className="reminder-toggle" onClick={() => void disablePush()}><BellOff size={16}/> Tắt thiết bị này</button></div> : <button type="button" disabled={busy} className="reminder-toggle" onClick={() => void enablePush()}><Bell size={16}/> {busy ? 'Đang bật…' : 'Bật thông báo'}</button>}
      </div>
      {installPrompt && !installed && <button type="button" className="reminder-install" onClick={() => void installApp()}>Cài ứng dụng lên thiết bị</button>}
      {iosNeedsInstall && <p className="reminder-help">Để nhận push trên iPhone/iPad (iOS/iPadOS 16.4 trở lên): mở menu Chia sẻ → Thêm vào Màn hình chính → mở biểu tượng ứng dụng mới. Sau đó bật thông báo tại đây.</p>}
      {permission === 'unsupported' && isIosDevice && !iosNeedsInstall && <p className="reminder-help">Web Push cần iOS/iPadOS 16.4 trở lên và phải mở planner từ biểu tượng đã thêm vào Màn hình chính.</p>}
      {permission === 'denied' && <p className="reminder-help">Quyền đang bị từ chối. Hãy mở cài đặt quyền riêng tư/thông báo của trình duyệt hoặc thiết bị, cho phép trang web này, rồi quay lại để bật. iPhone/iPad cần thêm ứng dụng vào Màn hình chính trước khi bật push.</p>}
      {message && <p className="reminder-message" role="status">{message}</p>}
    </div>
  </details>;
}
