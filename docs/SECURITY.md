# Quyền truy cập và bảo mật

## Trạng thái MVP

Ứng dụng hiện không có authentication. Schema cố ý cấp `SELECT`, `INSERT`, `UPDATE`, `DELETE` cho role `anon` và `authenticated` trên ba bảng. Điều này cho phép public CRUD như yêu cầu, đồng thời có nghĩa bất cứ ai truy cập website hoặc gọi API trực tiếp đều có thể sửa/xóa nội dung.

## Những điều cần nhớ

- Không lưu thông tin nhạy cảm, thông tin thanh toán, địa chỉ riêng hoặc dữ liệu cá nhân nhạy cảm.
- Supabase anon key là khóa client-side, không phải bí mật; RLS policy public mới là quyền thực tế.
- Không đưa `service_role` key vào source, client bundle, Git hoặc `NEXT_PUBLIC_*`.
- Public endpoint có thể bị spam hoặc xóa dữ liệu; bản hiện tại chưa có rate limit, CAPTCHA hay audit log.
- Sao lưu database nếu dữ liệu bắt đầu có giá trị.

## Kế hoạch khi thêm đăng nhập

1. Chọn cơ chế auth và mời hai người dùng.
2. Tạo `spaces` và `space_members` hoặc cách biểu diễn membership tương đương.
3. Thêm `space_id` vào events/places/checklist_items; backfill dữ liệu cũ.
4. Bật RLS theo `auth.uid()` và membership.
5. Bỏ quyền `anon` cho insert/update/delete; xác minh truy cập bằng user hợp lệ và user ngoài không gian.
6. Chỉ sau khi chính sách mới được kiểm tra, loại bỏ policies public.

Thực hiện chuyển đổi bằng migration có kế hoạch để tránh public CRUD tồn tại ngoài ý muốn sau khi bật đăng nhập.
