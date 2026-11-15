# Changelog

Các thay đổi đáng chú ý của dự án được ghi tại đây.

## [Unreleased]

### Changed

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
- Đổi tagline thành “Lên kèo đi chơi thôi ♡”.
- Bỏ dòng eyebrow tiếng Anh lặp ở phần giới thiệu.
- Tự đóng menu món/quán khi chạm bên ngoài hoặc nhấn Escape.
- Đơn giản hóa mục lưu món/quán thành danh sách text có checkbox đã thử, giữ nguyên dữ liệu chi tiết cũ trong schema.
- Đổi nút dưới cùng thành “Thêm mới” với bộ chọn loại nội dung trước khi mở form.

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
