import { NextResponse } from 'next/server';
import { sendNotification, setVapidDetails } from 'web-push';
import { requirePlannerMember } from '@/lib/planner-auth';

export const dynamic = 'force-dynamic';

type SubscriptionRow = { id: string; endpoint: string; p256dh: string; auth: string };

export async function POST(request: Request) {
  const access = await requirePlannerMember();
  if (access.status !== 200) return NextResponse.json({ error: 'Bạn cần đăng nhập để gửi thông báo thử.' }, { status: access.status });

  let body: { endpoint?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Thiết bị nhận thông báo không hợp lệ.' }, { status: 400 }); }
  if (typeof body.endpoint !== 'string' || body.endpoint.length > 2048) {
    return NextResponse.json({ error: 'Thiếu thiết bị nhận thông báo.' }, { status: 400 });
  }

  const { data, error } = await access.client!.from('push_subscriptions')
    .select('id,endpoint,p256dh,auth').eq('endpoint', body.endpoint).eq('user_id', access.userId).maybeSingle();
  if (error) return NextResponse.json({ error: 'Chưa đọc được đăng ký thông báo của thiết bị.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Thiết bị này chưa được đăng ký trên máy chủ. Hãy tắt rồi bật lại thông báo.' }, { status: 404 });

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return NextResponse.json({ error: 'Cấu hình VAPID trên máy chủ chưa đầy đủ.' }, { status: 503 });

  const subscription = data as SubscriptionRow;
  try {
    setVapidDetails(subject, publicKey, privateKey);
    await sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({
      title: 'Thông báo thử ♡',
      body: 'Thiết bị này đã nhận được Web Push từ planner.',
      url: '/#upcoming-events',
      tag: `planner-test-${Date.now()}`,
    }));
    return NextResponse.json({ ok: true, message: 'Đã gửi thông báo thử tới dịch vụ push. Nếu chưa thấy, kiểm tra quyền Notifications và Focus/Không làm phiền trên trình duyệt hoặc thiết bị.' });
  } catch (pushError) {
    const statusCode = (pushError as { statusCode?: number }).statusCode;
    const errorText = (pushError as { message?: string }).message ?? '';
    if (statusCode === 404 || statusCode === 410) {
      await access.client!.from('push_subscriptions').delete().eq('id', subscription.id).eq('user_id', access.userId);
    }
    const message = /vapid|public key|private key/i.test(errorText)
      ? 'Cặp VAPID trên máy chủ không hợp lệ hoặc không khớp. Kiểm tra public/private key trên Vercel.'
      : statusCode === 401 || statusCode === 403
      ? 'Push provider từ chối subscription. Hãy kiểm tra cặp VAPID trên Vercel rồi tắt/bật lại thông báo trên thiết bị này.'
      : `Gửi push thất bại${statusCode ? ` (HTTP ${statusCode})` : ''}. Kiểm tra log server để biết chi tiết.`;
    return NextResponse.json({ error: message, statusCode: statusCode ?? null }, { status: 502 });
  }
}
