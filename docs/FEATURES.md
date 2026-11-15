# Đặc tả tính năng

## Mục tiêu sản phẩm

Một web riêng để hai người cùng ghi nhớ ngày gặp, lưu các địa điểm muốn thử và chuẩn bị cho sự kiện. MVP ưu tiên dùng nhanh trên điện thoại, thao tác rõ ràng, không cần tài khoản và public CRUD theo yêu cầu hiện tại.

## Người dùng và quyền hiện tại

- Khách truy cập: xem, tạo, sửa và xóa mọi dữ liệu.
- Không có tài khoản, vai trò hay dữ liệu riêng tư trong phiên bản này.
- Mọi nội dung được coi là công khai; không nhập thông tin nhạy cảm.

## Feature 1 — Countdown và sự kiện

### Mục đích

Giúp người dùng thấy ngay sự kiện gần nhất và thời gian còn lại.

### Trường dữ liệu

- `title` — tên sự kiện, bắt buộc.
- `starts_at` — thời điểm sự kiện, bắt buộc, lưu theo `timestamptz`.
- `location` — địa điểm dạng text, tùy chọn.
- `note` — ghi chú/lời nhắn, tùy chọn.
- `accent` — màu nhận diện giao diện, mặc định `pink`.

### Hành vi

- Trang chủ chọn sự kiện có `starts_at` gần nhất nhưng chưa qua.
- Bộ đếm hiển thị ngày, giờ, phút và giây.
- Nếu không còn sự kiện trong tương lai, hiển thị sự kiện gần nhất đã qua; khi không có sự kiện, hiển thị lời mời tạo lịch hẹn.
- CRUD sự kiện qua modal. Xóa sự kiện đặt quan hệ địa điểm thành `null` và xóa checklist thuộc sự kiện bằng foreign key cascade.

## Feature 2 — Danh sách địa điểm

### Mục đích

Lưu quán ăn, quán nước, món muốn thử và link chỉ đường.

### Trường dữ liệu

- `name` — tên địa điểm, bắt buộc.
- `category` — loại hình, mặc định `Ăn uống`.
- `area` — khu vực.
- `dish` — món muốn thử.
- `map_url` — URL bản đồ.
- `event_id` — sự kiện liên quan, tùy chọn.
- `visited` — trạng thái đã ghé, hiện lưu sẵn để mở rộng.

### Hành vi

- Trang chủ hiển thị một số địa điểm đầu; tab địa điểm xem danh sách.
- Heading của khu vực địa điểm là “Chỗ xinh mình muốn ghé” ở cả trang chủ và tab địa điểm. Khi danh sách trống, lời nhắc trải hết chiều rộng lưới card.
- Từ card có thể chỉnh sửa, xóa hoặc mở Google Maps ở tab mới.
- Có thể gắn địa điểm vào một sự kiện. Xóa sự kiện sẽ bỏ liên kết nhưng giữ địa điểm.

## Feature 3 — Checklist chuẩn bị

### Mục đích

Theo dõi vật dụng/việc cần làm trước sự kiện.

### Trường dữ liệu

- `title` — nội dung checklist, bắt buộc.
- `event_id` — sự kiện liên quan; `null` nghĩa là việc chung.
- `done` — trạng thái hoàn thành, mặc định `false`.

### Hành vi

- Trang chủ ưu tiên hiển thị checklist của sự kiện gần nhất.
- Checkbox cập nhật trạng thái ngay và gọi API lưu thay đổi; nếu lưu lỗi, giao diện hoàn tác.
- Tiến độ hiển thị số mục đã xong trên tổng số mục.
- Có thể sửa/xóa từng mục.

## Feature 4 — Giao diện responsive

- Desktop: cột giới thiệu, vùng nội dung rộng, card nhiều cột.
- Mobile: nội dung một cột, thanh điều hướng cố định dưới màn hình, card địa điểm hai cột.
- Nút thêm trên thanh điều hướng mobile mở form địa điểm khi đang ở tab địa điểm; ở các tab còn lại mở form sự kiện.
- Nút thêm ở đầu mỗi danh sách có accessible name; nhãn hiển thị cạnh biểu tượng trên mobile khi đủ chỗ và thu gọn ở màn hình rất hẹp.
- Thao tác sửa/xóa địa điểm nằm trong menu mở bằng nút ba chấm luôn hiển thị; nút và liên kết có focus ring rõ khi dùng bàn phím.
- Metadata sự kiện tách giờ và địa điểm thành hai mục; trên mobile hiển thị thành hai dòng để tránh cắt mất địa điểm.
- Màu chính: nền hồng kem `#fffafb`, hồng dâu, lavender, mint; chữ nâu tím.
- Form dùng input lớn trên mobile để thuận tiện thao tác.
- Thanh cuộn dùng kiểu mảnh, màu hồng xám nhẹ trên trình duyệt hỗ trợ tùy chỉnh.
- Typography dùng font hệ thống cục bộ cho nội dung và heading, tránh phụ thuộc vào request Google Fonts; ưu tiên system UI trên iOS, Android, Windows và macOS. Cỡ chữ, màu chữ, heading và khoảng cách dùng design tokens chung; chữ phụ thường từ 12px trở lên, màu chữ đạt tương phản rõ trên nền sáng.

## Quy tắc nghiệp vụ và giới hạn

- Một sự kiện có thể liên kết nhiều địa điểm và checklist.
- Địa điểm không bắt buộc gắn sự kiện.
- Checklist không bắt buộc gắn sự kiện.
- Bản hiện tại không lọc/sắp xếp địa điểm, chưa có tìm kiếm, ảnh tải lên, nhắc lịch, offline mode hoặc xác thực.
- Không có chống spam/rate limit cho CRUD public.

## Tiêu chí nghiệm thu thủ công

1. Trang hiển thị countdown đúng với giờ sự kiện trên thiết bị.
2. Tạo/sửa/xóa sự kiện cập nhật danh sách và countdown.
3. Tạo/sửa/xóa địa điểm, liên kết sự kiện, link map hoạt động.
4. Checklist đánh dấu xong và tiến độ thay đổi.
5. Giao diện dùng được trên khung màn hình điện thoại và desktop.
