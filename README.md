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

Chi tiết: [docs/FEATURES.md](docs/FEATURES.md). Hướng dẫn giao diện: [docs/USER_GUIDE.md](docs/USER_GUIDE.md).

## Cấu trúc dự án

```text
app/
  api/[table]/route.ts   API CRUD kiểm tra session và membership
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
docs/
  ARCHITECTURE.md        Kiến trúc, luồng dữ liệu, mô hình dữ liệu
  FEATURES.md            Đặc tả tính năng và hành vi
  USER_GUIDE.md          Hướng dẫn dùng giao diện
  DEPLOYMENT.md          Cấu hình Supabase và Vercel
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

Mở [http://localhost:3000](http://localhost:3000). Cần cấu hình Supabase Auth để đăng nhập và mở planner.

```bash
npm run dev        # môi trường phát triển
npm run typecheck  # kiểm tra TypeScript
npm run build      # production build
npm start          # chạy production build sau khi build
```

## Cấu hình Supabase

1. Tạo project Supabase.
2. Trong **SQL Editor**, chạy nội dung `supabase/schema.sql`.
3. Tạo một user email trong Supabase Authentication → Users, đặt mật khẩu riêng dài và khó đoán (không dùng ngày sinh/mã 4 số). Cấp membership trong SQL Editor:

   ```sql
   insert into public.planner_members (user_id)
   select id from auth.users where email = 'EMAIL_DA_TAO'
   on conflict (user_id) do nothing;
   ```

4. Từ API settings, lấy **Project URL** và **anon/public key**.
5. Điền `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   NEXT_PUBLIC_PLANNER_EMAIL=EMAIL_DA_TAO
   ```

6. Khởi động lại dev server. Khi đăng nhập thành công, ứng dụng đọc ba bảng planner.

## Deploy Vercel

1. Đưa source lên repository GitHub.
2. Trên Vercel chọn **Add New → Project**, import repository.
3. Thêm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` và `NEXT_PUBLIC_PLANNER_EMAIL` vào Environment Variables.
4. Chọn **Deploy**. Vercel dùng lệnh mặc định `next build`.
5. Push commit mới lên nhánh production để tạo deployment tiếp theo.

Xem [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) để biết chi tiết và cách xử lý lỗi cấu hình.

## Quyền truy cập và dữ liệu

Ứng dụng yêu cầu đăng nhập Supabase Auth. Server/API xác minh JWT và membership; Postgres RLS chặn quyền `anon` và chỉ cho user trong `planner_members` thao tác. Hai thiết bị dùng chung một tài khoản để cùng xem và cập nhật dữ liệu.

Chỉ dùng Supabase anon/public key trong ứng dụng. **Không dùng `service_role` key** ở trình duyệt, biến `NEXT_PUBLIC_*`, hoặc commit vào repository. Xem [docs/SECURITY.md](docs/SECURITY.md) để thiết lập user/membership và vận hành.

## Tài liệu chi tiết

- [Đặc tả tính năng](docs/FEATURES.md)
- [Hướng dẫn sử dụng](docs/USER_GUIDE.md)
- [Kiến trúc và mô hình dữ liệu](docs/ARCHITECTURE.md)
- [Cấu hình Supabase và deploy Vercel](docs/DEPLOYMENT.md)
- [Quyền truy cập và bảo mật](docs/SECURITY.md)
- [Lịch sử thay đổi](CHANGELOG.md)

## Kiểm tra build

```bash
npm run typecheck
npm run build
```
