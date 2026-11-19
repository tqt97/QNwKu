# Đặc tả tính năng

## Mục tiêu sản phẩm

Một web riêng để hai người cùng ghi nhớ ngày gặp, lưu các địa điểm muốn thử và chuẩn bị cho sự kiện. MVP dùng nhanh trên điện thoại, khóa bằng Supabase Auth và giới hạn dữ liệu bằng membership/RLS.

## Người dùng và quyền hiện tại

- Hai người dùng chung một tài khoản Supabase Auth được thêm vào `planner_members`.
- Khách chưa đăng nhập hoặc không có membership không nhận planner data.
- Server page/API xác minh claims và membership; RLS kiểm soát quyền ở database.

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

- Trang chủ chọn sự kiện có `starts_at` gần nhất nhưng chưa qua; danh sách chỉ hiện lịch sắp tới theo thứ tự thời gian. Tab Sự kiện hiển thị toàn bộ lịch theo thứ tự.
- Bộ đếm hiển thị ngày, giờ, phút và giây.
- Ngày giờ nhập và hiển thị theo múi giờ ứng dụng `Asia/Ho_Chi_Minh`; thời điểm SSR được gửi xuống để countdown khớp trong lần hydrate đầu.
- Hàng sự kiện giữ tháng/ngày trong ô vuông cố định, hiển thị giờ và địa điểm gọn một dòng; menu dấu ba chấm dùng cùng kiểu dọc như danh sách món/quán để mở thao tác sửa/xóa.
- Nếu không còn sự kiện trong tương lai, hiển thị sự kiện gần nhất đã qua; khi không có sự kiện, hiển thị lời mời tạo lịch hẹn.
- CRUD sự kiện qua modal. Xóa sự kiện đặt quan hệ địa điểm thành `null` và xóa checklist thuộc sự kiện bằng foreign key cascade.
- Thay đổi INSERT/UPDATE/DELETE từ thiết bị khác được đồng bộ trực tiếp qua Supabase Realtime; khi kết nối lại, ứng dụng tải lại snapshot để bắt kịp thay đổi bị lỡ.

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

- Trang chủ ưu tiên hiển thị checklist của sự kiện gần nhất cùng các việc chung không gắn sự kiện.
- Checkbox cập nhật trạng thái ngay và gọi API lưu thay đổi; nếu request lỗi hoặc mất mạng, giao diện hoàn tác và báo trạng thái.
- Sửa nội dung checklist giữ nguyên trạng thái hoàn thành; xóa lịch hẹn cảnh báo trước về các checklist liên quan sẽ bị xóa theo.
- Tiến độ hiển thị số mục đã xong trên tổng số mục.
- Có thể sửa/xóa từng mục.

## Feature 4 — Giao diện responsive

- Desktop: cột giới thiệu, vùng nội dung rộng, card nhiều cột.
- Mobile: nội dung một cột, thanh điều hướng cố định dưới màn hình, danh sách món/quán dạng checklist.
- Ở màn hình rộng đến 760px, giao diện chuyển sang một cột để tránh sidebar làm chật vùng nội dung; hero cho phép nút hành động xuống dòng trên màn hình rất hẹp.
- Nút dưới cùng luôn là “Thêm mới”, mở bộ chọn Sự kiện / Chuẩn bị / Lưu lại rồi mới mở form tương ứng.
- Dialog hỗ trợ Escape để đóng, giữ Tab trong modal và trả focus về nút mở; mobile có heading cấp một hiển thị.
- Nút thêm ở đầu mỗi danh sách có accessible name; nhãn hiển thị cạnh biểu tượng trên mobile khi đủ chỗ và thu gọn ở màn hình rất hẹp.
- Thao tác sửa/xóa món/quán và sự kiện nằm trong menu dấu ba chấm; menu tự đóng khi chạm ngoài hoặc nhấn Escape.
- Nút mở menu địa điểm có vùng chạm tối thiểu 44px; input form trên mobile giữ cỡ 16px để tránh tự phóng to khi focus trên iOS.
- Các nút icon, checkbox, xóa và CTA có vùng chạm tối thiểu 44×44px mà vẫn giữ icon nhỏ gọn.
- Mobile bỏ khối chào lặp lại và chỉ giữ nút cộng dạng icon ở đầu danh sách; topbar chỉ giữ tên web, không hiển thị tagline.
- Chữ “KU” được tô điểm trong tên thương hiệu; trái tim logo có nhịp đập nhẹ và tắt animation khi bật reduced motion.
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

## Feature 5 — PWA và nhắc lịch push

### Mục đích

Cài planner lên màn hình chính để mở nhanh và nhận push nhắc các sự kiện đang chờ.

### Cài đặt chung

