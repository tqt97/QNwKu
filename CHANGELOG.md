# Changelog

Các thay đổi đáng chú ý của dự án được ghi tại đây.

## [Unreleased]

### Added

- Bổ sung hướng dẫn mobile push theo feature detection, nêu rõ điều kiện iOS/iPadOS 16.4+, cài PWA và quyền Notifications/Focus trên hệ điều hành.
- Thêm gửi push thử trên từng thiết bị và phản hồi lỗi VAPID/subscription; cron nhắc lịch bắt kịp giờ cấu hình trong cửa sổ 5 phút để tránh lỡ phút do độ trễ.
- Làm nổi bật nút cài PWA bằng gradient hồng pastel, biểu tượng trang trí và trạng thái tương tác/focus rõ ràng.
- Bổ sung README mô tả PWA/nhắc lịch và hướng dẫn cài đặt đầy đủ gồm cách lấy Supabase/VAPID keys, tạo cron secret, cấu hình local và Vercel.
- Thêm thông báo cập nhật PWA theo revision deployment: kiểm tra service worker mới, chờ người dùng xác nhận, kích hoạt phiên bản mới và tải lại app; lần cài đầu kích hoạt tự động.
- Thêm icon maskable riêng với hình chính nằm trong vùng an toàn; giữ PNG thông thường và Apple touch icon làm biến thể nền tảng.
- Thêm PWA manifest, biểu tượng và service worker xử lý Web Push cùng thao tác mở planner từ thông báo.
- Thêm cấu hình nhắc lịch toàn cục trong Supabase, tối đa 8 khung giờ/ngày theo Asia/Ho_Chi_Minh, mặc định 07:00 và đồng bộ qua Realtime.
- Thêm đăng ký push riêng từng thiết bị và giao diện bật/tắt, hướng dẫn khi quyền notification bị từ chối và cách cài PWA trên iPhone/iPad.
- Thêm Vercel Cron và Web Push gửi nhắc sự kiện tương lai gần nhất, có idempotency theo thiết bị/sự kiện/ngày/giờ.
- Cập nhật schema, hướng dẫn bảo mật, triển khai, kiến trúc và nghiệm thu PWA/reminder.

### Security

- Thay quyền CRUD public bằng Supabase Auth dùng phiên cookie SSR, xác thực membership ở trang và API, cùng RLS chỉ cho tài khoản có trong `planner_members`.

### Fixed

- Giới hạn việc dọn cache trong service worker vào cache namespace của planner, tránh xóa cache khác cùng origin.
- Thêm màn hình khóa toàn trang tông pastel; nội dung planner chỉ được truy vấn sau khi server xác minh phiên và membership.
- Thêm hướng dẫn cấu hình một tài khoản dùng chung, mật khẩu riêng mạnh và cấp quyền database; bỏ dữ liệu demo khỏi luồng trang.

### Changed

