import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendNotification, setVapidDetails } from 'web-push';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const CATCH_UP_MINUTES = 30;

type EventRow = { id: string; title: string; starts_at: string };
type SubscriptionRow = { id: string; endpoint: string; p256dh: string; auth: string };

function localParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

function formatTimeRemaining(startsAt: Date, now: Date) {
  const totalMinutes = Math.max(0, Math.floor((startsAt.getTime() - now.getTime()) / 60_000));
  if (totalMinutes === 0) return 'dưới 1 phút';
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  return [days > 0 ? `${days} ngày` : '', hours > 0 ? `${hours} giờ` : '', minutes > 0 ? `${minutes} phút` : '']
    .filter(Boolean)
    .join(' ');
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return new NextResponse('Unauthorized', { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!url || !serviceKey || !publicKey || !privateKey || !subject) return NextResponse.json({ error: 'Push reminder env is incomplete.' }, { status: 503 });

  const now = new Date();
  const { date: localDate, time: localTime } = localParts(now);
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  await db.from('reminder_deliveries').delete().lt('local_date', localDate);
  const { data: settings, error: settingsError } = await db.from('reminder_settings').select('reminder_times').eq('id', 1).maybeSingle();
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 });
  const configuredTimes = new Set<string>(settings?.reminder_times ?? ['07:00']);
  const scheduledSlots = Array.from({ length: CATCH_UP_MINUTES }, (_, minutesAgo) => {
    const scheduledAt = new Date(now.getTime() - minutesAgo * 60_000);
    return localParts(scheduledAt);
  }).filter(slot => configuredTimes.has(slot.time));
  if (!scheduledSlots.length) return NextResponse.json({ sent: 0, skipped: true, localDate, localTime, reason: 'outside-reminder-window' });

  const { data: events, error: eventsError } = await db.from('events').select('id,title,starts_at').gt('starts_at', now.toISOString()).order('starts_at').limit(1);
  if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 });
  const event = (events ?? [])[0] as EventRow | undefined;
  if (!event) return NextResponse.json({ sent: 0, skipped: true, localDate, localTime, scheduledSlots, reason: 'no-upcoming-event' });
  const { data: subscriptions, error: subscriptionsError } = await db.from('push_subscriptions').select('id,endpoint,p256dh,auth');
  if (subscriptionsError) return NextResponse.json({ error: subscriptionsError.message }, { status: 500 });
  if (!subscriptions?.length) return NextResponse.json({ sent: 0, skipped: true, localDate, localTime, scheduledSlots, reason: 'no-push-subscriptions' });
  setVapidDetails(subject, publicKey, privateKey);
  const starts = new Date(event.starts_at);
  const remaining = formatTimeRemaining(starts, now);
  let sent = 0;
  const failures: string[] = [];
  for (const slot of scheduledSlots) {
    for (const raw of subscriptions) {
      const subscription = raw as SubscriptionRow;
      const claim = await db.from('reminder_deliveries').insert({ subscription_id: subscription.id, event_id: event.id, local_date: slot.date, reminder_time: slot.time }).select('id').maybeSingle();
      if (claim.error?.code === '23505') continue;
      if (claim.error || !claim.data) { failures.push('delivery-claim'); continue; }
      const payload = JSON.stringify({ title: 'Một ngày mình mong chờ ♡', body: `${event.title} — còn ${remaining} nữa`, url: '/#upcoming-events', tag: `event-${event.id}-${slot.date}-${slot.time}` });
      try {
        await sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload);
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) await db.from('push_subscriptions').delete().eq('id', subscription.id);
        await db.from('reminder_deliveries').delete().eq('id', claim.data.id);
        failures.push(String(statusCode ?? 'push-error'));
      }
    }
  }
  console.info('Planner reminder cron completed', { sent, failures: failures.length, subscriptions: subscriptions.length, scheduledSlots });
  return NextResponse.json({ sent, failures, subscriptions: subscriptions.length, localDate, localTime, scheduledSlots });
}
