# Database — Parking Building Management System

**SWP391 · SU26SWP07 · PostgreSQL 15+**

## Cấu trúc thư mục

```
database/
├── schema/
│   └── parking_bms_database.dbml   ← Import vào dbdiagram.io để xem ERD
├── migrations/
│   └── V1__init_schema.sql         ← Flyway migration: tạo toàn bộ bảng + seed roles
└── README.md
```

## Yêu cầu

| Thành phần | Phiên bản |
|---|---|
| PostgreSQL | 15+ |
| pgvector extension | 0.5+ |
| Flyway | 9+ |

## Cách chạy

### 1. Tạo database

```sql
CREATE DATABASE parking_bms;
```

### 2. Enable extensions (chạy với superuser)

```sql
\c parking_bms
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### 3. Cấu hình Flyway trong `application.properties`

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/parking_db
    username: postgres
    password: 123456
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
```

### 4. Đặt file SQL vào đúng thư mục

```
src/main/resources/db/migration/V1__init_schema.sql
```

Flyway tự chạy khi Spring Boot khởi động.

## Xem ERD trên dbdiagram.io

1. Mở [https://dbdiagram.io](https://dbdiagram.io)
2. Nhấn **Import → DBML**
3. Paste toàn bộ nội dung file `schema/parking_bms_database.dbml`

## Ghi chú thiết kế quan trọng

| Quyết định | Lý do |
|---|---|
| Không có `available_slots` trong `zones` | Tránh row-level lock khi concurrent entry/exit. Đếm real-time qua `COUNT` từ `parking_slots`. |
| `parking_slots.current_session_id` không có FK | Tránh circular dependency với `parking_sessions`. Enforce tại application layer trong `@Transactional`. |
| `audit_logs` append-only | Không UPDATE, không DELETE. Dùng `INSERT` duy nhất. |
| Partial unique index trên `users.email` | Cho phép tái sử dụng email khi tài khoản bị soft-delete (`user_is_active = false`). |
| `face_descriptor vector(128)` | pgvector cosine similarity — match khuôn mặt khi xe ra không cần vé. |
| `pricing_rules.effective_from/to` | BR-29: rule mới chỉ áp dụng cho session tạo sau ngày update. |
| `parking_sessions.overstay_flagged_at` | BR-04: scheduler check cột này, `NULL` = chưa flag, tránh tạo duplicate exception. |
