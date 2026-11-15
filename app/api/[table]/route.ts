import { NextResponse } from 'next/server';
import { requirePlannerMember } from '@/lib/planner-auth';

const allowed = new Set(['events', 'places', 'checklist_items']);
type Context = { params: Promise<{ table: string }> };

async function getTable(context: Context) {
  const { table } = await context.params;
  if (!allowed.has(table)) return null;
  return table;
}

export async function POST(request: Request, context: Context) {
  const access = await requirePlannerMember();
  if (access.status !== 200) return NextResponse.json({ error: access.status === 401 ? 'Hãy đăng nhập để tiếp tục.' : access.status === 403 ? 'Tài khoản không có quyền truy cập.' : 'Dịch vụ chưa được cấu hình.' }, { status: access.status });
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: 'Bảng dữ liệu không hợp lệ.' }, { status: 404 });
  const body = await request.json();
  const { id: _id, created_at: _createdAt, ...safeBody } = body;
  const { data, error } = await access.client!.from(table).insert(safeBody).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request, context: Context) {
  const access = await requirePlannerMember();
  if (access.status !== 200) return NextResponse.json({ error: access.status === 401 ? 'Hãy đăng nhập để tiếp tục.' : access.status === 403 ? 'Tài khoản không có quyền truy cập.' : 'Dịch vụ chưa được cấu hình.' }, { status: access.status });
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: 'Bảng dữ liệu không hợp lệ.' }, { status: 404 });
  const body = await request.json();
  const { id, created_at: _createdAt, ...changes } = body;
  if (!id) return NextResponse.json({ error: 'Thiếu id.' }, { status: 400 });
  const { data, error } = await access.client!.from(table).update(changes).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request, context: Context) {
  const access = await requirePlannerMember();
  if (access.status !== 200) return NextResponse.json({ error: access.status === 401 ? 'Hãy đăng nhập để tiếp tục.' : access.status === 403 ? 'Tài khoản không có quyền truy cập.' : 'Dịch vụ chưa được cấu hình.' }, { status: access.status });
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: 'Bảng dữ liệu không hợp lệ.' }, { status: 404 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Thiếu id.' }, { status: 400 });
  const { error } = await access.client!.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
