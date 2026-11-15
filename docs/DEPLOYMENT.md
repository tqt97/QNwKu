# Cấu hình và triển khai

## Yêu cầu

- Node.js 20.9+.
- Tài khoản Supabase và Vercel.
- Repository Git để Vercel import.

## Cài local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ứng dụng yêu cầu Supabase và tài khoản planner để mở nội dung. Khi thiếu cấu hình, chỉ hiện trang hướng dẫn kết nối.

## Tạo database Supabase

1. Tạo project mới.
2. Mở SQL Editor và chạy `supabase/schema.sql`.
3. Kiểm tra Table Editor có bốn bảng: `events`, `places`, `checklist_items`, `planner_members`.
   Script cũng thêm ba bảng vào publication `supabase_realtime` để danh sách tự cập nhật khi có thay đổi từ thiết bị khác. Nếu database đã chạy schema cũ, chạy lại phần publication trong `supabase/schema.sql` hoặc bật replication cho ba bảng trong Database → Publications.
4. Trong Authentication → Users, tạo user email dùng chung; đặt mật khẩu riêng dài, khó đoán. Không dùng ngày sinh hay mã 4 số. Tắt signups công khai nếu không cần.
5. Cấp membership trong SQL Editor (thay email):

   ```sql
   insert into public.planner_members (user_id)
   select id from auth.users where email = 'EMAIL_DA_TAO'
   on conflict (user_id) do nothing;
   ```

6. Lấy Project URL và anon/public key từ phần API settings.
7. Gán ba biến vào `.env.local`, rồi restart server:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
NEXT_PUBLIC_PLANNER_EMAIL=EMAIL_DA_TAO
```

## Deploy Vercel

1. Push source lên GitHub.
2. Vercel → Add New → Project → import repo.
3. Framework preset chọn Next.js (thường tự nhận diện).
4. Khai báo ba biến môi trường Supabase cho Production; Preview/Development tùy cách dùng.
5. Deploy và đăng nhập ở màn hình khóa.
6. Tạo sự kiện thử; xác nhận nó xuất hiện trong Table Editor và đồng bộ sang thiết bị khác.

Khi sửa environment variables, tạo deployment mới để áp dụng giá trị mới.

## Lỗi thường gặp

- **Trang báo lỗi Supabase:** kiểm tra URL/key chính xác, không thừa dấu ngoặc kép hoặc khoảng trắng; restart local hoặc redeploy Vercel.
- **Không mở được khóa:** kiểm tra email khớp với `NEXT_PUBLIC_PLANNER_EMAIL`, mật khẩu Auth và membership.
- **Fetch báo permission/RLS:** chạy schema SQL mới, kiểm tra membership; policy public cũ phải được gỡ.
- **Không có bảng:** SQL chưa chạy hoặc chạy ở project Supabase khác.
- **Vercel build lỗi:** xem build log; chạy `npm run typecheck` và `npm run build` ở local trước.
- **Liên kết bản đồ lỗi:** cần URL đầy đủ bắt đầu bằng `https://`.

## Vận hành schema

Giữ migration/schema trong Git. Khi database đã có dữ liệu quan trọng, backup trước thay đổi cấu trúc; tạo migration mới, tránh xóa bảng để sửa schema.
