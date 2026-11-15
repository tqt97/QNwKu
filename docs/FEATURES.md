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
- Hàng sự kiện giữ tháng/ngày trong ô vuông cố định, hiển thị giờ và địa điểm gọn một dòng; menu dấu ba chấm mở thao tác sửa/xóa.
- Nếu không còn sự kiện trong tương lai, hiển thị sự kiện gần nhất đã qua; khi không có sự kiện, hiển thị lời mời tạo lịch hẹn.
- CRUD sự kiện qua modal. Xóa sự kiện đặt quan hệ địa điểm thành `null` và xóa checklist thuộc sự kiện bằng foreign key cascade.

## Feature 2 — Danh sách món/quán muốn thử

### Mục đích

Lưu nhanh tên món hoặc quán bằng một dòng text, rồi đánh dấu khi đã thử/ghé.

### Trường dữ liệu

- `name` — dòng text tên món hoặc quán, bắt buộc.
- `visited` — trạng thái đã thử/ghé, dùng như checkbox hoàn thành.
- Các cột `category`, `area`, `dish`, `map_url`, `event_id` tiếp tục được giữ trong database để bảo toàn dữ liệu đã lưu trước đây.

### Hành vi

- Trang chủ hiển thị một số mục đầu sau danh sách sự kiện và trước checklist chuẩn bị; tab địa điểm xem toàn bộ danh sách.
- Mỗi mục gồm checkbox, text và menu sửa/xóa; form chỉ yêu cầu một dòng text.
- Menu dấu ba chấm tự đóng khi chạm bên ngoài hoặc nhấn Escape.
- Heading khu vực là “Chỗ xinh mình muốn ghé”; trạng thái trống chiếm hết chiều rộng danh sách.
- Các bản ghi cũ vẫn hiển thị theo tên và giữ dữ liệu chi tiết cũ khi chỉ sửa tên.

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
- Mobile: nội dung một cột, thanh điều hướng cố định dưới màn hình, danh sách món/quán dạng checklist.
- Ở màn hình rộng đến 760px, giao diện chuyển sang một cột để tránh sidebar làm chật vùng nội dung; hero cho phép nút hành động xuống dòng trên màn hình rất hẹp.
- Nút dưới cùng luôn là “Thêm mới”, mở bộ chọn Sự kiện / Chuẩn bị / Lưu lại rồi mới mở form tương ứng.
- Nút thêm ở đầu mỗi danh sách có accessible name; nhãn hiển thị cạnh biểu tượng trên mobile khi đủ chỗ và thu gọn ở màn hình rất hẹp.
- Thao tác sửa/xóa món/quán và sự kiện nằm trong menu dấu ba chấm; menu tự đóng khi chạm ngoài hoặc nhấn Escape.
- Nút mở menu địa điểm có vùng chạm tối thiểu 44px; input form trên mobile giữ cỡ 16px để tránh tự phóng to khi focus trên iOS.
- Các nút icon, checkbox, xóa và CTA có vùng chạm tối thiểu 44×44px mà vẫn giữ icon nhỏ gọn.
- Mobile bỏ khối chào lặp lại và chỉ giữ nút cộng dạng icon ở đầu danh sách; tagline chuyển thành “Lên kèo đi chơi thôi ♡”.
- Bỏ eyebrow tiếng Anh “A LITTLE PLACE FOR US” để phần giới thiệu gọn hơn.
- Icon lấp lánh trên topbar có animation nhẹ và tắt khi thiết bị bật reduced motion.
- Hero dùng mũi tên xuống có nhãn truy cập để cuộn tới danh sách dịp sắp tới.
- Metadata sự kiện giữ giờ và địa điểm trên một dòng; nếu thiếu chỗ, phần địa điểm rút gọn bằng dấu ba chấm.
- Tên sự kiện là nút sửa có accessible name, thao tác được bằng Tab/Enter; nút xóa là điều khiển riêng.
- Màu chính: nền hồng kem `#fffafb`, hồng dâu và lavender đậm hơn nhẹ, mint; chữ nâu tím giữ độ tương phản.
- Form dùng input lớn trên mobile để thuận tiện thao tác.
- Thanh cuộn dùng kiểu mảnh, màu hồng xám nhẹ trên trình duyệt hỗ trợ tùy chỉnh.
- Typography dùng font hệ thống cục bộ cho nội dung và heading, tránh phụ thuộc vào request Google Fonts; ưu tiên system UI và serif hệ thống trên iOS, Android, Windows và macOS. Cỡ chữ nội dung, từng cấp heading, màu chữ và khoảng cách dùng design tokens chung; chữ phụ thường từ 12px trở lên, màu chữ đạt tương phản rõ trên nền sáng.
- Ghi chú header tiếp tục ẩn trên mobile để nhường chỗ cho tên web; trạng thái checklist và món muốn thử dùng màu chữ đủ đậm.
- Trích dẫn ở cột giới thiệu dùng cùng màu chữ phụ có tương phản cao.

## Quy tắc nghiệp vụ và giới hạn

- Một sự kiện có thể liên kết nhiều địa điểm và checklist.
- Địa điểm không bắt buộc gắn sự kiện.
- Checklist không bắt buộc gắn sự kiện.
- Bản hiện tại không lọc/sắp xếp địa điểm, chưa có tìm kiếm, ảnh tải lên, nhắc lịch, offline mode hoặc xác thực.
- Không có chống spam/rate limit cho CRUD public.

## Tiêu chí nghiệm thu thủ công

1. Trang hiển thị countdown đúng với giờ sự kiện trên thiết bị.
2. Tạo/sửa/xóa sự kiện cập nhật danh sách và countdown.
3. Lưu/sửa/xóa món hoặc quán; checkbox đã thử lưu đúng trạng thái.
4. Checklist đánh dấu xong và tiến độ thay đổi.
5. Giao diện dùng được trên khung màn hình điện thoại và desktop.
