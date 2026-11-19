# Quyền truy cập và bảo mật

## Cách bảo vệ dữ liệu

- Supabase Auth xác thực bằng một tài khoản email dùng chung trên các thiết bị. Email được cấu hình phía server và không hiện trên màn hình khóa.
- `@supabase/ssr` lưu/refresh phiên trong cookie. Middleware làm mới phiên; trang và API xác minh JWT bằng `auth.getClaims()`.
- Server chỉ tải dữ liệu sau khi xác minh user có dòng tương ứng trong `public.planner_members`.
- API CRUD chạy bằng phiên của người dùng, không dùng `service_role`; Postgres RLS tiếp tục kiểm tra membership cho mọi thao tác và realtime.
- Quyền `anon`/`public` trên các bảng planner bị thu hồi. Biết URL và anon key không đủ để đọc hay sửa dữ liệu.
- VAPID private key, `SUPABASE_SERVICE_ROLE_KEY` và `CRON_SECRET` là bí mật server-only; tuyệt đối không thêm tiền tố `NEXT_PUBLIC_`. Chỉ route cron dùng service role và phải xác thực bearer secret; API setting/subscription dùng user session + RLS. User chỉ có thể xóa subscription gắn với chính user id.
- Cấu hình reminder là một hàng toàn cục cho các thành viên planner; push endpoint/key lưu trong bảng riêng để server gửi đến từng thiết bị. Không ghi nội dung sự kiện nhạy cảm vào URL push.

## Thiết lập an toàn lần đầu

1. Tạo một user trong Supabase Dashboard → Authentication → Users bằng địa chỉ email sẽ điền vào `NEXT_PUBLIC_PLANNER_EMAIL`.
2. Đặt mật khẩu riêng, dài và khó đoán. Không dùng ngày sinh, năm sinh hay mã 4 số; câu hỏi dễ thương trên giao diện chỉ là lời nhắc, không phải yếu tố bảo mật.
3. Tắt đăng ký công khai nếu project không cần tính năng tạo tài khoản.
4. Chạy `supabase/schema.sql` để bật RLS và thu hồi các policy public cũ.
5. Trong SQL Editor, cấp membership cho đúng user:

   ```sql
   insert into public.planner_members (user_id)
   select id from auth.users where email = 'EMAIL_DA_TAO'
   on conflict (user_id) do nothing;
   ```

6. Cấu hình `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` và `NEXT_PUBLIC_PLANNER_EMAIL` ở `.env.local`/hosting rồi khởi động lại hoặc deploy lại.
7. Mở app, đăng nhập ở màn hình khóa và xác nhận hai thiết bị cùng tài khoản nhận được dữ liệu/realtime.

Nếu project đã từng dùng public CRUD, cần chạy schema mới trước khi phát hành ứng dụng mới; script xóa các policy public cũ và thu hồi quyền `anon`. Các bản ghi đang có vẫn được giữ nguyên.

## Giới hạn và vận hành

- Màn hình khóa là giao diện truy cập. Bảo vệ dữ liệu thực sự nằm ở server/API và RLS, nên gọi endpoint trực tiếp cũng cần session hợp lệ.
- Vì hai người dùng chung một tài khoản, Supabase không phân biệt hoạt động của từng người. Khi cần thu hồi một thiết bị, đổi mật khẩu/revoke sessions cho user dùng chung.
- Không đặt `service_role` trong source, trình duyệt, biến `NEXT_PUBLIC_*` hoặc Git.
- Bật MFA cho Auth user nếu muốn thêm lớp bảo vệ. Mật khẩu có thể được thay đổi trong Supabase Dashboard.
- Không nhập thông tin thanh toán hoặc dữ liệu nhạy cảm không cần thiết; duy trì backup database.
