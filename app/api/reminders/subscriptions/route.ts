import { NextResponse } from 'next/server';
import { isIP } from 'node:net';
import { requirePlannerMember } from '@/lib/planner-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const access = await requirePlannerMember();
  if (access.status !== 200) return NextResponse.json({ error: 'Bạn cần đăng nhập để bật thông báo.' }, { status: access.status });
  let body: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Đăng ký thông báo không hợp lệ.' }, { status: 400 }); }
  const { endpoint, keys } = body;
  let host = '';
  try { host = typeof endpoint === 'string' ? new URL(endpoint).hostname.toLowerCase() : ''; } catch {}
  const supportedPushHost = host === 'fcm.googleapis.com'
    || host.endsWith('.googleapis.com')
    || host.endsWith('.push.services.mozilla.com')
    || host.endsWith('.push.apple.com')
    || host.endsWith('.notify.windows.com');
  if (typeof endpoint !== 'string' || endpoint.length > 2048 || !endpoint.startsWith('https://') || isIP(host) || !supportedPushHost
    || typeof keys?.p256dh !== 'string' || keys.p256dh.length > 256 || typeof keys.auth !== 'string' || keys.auth.length > 128) {
    return NextResponse.json({ error: 'Trình duyệt chưa cung cấp đăng ký push hợp lệ.' }, { status: 400 });
  }
  const { error } = await access.client!.from('push_subscriptions').upsert({ user_id: access.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, updated_at: new Date().toISOString() }, { onConflict: 'endpoint' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const access = await requirePlannerMember();
  if (access.status !== 200) return NextResponse.json({ error: 'Bạn cần đăng nhập để tắt thông báo.' }, { status: access.status });
  let body: { endpoint?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Đăng ký thông báo không hợp lệ.' }, { status: 400 }); }
  if (typeof body.endpoint !== 'string') return NextResponse.json({ error: 'Thiếu thiết bị cần hủy.' }, { status: 400 });
  const { error } = await access.client!.from('push_subscriptions').delete().eq('endpoint', body.endpoint).eq('user_id', access.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
