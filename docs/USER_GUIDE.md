# Hướng dẫn sử dụng

## Trang chủ

Khi mở trang, nhập mật khẩu tài khoản planner để vào nội dung. Cùng một tài khoản được dùng trên các thiết bị. Nếu báo chưa được mời, quản trị viên cần thêm user vào `planner_members` theo [hướng dẫn bảo mật](SECURITY.md).

Card lớn phía trên hiển thị sự kiện gần nhất và countdown. Nút lịch ở góc card mở form sửa; mũi tên phía dưới cuộn tới lịch. Phần “Những dịp sắp tới” chỉ liệt kê lịch tương lai theo thời gian gần trước; mở menu dấu ba chấm như ở danh sách món/quán để chỉnh sửa hoặc xóa từng hàng. Tab “Sự kiện” xem cả lịch cũ và lịch sắp tới.

Khi kết nối Supabase, thay đổi từ thiết bị khác sẽ tự hiện trong danh sách mà không cần tải lại trang. Trạng thái trên thanh đầu trang cho biết đang kết nối, đã đồng bộ trực tiếp hay đang dùng dữ liệu xem thử.

## Cài ứng dụng và nhắc lịch

Mở **Nhắc lịch** để thêm/xóa các khung giờ (mặc định 07:00, giờ Việt Nam). Đây là cài đặt chung của planner nên thay đổi ở thiết bị nào cũng đồng bộ cho cả hai người. Tối đa 8 giờ mỗi ngày; thông báo chỉ được gửi nếu có sự kiện tương lai và sẽ nhắc lịch gần nhất.

Trong **Thông báo trên thiết bị này**, bật push cho thiết bị hiện tại. Mỗi điện thoại/máy tính cần bật riêng để nhận push trên nhiều thiết bị; tắt tại đây chỉ gỡ thiết bị đang dùng. Trình duyệt sẽ hỏi quyền notification. Sau khi bật, dùng **Gửi thử** để xác nhận thiết bị nhận được push ngay; nếu gửi lỗi, thông báo sẽ hướng dẫn kiểm tra subscription hoặc VAPID. Nếu đã từ chối quyền, mở cài đặt website/Notifications của trình duyệt hoặc cài đặt hệ điều hành, cho phép lại rồi tải lại trang.

Trên iPhone/iPad chạy iOS/iPadOS 16.4 trở lên, dùng Safari → **Chia sẻ** → **Thêm vào Màn hình chính**, mở biểu tượng vừa cài rồi mới bật push bên trong app. Trên Android, dùng trình duyệt hỗ trợ Push API; cho phép Notifications trên cả trình duyệt và hệ điều hành. Chế độ Focus/Không làm phiền có thể ẩn banner dù push đã được gửi.

Khi có phiên bản PWA mới, ứng dụng hiện thông báo **Có phiên bản mới**. Nhấn **Cập nhật ngay** để tải lại app với phiên bản mới; app cũng tự kiểm tra lại khi mở hoặc quay lại màn hình.

PWA mở nhanh và nhận push khi ứng dụng đóng (nếu trình duyệt/hệ điều hành hỗ trợ); bản hiện tại vẫn cần mạng để tải planner và thao tác dữ liệu.

Ngay dưới lịch hẹn là danh sách “Chỗ xinh mình muốn ghé”, tiếp theo là checklist “Chuẩn bị một chút”.

## Thêm mới trên điện thoại

1. Nhấn **Thêm mới** ở thanh điều hướng dưới.
2. Chọn **Sự kiện**, **Chuẩn bị** hoặc **Lưu lại**.
3. Điền form tương ứng rồi nhấn **Lưu lại**.

## Thêm sự kiện

1. Chọn **Sự kiện** trong bộ chọn **Thêm mới**, hoặc nhấn nút thêm ở đầu danh sách sự kiện.
2. Nhập tên và ngày giờ (hai trường bắt buộc).
3. Thêm địa điểm và lời nhắn nếu muốn.
4. Nhấn **Lưu lại**.

## Lưu món hoặc quán muốn thử

1. Chọn **Lưu lại** trong bộ chọn **Thêm mới**, hoặc nhấn dấu cộng ở đầu danh sách.
2. Ghi một dòng đơn giản, ví dụ tên món hoặc tên quán.
3. Nhấn checkbox khi đã thử/ghé. Mở menu ba chấm để sửa hoặc xóa mục.

## Checklist

1. Chọn **Chuẩn bị** trong bộ chọn **Thêm mới**, hoặc nhấn **Thêm một việc cần chuẩn bị** trong checklist.
2. Nhập nội dung, chọn sự kiện hoặc để việc chung.
3. Nhấn checkbox để đánh dấu hoàn tất.
4. Chọn nội dung để sửa; biểu tượng xóa ở cuối hàng để loại bỏ.

## Điều hướng điện thoại

- **Nhà mình:** countdown, sự kiện, checklist và một phần địa điểm.
- **Sự kiện:** danh sách lịch hẹn.
- **Địa điểm:** checklist món và quán muốn thử.
- **Thêm mới:** chọn tạo sự kiện, mục chuẩn bị hoặc mục muốn lưu.

Nếu Supabase chưa được cấu hình, trang chỉ hiển thị thông báo thiết lập và không cung cấp dữ liệu planner.
