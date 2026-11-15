import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const allowed = new Set(['events', 'places', 'checklist_items']);
type Context = { params: Promise<{ table: string }> };

async function getTable(context: Context) {
  const { table } = await context.params;
  if (!allowed.has(table)) return null;
  return table;
}

export async function POST(request: Request, context: Context) {
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: 'Bảng dữ liệu không hợp lệ.' }, { status: 404 });
  if (!supabase) return NextResponse.json({ error: 'Chưa cấu hình Supabase. Hãy thêm biến môi trường và chạy SQL khởi tạo.' }, { status: 503 });
  const body = await request.json();
  const { id: _id, created_at: _createdAt, ...safeBody } = body;
  const { data, error } = await supabase.from(table).insert(safeBody).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request, context: Context) {
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: 'Bảng dữ liệu không hợp lệ.' }, { status: 404 });
  if (!supabase) return NextResponse.json({ error: 'Chưa cấu hình Supabase.' }, { status: 503 });
  const body = await request.json();
  const { id, created_at: _createdAt, ...changes } = body;
  if (!id) return NextResponse.json({ error: 'Thiếu id.' }, { status: 400 });
  const { data, error } = await supabase.from(table).update(changes).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request, context: Context) {
  const table = await getTable(context);
  if (!table) return NextResponse.json({ error: 'Bảng dữ liệu không hợp lệ.' }, { status: 404 });
  if (!supabase) return NextResponse.json({ error: 'Chưa cấu hình Supabase.' }, { status: 503 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Thiếu id.' }, { status: 400 });
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
