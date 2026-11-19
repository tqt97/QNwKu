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
2. Mở SQL Editor và chạy `supabase/schema.sql` (khi nâng cấp project hiện có, chạy lại script để tạo các bảng PWA; script giữ nguyên dữ liệu cũ).
3. Trong Table Editor, kiểm tra có các bảng `events`, `places`, `checklist_items`, `planner_members`, `reminder_settings`, `push_subscriptions` và `reminder_deliveries`. Các bảng cần đồng bộ được thêm vào publication `supabase_realtime`.
4. Trong Authentication → Users, tạo user email dùng chung; đặt mật khẩu riêng dài, khó đoán. Không dùng ngày sinh hay mã 4 số. Tắt signups công khai nếu không cần.
5. Cấp membership trong SQL Editor (thay email):

   ```sql
   insert into public.planner_members (user_id)
   select id from auth.users where email = 'EMAIL_DA_TAO'
   on conflict (user_id) do nothing;
   ```

6. Lấy Project URL và anon/public key từ phần API settings.
7. Gán các biến vào `.env.local`, rồi restart server:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
NEXT_PUBLIC_PLANNER_EMAIL=EMAIL_DA_TAO
NEXT_PUBLIC_VAPID_PUBLIC_KEY=VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:EMAIL_LIEN_HE
SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_KEY
CRON_SECRET=CHUOI_BI_MAT_DAI_NGAU_NHIEN
```

Tạo cặp VAPID bằng `npx web-push generate-vapid-keys`; đặt public key ở biến `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, private key chỉ ở server. Lấy service role key từ Supabase API settings và **không** đặt prefix `NEXT_PUBLIC_`. `CRON_SECRET` phải là chuỗi bí mật ngẫu nhiên; Vercel dùng nó để gửi header xác thực cron.

## Deploy Vercel

1. Push source lên GitHub.
2. Vercel → Add New → Project → import repo.
3. Framework preset chọn Next.js (thường tự nhận diện).
4. Khai báo đủ biến môi trường theo [hướng dẫn cài đặt](INSTALLATION.md) cho Production; thêm Preview/Development nếu cần.
5. Deploy và đăng nhập ở màn hình khóa.
6. Tạo sự kiện thử; xác nhận nó xuất hiện trong Table Editor và đồng bộ sang thiết bị khác.
7. Deploy Production để Vercel đăng ký schedule `planner-reminders` từ `vercel.json`; cài PWA và bật thông báo riêng trên từng thiết bị.
8. Thử khung giờ gần hiện tại với một sự kiện tương lai, rồi kiểm tra log function và push trên thiết bị; kiểm tra lượt không gửi khi không có sự kiện tương lai.

**Độ chính xác scheduler:** repo dùng Vercel Schedules (thay cho cấu hình Cron Jobs legacy) để gọi `GET /api/cron/reminders` mỗi phút. Schedules Pro/Enterprise hỗ trợ mỗi phút với jitter mặc định 1 phút; Hobby tối thiểu 15 phút và có jitter 15 phút, không đủ chính xác cho các giờ nhắc tùy chọn của app. Nếu project dùng Hobby, cần nâng plan hoặc chuyển endpoint sang scheduler ngoài có độ chính xác tương đương. Xem [giới hạn Vercel Schedules](https://vercel.com/docs/schedules/limits) và [hướng dẫn migrate](https://vercel.com/docs/schedules/migrate-from-cron-jobs).

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