- Đồng bộ realtime INSERT/UPDATE/DELETE cho sự kiện, món/quán và checklist; tự tải snapshot khi kết nối/kết nối lại và hiển thị trạng thái kết nối.
- Hiển thị checklist chung cùng checklist của sự kiện gần nhất; khi sửa checklist giữ trạng thái hoàn thành, hoàn tác khi lỗi mạng và đồng bộ checklist con khi xóa sự kiện.
- Cảnh báo số việc chuẩn bị sẽ bị xóa cùng lịch hẹn; xử lý lỗi mạng khi xóa bằng thông báo trong giao diện.
- Chuẩn hóa ngày giờ theo múi giờ Việt Nam và dùng snapshot thời gian SSR chung cho countdown để tránh hydration mismatch và số đếm sai lúc tải đầu.
- Trang chủ chỉ liệt kê lịch tương lai theo thứ tự gần trước; tab Sự kiện giữ toàn bộ lịch theo thời gian. Dialog hỗ trợ Escape, giữ Tab trong modal, trả focus về nút mở và có heading cấp một trên mobile.
- Tách HeroCard, EventRow, PlaceRow và ChecklistRow thành component riêng; cập nhật countdown độc lập mỗi giây, định dạng/dọn CSS và bỏ selector cũ của giao diện card địa điểm.
- Đổi tên hiển thị của website thành “KU ơi, mình đi đâu thế”.
- Tăng độ đậm của chữ phụ để dễ đọc hơn trên nền pastel.
- Giữ tên tháng trên cùng một dòng trong ô ngày ở giao diện mobile.
- Khởi tạo countdown bằng thời điểm cố định khi SSR và đồng bộ đồng hồ sau khi mount để tránh hydration mismatch.
- Đồng bộ heading địa điểm thành “Chỗ xinh mình muốn ghé” và cho empty state trải hết chiều rộng lưới.
- Làm thanh cuộn mảnh và nhẹ hơn trên trình duyệt hỗ trợ tùy chỉnh scrollbar.
- Chuẩn hóa font nội dung và heading với fallback đa nền tảng, giữ hierarchy heading nhất quán.
- Tăng cỡ và tương phản chữ phụ, thêm token cho typography/màu/khoảng cách và chuyển sang font hệ thống không cần tải ngoài.
- Làm nút thêm trên thanh điều hướng mobile mở đúng loại nội dung theo tab hiện tại.
- Bổ sung accessible name cho nút thêm và giữ nhãn hiển thị trên phần lớn kích thước mobile.
- Đưa sửa/xóa địa điểm vào menu thao tác dùng được trên cảm ứng và thêm focus ring cho bàn phím.
- Tách thời gian và địa điểm sự kiện thành hai dòng dễ đọc trên màn hình nhỏ.
- Giữ vùng chạm menu card đủ lớn và cỡ input mobile phù hợp để tránh iOS tự zoom.
- Giữ header mobile gọn và tăng tương phản cho checklist đã xong, nhãn sự kiện và món muốn thử.
- Đưa cỡ heading trang, hero, khối, card và modal vào một scale responsive dùng token chung.
- Áp dụng cùng font serif hệ thống cho toàn bộ heading để giữ kiểu chữ đồng bộ khi không tải font ngoài.
- Tăng tương phản cho trích dẫn ở phần giới thiệu.
- Mở rộng vùng chạm cho nút sửa, xóa, checkbox và CTA lên tối thiểu 44px.
- Thêm nút sửa sự kiện có nhãn hỗ trợ bàn phím, tách riêng khỏi nút xóa.
- Chuyển layout một cột ở breakpoint 760px và cho action cuối hero tự xuống dòng ở màn hình hẹp.
- Đảm bảo nút thêm dạng chỉ có icon vẫn rộng tối thiểu 44px trên màn hình rất hẹp.
- Rút gọn nút thêm ở đầu danh sách trên mobile, bỏ lời chào lặp và thêm mũi tên cuộn từ hero.
- Bỏ tagline khỏi topbar để tên web gọn hơn.
- Tô điểm riêng chữ “KU” trong tên web và thêm nhịp đập nhẹ cho trái tim logo, có hỗ trợ reduced motion.
- Bỏ dòng eyebrow tiếng Anh lặp ở phần giới thiệu.
- Tự đóng menu món/quán khi chạm bên ngoài hoặc nhấn Escape.
- Đổi thao tác mỗi lịch hẹn sang menu dấu ba chấm, gom giờ/địa điểm thành một dòng và cố định ô tháng/ngày.
- Tăng sắc độ hồng/lavender nhẹ trên hero, ô ngày, checkbox và điểm nhấn để pastel rõ hơn.
- Thêm hiệu ứng lấp lánh nhẹ cho icon topbar, có hỗ trợ reduced motion.
- Đơn giản hóa mục lưu món/quán thành danh sách text có checkbox đã thử, giữ nguyên dữ liệu chi tiết cũ trong schema.
- Đổi nút dưới cùng thành “Thêm mới” với bộ chọn loại nội dung trước khi mở form.
- Đưa danh sách món/quán muốn thử lên trước checklist chuẩn bị trên trang chủ.
- Đồng bộ menu dấu ba chấm của lịch hẹn với menu món/quán: cùng kiểu nút, menu dọc và nhãn thao tác.

## [1.0.0] - 2026-11-15

### Added

- Mobile-first planner giao diện tone hồng, lavender và kem.
- Countdown tự cập nhật đến sự kiện gần nhất.
- Tạo, xem, sửa và xóa sự kiện.
- Tạo, xem, sửa và xóa địa điểm; gắn địa điểm với sự kiện và mở link bản đồ.
- Tạo, sửa, xóa checklist; gắn checklist với sự kiện và đánh dấu hoàn thành.
- Supabase schema cho events, places, checklist_items, index và public RLS policies.
- API CRUD phía Next.js cho ba bảng được cho phép.
- Dữ liệu demo khi chưa cấu hình Supabase.
- README, đặc tả tính năng, hướng dẫn sử dụng, kiến trúc, deploy và bảo mật.
