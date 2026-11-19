# Nhà của tụi mình ♡

> Một góc nhỏ để đếm ngày gặp nhau, lưu quán xinh và chuẩn bị những điều đáng nhớ.

Ứng dụng kế hoạch đôi, tối ưu cho điện thoại. Dùng **Next.js + TypeScript + Supabase Auth/Postgres + Vercel**, khóa nội dung trước khi xác thực và kiểm soát quyền bằng RLS.

## Mục lục

- [Tính năng](#tính-năng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Công nghệ](#công-nghệ)
- [Chạy local](#chạy-local)
- [Cấu hình Supabase](#cấu-hình-supabase)
- [Deploy Vercel](#deploy-vercel)
- [Quyền truy cập và dữ liệu](#quyền-truy-cập-và-dữ-liệu)
- [Tài liệu chi tiết](#tài-liệu-chi-tiết)
- [Kiểm tra build](#kiểm-tra-build)

## Tính năng

- Countdown đến sự kiện sắp tới, cập nhật từng giây.
- CRUD sự kiện: tên, ngày giờ, địa điểm, lời nhắn.
- Danh sách món/quán muốn thử: lưu một dòng text, đánh dấu đã thử, sửa hoặc xóa.
- CRUD checklist: việc cần chuẩn bị, gắn với sự kiện và đánh dấu hoàn thành.
- Thanh **Thêm mới** trên điện thoại cho chọn Sự kiện, Chuẩn bị hoặc Lưu lại trước khi mở form.
- Hiển thị tiến độ checklist theo sự kiện gần nhất.
- Tự đồng bộ sự kiện, món/quán và checklist theo thời gian thực giữa các thiết bị dùng chung Supabase.
- Mobile-first: điều hướng dưới màn hình nhỏ, form dễ thao tác, layout thích ứng desktop.
- Màn hình khóa pastel, dùng một tài khoản Supabase Auth chung cho hai thiết bị.
- RLS chỉ cấp quyền cho user trong `planner_members`; API cũng xác thực session ở server.
- Có thể cài như PWA và bật Web Push riêng trên từng thiết bị; khung giờ nhắc dùng chung và hỗ trợ tối đa 8 giờ/ngày theo giờ Việt Nam.

Chi tiết: [docs/FEATURES.md](docs/FEATURES.md). Hướng dẫn giao diện: [docs/USER_GUIDE.md](docs/USER_GUIDE.md).

## Cấu trúc dự án

```text
app/
  api/[table]/route.ts   API CRUD kiểm tra session và membership
  api/reminders/         API giờ nhắc, đăng ký và gửi thử Web Push
  api/cron/reminders/    Worker gửi nhắc lịch theo CRON_SECRET
  components/            Các hàng planner, nhắc lịch và thông báo cập nhật PWA
  globals.css            Giao diện responsive và theme
  layout.tsx             Metadata và root layout
  page.tsx               Tải dữ liệu phía server
  planner.tsx            Giao diện và tương tác CRUD
lib/
  data.ts                Đọc dữ liệu bằng phiên người dùng
  supabase/              Browser, server và middleware Auth clients
  types.ts               Kiểu dữ liệu ứng dụng
supabase/
  schema.sql             Bảng, membership, index và RLS policies
public/
  manifest.webmanifest   Metadata PWA
  sw.js                  Nhận Web Push và mở planner
  icon-maskable.svg      Icon PWA có vùng an toàn cho launcher
assets/icons/
  apple-touch-icon.svg   Nguồn vector cho icon iOS
docs/
  ARCHITECTURE.md        Kiến trúc, luồng dữ liệu, mô hình dữ liệu
  FEATURES.md            Đặc tả tính năng và hành vi
  USER_GUIDE.md          Hướng dẫn dùng giao diện
  DEPLOYMENT.md          Cấu hình Supabase và Vercel
  INSTALLATION.md        Cài đặt, cách lấy key và cấu hình môi trường
  SECURITY.md            Quyền public và kế hoạch chuyển sang auth
CHANGELOG.md             Lịch sử thay đổi
```

## Công nghệ

| Lớp | Công nghệ |
|---|---|
| Web framework | Next.js App Router 15, React 19 |
| Ngôn ngữ | TypeScript |
| UI | CSS responsive viết riêng, Lucide icons |
| Database | Supabase Postgres + Row Level Security |
| Hosting | Vercel |

## Chạy local

Yêu cầu **Node.js 20.9 trở lên** và npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Cần cấu hình Supabase Auth để đăng nhập và mở planner. Xem [Hướng dẫn cài đặt](docs/INSTALLATION.md) để tạo project, lấy các key Supabase/VAPID, thiết lập database và cấu hình Vercel Cron.

```bash
npm run dev        # môi trường phát triển
npm run typecheck  # kiểm tra TypeScript
npm run build      # production build
npm start          # chạy production build sau khi build
```

## Cấu hình Supabase và key

Làm theo [hướng dẫn cài đặt đầy đủ](docs/INSTALLATION.md) để tạo project, áp dụng schema, cấp membership, lấy Supabase/VAPID keys và cấu hình `.env.local`.

## Deploy Vercel

Xem [hướng dẫn cài đặt](docs/INSTALLATION.md) để cấu hình đủ biến môi trường, cron nhắc lịch và triển khai Production; [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) có thêm lỗi thường gặp.

## Quyền truy cập và dữ liệu

Ứng dụng yêu cầu đăng nhập Supabase Auth. Server/API xác minh JWT và membership; Postgres RLS chặn quyền `anon` và chỉ cho user trong `planner_members` thao tác. Hai thiết bị dùng chung một tài khoản để cùng xem và cập nhật dữ liệu.

Browser dùng Supabase anon/public key cùng RLS. `service_role` chỉ được dùng trong route cron phía server; **không bao giờ** đưa key này vào trình duyệt, biến `NEXT_PUBLIC_*` hoặc Git. Xem [docs/SECURITY.md](docs/SECURITY.md) để biết thêm.

## Tài liệu chi tiết

- [Đặc tả tính năng](docs/FEATURES.md)
- [Hướng dẫn sử dụng](docs/USER_GUIDE.md)
- [Kiến trúc và mô hình dữ liệu](docs/ARCHITECTURE.md)
- [Cấu hình Supabase và deploy Vercel](docs/DEPLOYMENT.md)
- [Cài đặt, lấy key và cấu hình đầy đủ](docs/INSTALLATION.md)
- [Quyền truy cập và bảo mật](docs/SECURITY.md)
- [Lịch sử thay đổi](CHANGELOG.md)

## Các lệnh dự án

```bash
npm run typecheck  # kiểm tra TypeScript
npm run build      # production build
```
