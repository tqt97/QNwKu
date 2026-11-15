# Changelog

Các thay đổi đáng chú ý của dự án được ghi tại đây.

## [Unreleased]

### Changed

- Đổi tên hiển thị của website thành “KU ơi, mình đi đâu thế”.
- Tăng độ đậm của chữ phụ để dễ đọc hơn trên nền pastel.
- Giữ tên tháng trên cùng một dòng trong ô ngày ở giao diện mobile.
- Khởi tạo countdown bằng thời điểm cố định khi SSR và đồng bộ đồng hồ sau khi mount để tránh hydration mismatch.
- Đồng bộ heading địa điểm thành “Chỗ xinh mình muốn ghé” và cho empty state trải hết chiều rộng lưới.

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
