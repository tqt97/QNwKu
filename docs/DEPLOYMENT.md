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

Không có env thì ứng dụng dùng nội dung demo. Để ghi dữ liệu, cần Supabase thật.

## Tạo database Supabase

1. Tạo project mới.
2. Mở SQL Editor và chạy `supabase/schema.sql`.
3. Kiểm tra Table Editor có ba bảng: `events`, `places`, `checklist_items`.
4. Lấy Project URL và anon/public key từ phần API settings.
5. Gán vào `.env.local`, rồi restart server:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
```

## Deploy Vercel

1. Push source lên GitHub.
2. Vercel → Add New → Project → import repo.
3. Framework preset chọn Next.js (thường tự nhận diện).
4. Khai báo hai biến môi trường Supabase cho Production; Preview/Development tùy cách dùng.
5. Deploy và mở URL để kiểm tra đọc dữ liệu.
6. Tạo một sự kiện thử; xác nhận nó xuất hiện trong Supabase Table Editor.

Khi sửa environment variables, tạo deployment mới để áp dụng giá trị mới.

## Lỗi thường gặp

- **Trang báo lỗi Supabase:** kiểm tra URL/key chính xác, không thừa dấu ngoặc kép hoặc khoảng trắng; restart local hoặc redeploy Vercel.
- **Fetch báo permission/RLS:** chạy schema SQL; xác nhận policies `public can ...` đã được tạo.
- **Không có bảng:** SQL chưa chạy hoặc chạy ở project Supabase khác.
- **Vercel build lỗi:** xem build log; chạy `npm run typecheck` và `npm run build` ở local trước.
- **Liên kết bản đồ lỗi:** cần URL đầy đủ bắt đầu bằng `https://`.

## Vận hành schema

Giữ migration/schema trong Git. Khi database đã có dữ liệu quan trọng, backup trước thay đổi cấu trúc; tạo migration mới, tránh xóa bảng để sửa schema.
