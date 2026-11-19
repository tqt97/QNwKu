# Hướng dẫn cài đặt và cấu hình

Tài liệu này hướng dẫn chạy planner local hoặc triển khai lên Vercel, bao gồm cách lấy từng giá trị cấu hình. Không gửi key bí mật qua chat/email và không commit vào Git.

## 1. Chuẩn bị

- Node.js 20.9 trở lên và npm.
- Tài khoản Supabase để lưu dữ liệu và đăng nhập.
- Tài khoản Vercel nếu muốn triển khai và chạy nhắc lịch tự động.
- Repository Git để kết nối Vercel.

## 2. Tạo project và schema Supabase

1. Trong [Supabase Dashboard](https://supabase.com/dashboard), chọn **New project**, đặt tên, chọn region gần người dùng và tạo database password. Lưu password vào password manager; ứng dụng không dùng giá trị này.
2. Mở project → **SQL Editor → New query**.
3. Dán toàn bộ nội dung [`../supabase/schema.sql`](../supabase/schema.sql) và chọn **Run**. Script tạo bảng planner/reminder, RLS và publication Realtime. Có thể chạy lại để cập nhật schema; nên backup trước khi áp dụng lên database có dữ liệu quan trọng.
4. Trong **Table Editor**, xác nhận có `events`, `places`, `checklist_items`, `planner_members`, `reminder_settings`, `push_subscriptions` và `reminder_deliveries`.

## 3. Tạo tài khoản planner

1. Mở **Authentication → Users → Add user → Create new user**.
2. Nhập email dùng chung trên các thiết bị và đặt mật khẩu mạnh. Ghi lại email chính xác.
3. Nếu có lựa chọn **Auto Confirm User**, bật lựa chọn đó cho tài khoản planner.
4. Trong **SQL Editor**, thay `EMAIL_DA_TAO` bằng email vừa tạo và chạy:

   ```sql
   insert into public.planner_members (user_id)
   select id from auth.users where email = 'EMAIL_DA_TAO'
   on conflict (user_id) do nothing;
   ```

5. Tắt đăng ký tài khoản công khai trong Authentication settings nếu project không cần thêm user.

## 4. Lấy Supabase URL và key

Trong Dashboard, mở project → **Connect** để sao chép Project URL và public/publishable key. Có thể mở **Project Settings → API Keys** để xem các key. Supabase đang chuyển tên key cũ sang tên mới; với code hiện tại:

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL dạng `https://PROJECT_REF.supabase.co`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: dùng key **anon/public** kiểu cũ hoặc **publishable** (`sb_publishable_...`). Đây là key công khai, dùng cùng Auth và RLS; không phải mật khẩu.
- `NEXT_PUBLIC_PLANNER_EMAIL`: email user đã tạo và thêm vào `planner_members`.
- `SUPABASE_SERVICE_ROLE_KEY`: lấy **service_role** key cũ trong **Project Settings → API Keys → Legacy anon, service_role API keys**. Chỉ dùng trên server cho cron; key này vượt RLS. Không đặt tiền tố `NEXT_PUBLIC_`.

Nếu project không còn hiển thị legacy `service_role` key, tạo/giữ key tương thích trong API Keys theo hướng dẫn Supabase. Không thay bằng anon/publishable key vì cron cần đọc/xóa delivery và đọc subscriptions.

## 5. Tạo VAPID keys cho Web Push

Trong thư mục dự án chạy:

```bash
npx web-push generate-vapid-keys
```

Lệnh in ra `Public Key` và `Private Key`. Tạo cặp một lần cho môi trường ứng dụng và lưu an toàn:

- Public key → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- Private key → `VAPID_PRIVATE_KEY` (server-only).
- `VAPID_SUBJECT` → địa chỉ liên hệ dạng `mailto:you@example.com`.

Không tạo cặp mới mỗi lần deploy. Nếu phải xoay key, thiết bị đã đăng ký bằng key cũ cần đăng ký lại.

## 6. Tạo CRON_SECRET

Tạo chuỗi ngẫu nhiên dài bằng Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Lưu kết quả vào `CRON_SECRET`. Vercel gửi giá trị này trong header `Authorization: Bearer ...`; không dùng lại mật khẩu đăng nhập.

## 7. Cấu hình local

Tạo `.env.local` từ file mẫu (PowerShell):

```powershell
Copy-Item .env.example .env.local
```

Điền các giá trị sau, không thêm dấu nháy nếu không cần:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_OR_PUBLISHABLE_KEY
NEXT_PUBLIC_PLANNER_EMAIL=EMAIL_DA_TAO
NEXT_PUBLIC_VAPID_PUBLIC_KEY=VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:you@example.com
SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET=CHUOI_NGAU_NHIEN_DA_TAO
```

Chạy ứng dụng:

```bash
npm install
npm run dev
```

Mở `http://localhost:3000` và đăng nhập bằng email/mật khẩu Supabase. Localhost được hỗ trợ để thử service worker/push. `npm run dev` không tự chạy lịch; nhắc lịch định kỳ cần Vercel Production Schedules hoặc scheduler ngoài gọi `GET /api/cron/reminders` kèm Bearer secret.

## 8. Cấu hình Vercel

1. Đẩy repository lên GitHub, vào Vercel → **Add New → Project**, import repository và dùng Framework Preset **Next.js**.
2. Vào **Settings → Environment Variables**. Tạo đủ tám biến ở trên cho **Production**. Bật tùy chọn expose System Environment Variables để app nhận `VERCEL_DEPLOYMENT_ID` và phát hiện bản PWA mới. Thêm Preview/Development nếu cần; nên dùng project/key riêng cho môi trường thử.
3. Đảm bảo `CRON_SECRET` có trong Production. [`vercel.json`](../vercel.json) khai báo schedule `planner-reminders`, gọi `/api/cron/reminders` bằng GET mỗi 15 phút; route yêu cầu Bearer secret và dùng service role ở server.
4. Deploy Production. Schedule chạy trên deployment Production. Deployment ID của Vercel cũng được dùng để phát hiện bản PWA mới; với hosting khác, đặt `NEXT_PUBLIC_APP_VERSION` bằng commit/release ID mới ở mỗi lần deploy. Hobby chạy schedule với jitter 15 phút; worker bắt kịp khung giờ trong 30 phút gần nhất nên nhắc có thể đến trễ khoảng 30 phút. Pro/Enterprise có thể đổi schedule thành mỗi phút (jitter mặc định 1 phút) để nhận nhắc gần giờ đã chọn. Xem [giới hạn Vercel Schedules](https://vercel.com/docs/schedules/limits).
5. Sau khi đổi environment variables, tạo deployment mới để áp dụng giá trị mới.

## 9. Bật PWA và kiểm tra nhắc lịch

1. Mở site HTTPS và đăng nhập.
2. Mở **Nhắc lịch**, đặt một khung giờ gần hiện tại. Giờ nhắc dùng chung; push subscription riêng trên từng thiết bị.
3. Cho phép Notifications, nhấn **Bật thông báo**. Lặp lại trên mỗi thiết bị cần nhận push.
4. Nhấn **Gửi thử** ngay trong mục nhắc lịch để xác nhận subscription, VAPID và quyền hiển thị notification trên thiết bị.
5. Tạo một sự kiện tương lai và chờ khung giờ đã đặt. Nếu gửi thử thành công nhưng nhắc lịch không tới, kiểm tra Vercel Schedules/execution logs, `CRON_SECRET`, sự kiện tương lai và giờ nhắc. Trên Hobby, schedule có thể chạy trễ trong cửa sổ 15 phút; worker bắt kịp các khung giờ trong 30 phút gần nhất.
6. Trên iPhone/iPad, dùng Safari → **Chia sẻ → Thêm vào Màn hình chính**, mở biểu tượng vừa cài rồi bật push.

Push chỉ gửi khi có sự kiện tương lai gần nhất. Không có sự kiện tương lai thì cron bỏ qua lượt đó. Planner vẫn cần mạng để tải, đăng nhập và đồng bộ; PWA không hỗ trợ thao tác offline.

## Bảng biến môi trường

| Tên | Nơi sử dụng | Nguồn / mục đích |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | anon/public hoặc publishable key; RLS kiểm soát quyền dữ liệu |
| `NEXT_PUBLIC_PLANNER_EMAIL` | Public config | Email user planner được cấp membership |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Browser | Public key tạo bởi web-push |
| `VAPID_PRIVATE_KEY` | Server only | Private key tương ứng; giữ bí mật |
| `VAPID_SUBJECT` | Server only | Địa chỉ liên hệ dạng `mailto:` |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron server only | Legacy service_role; vượt RLS |
| `CRON_SECRET` | Cron server only | Bí mật bảo vệ route cron |

## Tài liệu liên quan

- [Hướng dẫn deploy và xử lý lỗi](DEPLOYMENT.md)
- [Bảo mật và quyền truy cập](SECURITY.md)
- [Kiến trúc](ARCHITECTURE.md)
- [Tính năng](FEATURES.md)
- [Hướng dẫn sử dụng](USER_GUIDE.md)
