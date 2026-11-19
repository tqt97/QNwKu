import { NextResponse } from 'next/server';
import { requirePlannerMember } from '@/lib/planner-auth';

export const dynamic = 'force-dynamic';
const DEFAULT_TIMES = ['07:00'];
const validTime = (value: unknown): value is string => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export async function GET() {
  const access = await requirePlannerMember();
  if (access.status !== 200) return NextResponse.json({ error: 'Bạn cần đăng nhập để xem cài đặt.' }, { status: access.status });
  const { data, error } = await access.client!.from('reminder_settings').select('reminder_times').eq('id', 1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reminder_times: data?.reminder_times ?? DEFAULT_TIMES, timezone: 'Asia/Ho_Chi_Minh' });
}

export async function PUT(request: Request) {
  const access = await requirePlannerMember();
  if (access.status !== 200) return NextResponse.json({ error: 'Bạn cần đăng nhập để đổi cài đặt.' }, { status: access.status });
  let body: { reminder_times?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }
  const times = body.reminder_times;
  if (!Array.isArray(times) || times.length > 8 || !times.every(validTime) || new Set(times).size !== times.length) {
    return NextResponse.json({ error: 'Chọn tối đa 8 khung giờ khác nhau theo dạng HH:mm.' }, { status: 400 });
  }
  const reminder_times = [...times].sort();
  const { data, error } = await access.client!.from('reminder_settings').upsert({ id: 1, reminder_times, updated_at: new Date().toISOString() }).select('reminder_times').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reminder_times: data.reminder_times, timezone: 'Asia/Ho_Chi_Minh' });
}