- Ứng dụng cung cấp Web App Manifest, biểu tượng và service worker; trang cần HTTPS (localhost dùng được khi phát triển).
- Android cần trình duyệt hỗ trợ Push API và quyền Notifications. iPhone/iPad cần iOS/iPadOS 16.4 trở lên, cài web app lên Màn hình chính, rồi bấm bật thông báo ngay trong app đã cài.
- Icon có bản thường cho nền tảng phổ thông và bản maskable riêng với hình chính nằm trong vùng an toàn; Apple touch icon riêng dùng cho màn hình chính iOS.
- Mỗi deployment có revision riêng trong URL đăng ký service worker, nhờ đó app phát hiện cả thay đổi giao diện/code dù nội dung `sw.js` không đổi. App kiểm tra khi mở, quay lại foreground và mỗi giờ khi đang mở. Người dùng sẽ thấy nút **Cập nhật ngay**; xác nhận kích hoạt worker mới rồi tải lại ứng dụng. Lần cài đầu được kích hoạt tự động.
- Service worker nhận push và mở lại planner khi người dùng chạm thông báo. Bản này cache shell/biểu tượng phục vụ cài đặt, không cam kết xem hoặc sửa planner khi mất mạng; dữ liệu và xác thực vẫn cần kết nối.
- Người dùng có thể bật/tắt nhiều khung giờ mỗi ngày (tối đa 8), mặc định 07:00. Giờ dùng định dạng `HH:mm` và múi giờ cố định `Asia/Ho_Chi_Minh`.
- Khung giờ được lưu ở một dòng cấu hình toàn cục trong database; thành viên planner nào cũng có thể chỉnh. Thay đổi được phát qua Supabase Realtime và áp dụng cho mọi thiết bị.
- Mỗi trình duyệt/thiết bị đăng ký Web Push riêng. Cấu hình lịch dùng chung nhưng từng thiết bị cần được cài/mở và bật thông báo riêng; tắt một thiết bị không tắt các thiết bị khác.
- Sau khi bật, có thể nhấn **Gửi thử** để kiểm tra ngay đường gửi tới thiết bị hiện tại; phản hồi sẽ phân biệt subscription thiếu, cấu hình VAPID thiếu hoặc push provider từ chối.

### Hành vi thông báo

- Vercel Schedule mặc định chạy mỗi 15 phút để tương thích Hobby; worker bắt kịp các khung giờ trong 30 phút gần nhất. Claim database duy nhất theo thiết bị/sự kiện/ngày/giờ ngăn gửi lặp khi schedule chạy lại. Trên Hobby push có thể đến trễ khoảng 30 phút; Pro/Enterprise có thể cấu hình lịch mỗi phút.
- Nội dung push hiển thị thời gian còn lại theo ngày/giờ/phút đã làm tròn xuống giống đồng hồ đếm ngược, tránh báo “2 ngày” khi còn hơn một ngày nhưng chưa đủ hai ngày.
- Chỉ gửi khi có ít nhất một sự kiện tương lai; nội dung nhắc sự kiện tương lai gần nhất và số ngày còn lại.
- Mỗi sự kiện, khung giờ, ngày địa phương và subscription nhận tối đa một push; endpoint hết hạn được dọn khỏi danh sách.
- Nếu không có sự kiện tương lai, bỏ qua lượt gửi. Countdown trên trang tiếp tục cập nhật tại máy; Supabase Realtime đồng bộ sự kiện khi trang đang mở, còn khi quay lại app sẽ tải snapshot mới.
- Nếu quyền thông báo bị từ chối, giao diện giải thích cách bật lại trong cài đặt quyền của trình duyệt/thiết bị. Trên iPhone/iPad cần thêm vào Màn hình chính và mở bản đã cài trước khi bật push.
- Hỗ trợ Web Push tùy hệ điều hành/trình duyệt và quyền người dùng; PWA không thể tự cấp quyền thông báo. Người dùng cũng cần cho phép thông báo trong cài đặt hệ điều hành/trình duyệt và tắt Focus/Không làm phiền nếu muốn thấy banner ngay.

## Quy tắc nghiệp vụ và giới hạn

- Một sự kiện có thể liên kết nhiều địa điểm và checklist.
- Địa điểm không bắt buộc gắn sự kiện.
- Checklist không bắt buộc gắn sự kiện.
- Bản hiện tại không lọc/sắp xếp địa điểm, chưa có tìm kiếm, ảnh tải lên hoặc đồng bộ dữ liệu khi offline.
- Chưa có rate limit riêng cho đăng nhập/API.

## Tiêu chí nghiệm thu thủ công

1. Trang hiển thị countdown đúng với giờ sự kiện trên thiết bị.
2. Tạo/sửa/xóa sự kiện cập nhật danh sách và countdown.
3. Lưu/sửa/xóa món hoặc quán; checkbox đã thử lưu đúng trạng thái.
4. Checklist đánh dấu xong và tiến độ thay đổi.
5. Giao diện dùng được trên khung màn hình điện thoại và desktop.
6. Trên Android dùng trình duyệt hỗ trợ Push API; trên iPhone/iPad iOS/iPadOS 16.4+ thêm app vào Màn hình chính. Bật Notifications, nhấn **Gửi thử** và xác nhận thông báo trên thiết bị.
7. Tạo sự kiện tương lai, đặt giờ nhắc gần hiện tại và xác nhận cron gửi push; nếu test push tới nhưng lịch không gửi thì kiểm tra cron/log.
8. Thay/xóa khung giờ trên một thiết bị cập nhật thiết lập chung ở thiết bị khác; tắt push một thiết bị không ảnh hưởng thiết bị còn lại.
