# Kiến trúc ứng dụng

## Tổng quan

Ứng dụng dùng Next.js App Router làm web server/API, Supabase Auth để xác thực và Supabase Postgres làm nơi lưu dữ liệu. Một Auth account dùng chung trên các thiết bị; `planner_members` là danh sách user được quyền vào planner.

```mermaid
flowchart LR
  Browser["Trình duyệt"] --> Gate["Password gate / Supabase Auth"]
  Gate --> Middleware["Next.js middleware / cookie session"]
  Middleware --> Page["Server page / claims + membership"]
  Page --> Supabase["Supabase Postgres + RLS"]
  Browser --> API["Next.js API / claims + membership"]
  API --> Supabase
  Browser --> Realtime["Authenticated Realtime"]
  Realtime --> Supabase
```

Middleware làm mới cookie session. Trước khi tải dữ liệu planner, server xác minh JWT bằng `getClaims()` và kiểm tra membership; khách chưa được cấp quyền chỉ nhận màn hình khóa. API lặp lại kiểm tra này cho mọi thao tác, còn RLS kiểm tra lần cuối ngay trong database. Browser dùng anon key cùng user JWT cho CRUD theo session và subscription realtime; không dùng `service_role`. Thời điểm SSR được gửi xuống để lần render đầu khớp HTML; ngày giờ dùng múi giờ `Asia/Ho_Chi_Minh` và database lưu `timestamptz`.

## Các thành phần

- `app/page.tsx`: xác minh session/membership trước khi tải dữ liệu; trả gate nếu chưa có quyền.
- `app/components/AccessGate.tsx`: form đăng nhập Auth bằng email cố định cấu hình, không hiển thị email.
- `middleware.ts`, `lib/supabase/{server,client,middleware}.ts`: clients và cookie session SSR.
- `lib/planner-auth.ts`: kiểm tra claims và membership dùng chung cho page/API.
- `app/planner.tsx`: điều phối state CRUD, điều hướng và form; các hàng sự kiện, món/quán và checklist tách thành component trong `app/components/`.
- `app/hooks/usePlannerRealtime.ts`: đăng ký Postgres Changes cho ba bảng, cập nhật state theo INSERT/UPDATE/DELETE và tải lại snapshot khi kết nối thành công hoặc khôi phục kết nối.
- `app/components/HeroCard.tsx`: quản lý nhịp cập nhật countdown riêng mỗi giây để không render lại toàn trang theo đồng hồ.
- `app/components/EventRow.tsx`, `PlaceRow.tsx`, `ChecklistRow.tsx`: render từng hàng và nhận callback thao tác từ Planner.
- `lib/dates.ts`: timezone ứng dụng, chuyển đổi input datetime-local và định dạng SSR/client thống nhất.
- `app/api/[table]/route.ts`: POST/PATCH/DELETE; chỉ chấp nhận `events`, `places`, `checklist_items`.
- `lib/supabase.ts`: URL/key Supabase và email đăng nhập lấy từ env.
- `lib/data.ts`: đọc dữ liệu qua client gắn với session người dùng.
- `lib/types.ts`: kiểu dữ liệu giao diện.
- `supabase/schema.sql`: schema, membership, foreign keys, index, RLS authenticated-only và publication realtime.

## Mô hình dữ liệu

```mermaid
erDiagram
  EVENTS ||--o{ PLACES : includes
  EVENTS ||--o{ CHECKLIST_ITEMS : prepares
  EVENTS {
    uuid id PK
    text title
    timestamptz starts_at
    text location
    text note
    text accent
    timestamptz created_at
  }
  PLACES {
    uuid id PK
    text name
    text category
    text area
    text dish
    text map_url
    uuid event_id FK
    boolean visited
  }
  CHECKLIST_ITEMS {
    uuid id PK
    uuid event_id FK
    text title
    boolean done
  }
```

Khi xóa sự kiện, checklist liên quan bị xóa (`ON DELETE CASCADE`); địa điểm vẫn còn và `event_id` thành null (`ON DELETE SET NULL`).

## API

| Method | Path | Nội dung |
|---|---|---|
| POST | `/api/events` | Tạo sự kiện |
| PATCH | `/api/events` | Cập nhật theo `id` |
| DELETE | `/api/events?id=...` | Xóa sự kiện |
| POST/PATCH/DELETE | `/api/places` | CRUD địa điểm |
| POST/PATCH/DELETE | `/api/checklist_items` | CRUD checklist |

API trả JSON cho kết quả/error; DELETE thành công trả 204. Không có pagination trong MVP.

## State và lỗi

- Server tải dữ liệu lúc render; thao tác CRUD cập nhật client state theo phản hồi API.
- Checklist cập nhật lạc quan và hoàn tác khi request thất bại.
- Lỗi Supabase khi tải hiển thị ở đầu trang; lỗi thao tác hiển thị toast.
- Realtime dùng publication `supabase_realtime`; subscription cần JWT Auth và membership hợp lệ.
- Thiếu cấu hình Supabase, app chỉ hiển thị hướng dẫn kết nối và không trả dữ liệu demo.

## Phân trang và quy mô dữ liệu

Hiện ba bảng được tải cùng lúc vì đây là planner cá nhân dự kiến có ít bản ghi; chưa có phân trang server-side. Không nên chỉ cắt danh sách ở client vì như vậy vẫn tải toàn bộ dữ liệu và làm sai tiến độ checklist. Khi một bảng vượt khoảng 100 bản ghi hoặc thời gian/khối lượng tải SSR bắt đầu ảnh hưởng rõ, bổ sung cursor/range pagination ở Supabase và API, đồng thời giữ riêng truy vấn lịch tương lai, lịch cũ và checklist theo sự kiện. Chưa bật phân trang trong bản này vì dữ liệu hiện tại không có dấu hiệu vượt ngưỡng và cần giữ đầy đủ checklist/progress trong luồng hiện tại.

## Mở rộng dự kiến

1. Thêm validation schema phía server, giới hạn độ dài, URL validation và rate limit.
2. Nếu cần phân biệt người dùng, thay account dùng chung bằng user riêng và membership theo không gian.
3. Thêm ảnh, tìm kiếm/lọc và nhắc lịch theo nhu cầu.
