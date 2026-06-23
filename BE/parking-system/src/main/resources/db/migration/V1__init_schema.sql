-- ============================================================
-- PARKING BUILDING MANAGEMENT SYSTEM — Schema v2.0
-- SWP391 · SU26SWP07
-- PostgreSQL 15+ | pgvector extension required
-- Flyway migration: V1__init_schema.sql
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE vehicle_type_enum AS ENUM ('MOTORBIKE', 'CAR', 'TRUCK');
CREATE TYPE slot_maintenance_enum AS ENUM ('AVAILABLE', 'MAINTENANCE');
CREATE TYPE session_status_enum AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status_enum AS ENUM ('UNPAID', 'PAID', 'REFUNDED', 'FAILED');
CREATE TYPE ticket_type_enum AS ENUM ('HOURLY', 'DAILY', 'MONTHLY', 'LOST_TICKET', 'OVERSTAY');
CREATE TYPE booking_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED');
CREATE TYPE exception_type_enum AS ENUM ('LOST_TICKET', 'OVERSTAY', 'WRONG_ZONE', 'UNPAID_EXIT');
CREATE TYPE exception_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE report_type_enum AS ENUM ('REVENUE', 'UTILIZATION', 'PEAK_HOURS', 'VEHICLE_COUNT');
CREATE TYPE notification_type_enum AS ENUM ('OVERSTAY_ALERT', 'EXCEPTION_PENDING', 'BOOKING_EXPIRED', 'UNPAID_SESSION');

-- ============================================================
-- ROLES & PERMISSIONS
-- ============================================================

CREATE TABLE roles (
    role_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_code   VARCHAR(50)  NOT NULL UNIQUE,   -- ADMIN | MANAGER | STAFF
    role_name   VARCHAR(100) NOT NULL UNIQUE,
    role_description VARCHAR(255) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE privileges (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    privilege_code  VARCHAR(50)  NOT NULL UNIQUE,  -- SESSION_CREATE, REPORT_VIEW, ...
    privilege_name  VARCHAR(100) NOT NULL UNIQUE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE role_privileges (
    role_id       BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    privilege_id  BIGINT NOT NULL REFERENCES privileges(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, privilege_id)
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    user_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id              BIGINT NOT NULL REFERENCES roles(role_id),
    full_name            VARCHAR(255) NOT NULL,
    email                VARCHAR(255) NOT NULL,
    phone_number         VARCHAR(20),
    identify_number      VARCHAR(50),
    password             VARCHAR(255) NOT NULL,
    address              VARCHAR(255),
    date_of_birth        DATE,
    gender               VARCHAR(10),              -- MALE | FEMALE | OTHER
    user_is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_active          TIMESTAMP,
    locked_until         TIMESTAMP,
    locked_token         VARCHAR(255),
    refresh_token        VARCHAR(255),
    token_reset_password VARCHAR(255),
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Partial unique indexes: chỉ unique khi còn active
CREATE UNIQUE INDEX idx_users_email_active        ON users(email)           WHERE user_is_active = TRUE;
CREATE UNIQUE INDEX idx_users_phone_active        ON users(phone_number)    WHERE user_is_active = TRUE AND phone_number IS NOT NULL;
CREATE UNIQUE INDEX idx_users_identify_active     ON users(identify_number) WHERE user_is_active = TRUE AND identify_number IS NOT NULL;

-- ============================================================
-- PARKING STRUCTURE
-- ============================================================

CREATE TABLE floors (
    id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name         VARCHAR(50)  NOT NULL,   -- Hầm B1, Tầng 1, ...
    level_number INTEGER      NOT NULL UNIQUE,  -- -1, 1, 2, 3...
    description  VARCHAR(255),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE zones (
    id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    floor_id     UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name         VARCHAR(100) NOT NULL,
    vehicle_type vehicle_type_enum NOT NULL,
    total_slots  INTEGER NOT NULL CHECK (total_slots > 0),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    -- NOTE: Không có available_slots để tránh row-level lock.
    -- Đếm real-time qua: SELECT COUNT(*) FROM parking_slots
    --   WHERE zone_id = ? AND current_session_id IS NULL AND maintenance_status = 'AVAILABLE'
);

CREATE TABLE parking_slots (
    id                   UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_code            VARCHAR(20) NOT NULL UNIQUE,  -- A1-01, B2-15, ...
    floor_id             UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    zone_id              UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    vehicle_type         vehicle_type_enum NOT NULL,
    maintenance_status   slot_maintenance_enum NOT NULL DEFAULT 'AVAILABLE',
    -- NULL = FREE, có value = OCCUPIED
    -- Không dùng FK để tránh circular dependency với parking_sessions
    -- Enforce tại application layer trong @Transactional
    current_session_id   UUID,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_slots_zone_id         ON parking_slots(zone_id);
CREATE INDEX idx_slots_zone_free       ON parking_slots(zone_id, current_session_id)
    WHERE current_session_id IS NULL AND maintenance_status = 'AVAILABLE';
CREATE INDEX idx_slots_maintenance     ON parking_slots(maintenance_status);

-- ============================================================
-- VEHICLES
-- ============================================================

CREATE TABLE vehicles (
    id                   UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id              BIGINT REFERENCES users(user_id) ON DELETE SET NULL,  -- NULL = khách vãng lai
    license_plate        VARCHAR(20) NOT NULL,
    vehicle_type         vehicle_type_enum NOT NULL,
    has_monthly_pass     BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_pass_expiry  DATE,
    --face_descriptor      vector(128),   -- pgvector: cosine similarity match khi ra không cần vé
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Partial unique: cho phép đăng ký lại biển số nếu xe cũ đã bị soft delete
CREATE UNIQUE INDEX idx_vehicles_plate_active ON vehicles(license_plate) WHERE is_active = TRUE;
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);

-- ============================================================
-- MONTHLY PASSES
-- ============================================================

CREATE TABLE monthly_passes (
    id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    slot_id         UUID REFERENCES parking_slots(id) ON DELETE SET NULL,  -- NULL nếu không cố định slot
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    fee             NUMERIC(15,0) NOT NULL CHECK (fee > 0),
    payment_status  payment_status_enum NOT NULL DEFAULT 'UNPAID',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_monthly_pass_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_monthly_pass_vehicle_active ON monthly_passes(vehicle_id, is_active);
CREATE INDEX idx_monthly_pass_expiry         ON monthly_passes(end_date);

-- ============================================================
-- BOOKINGS (Đặt trước)
-- ============================================================

CREATE TABLE bookings (
    id                  UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id),
    slot_id             UUID NOT NULL REFERENCES parking_slots(id),
    booking_code        VARCHAR(20) NOT NULL UNIQUE,  -- BR-47: mã Staff tra cứu xe vào
    start_time          TIMESTAMP NOT NULL,
    end_time            TIMESTAMP NOT NULL,
    -- BR-05: scheduler release slot khi booking_expiry_at < now() và status = PENDING
    booking_expiry_at   TIMESTAMP NOT NULL,           -- = start_time + 30 phút
    status              booking_status_enum NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_times CHECK (end_time > start_time)
);

CREATE INDEX idx_bookings_vehicle_status ON bookings(vehicle_id, status);
CREATE INDEX idx_bookings_expiry         ON bookings(booking_expiry_at) WHERE status = 'PENDING';

-- ============================================================
-- PRICING RULES
-- ============================================================

CREATE TABLE pricing_rules (
    id                       UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    zone_id                  UUID REFERENCES zones(id),  -- NULL = áp toàn bộ bãi
    name                     VARCHAR(100) NOT NULL,
    vehicle_type             vehicle_type_enum NOT NULL,
    ticket_type              ticket_type_enum  NOT NULL,
    rate_per_hour            NUMERIC(15,0) CHECK (rate_per_hour > 0),
    minimum_fee              NUMERIC(15,0) NOT NULL CHECK (minimum_fee > 0),   -- BR-26
    maximum_daily_fee        NUMERIC(15,0) CHECK (maximum_daily_fee > 0),
    overstay_rate_multiplier NUMERIC(3,2)  CHECK (overstay_rate_multiplier >= 1),  -- BR-04: VD 2.00
    peak_hour_start          TIME,
    peak_hour_end            TIME,
    peak_hour_multiplier     NUMERIC(3,2)  CHECK (peak_hour_multiplier >= 1),
    -- BR-29: rule mới chỉ áp cho session tạo sau effective_from
    effective_from           DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to             DATE,   -- NULL = hiệu lực vô thời hạn
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    created_by               BIGINT NOT NULL REFERENCES users(user_id),  -- BR-30: chỉ Manager
    created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pricing_effective CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX idx_pricing_lookup    ON pricing_rules(vehicle_type, ticket_type, is_active);
CREATE INDEX idx_pricing_effective ON pricing_rules(effective_from, effective_to);

-- ============================================================
-- PARKING SESSIONS
-- ============================================================

CREATE TABLE parking_sessions (
    id                   UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id           UUID REFERENCES bookings(id),            -- NULL nếu không đặt trước
    vehicle_id           UUID NOT NULL REFERENCES vehicles(id),
    slot_id              UUID NOT NULL REFERENCES parking_slots(id),
    staff_entry_id       BIGINT NOT NULL REFERENCES users(user_id),
    staff_exit_id        BIGINT REFERENCES users(user_id),
    applied_rule_id      UUID REFERENCES pricing_rules(id),       -- rule đã dùng tính phí (audit)
    -- BR-18: entry_time do server set, không cho Staff nhập
    entry_time           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_time            TIMESTAMP,
    -- BR-01: fee = ceil((exit-entry)/60) × rate, áp minimum_fee
    fee                  NUMERIC(15,0) CHECK (fee >= 0),
    discount_amount      NUMERIC(15,0) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    final_fee            NUMERIC(15,0) CHECK (final_fee >= 0),    -- fee - discount_amount
    payment_status       payment_status_enum NOT NULL DEFAULT 'UNPAID',
    status               session_status_enum NOT NULL DEFAULT 'ACTIVE',
    ticket_type          ticket_type_enum NOT NULL,
    face_verified_at_exit BOOLEAN DEFAULT FALSE,
    -- BR-02: nếu TRUE thì bắt buộc có ExceptionRecord đi kèm
    staff_override_used  BOOLEAN DEFAULT FALSE,
    -- BR-04: scheduler set khi session > 24h. NULL = chưa flag. Tránh duplicate exception.
    overstay_flagged_at  TIMESTAMP,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_session_times CHECK (exit_time IS NULL OR exit_time > entry_time)
);

CREATE INDEX idx_sessions_status       ON parking_sessions(status);
CREATE INDEX idx_sessions_entry_time   ON parking_sessions(entry_time);
CREATE INDEX idx_sessions_vehicle_id   ON parking_sessions(vehicle_id);          -- BR-03: check nợ phí
CREATE INDEX idx_sessions_slot_active  ON parking_sessions(slot_id, status)
    WHERE status = 'ACTIVE';     -- BR-16: đảm bảo 1 slot chỉ có 1 ACTIVE session
CREATE INDEX idx_sessions_overstay     ON parking_sessions(overstay_flagged_at, entry_time)
    WHERE overstay_flagged_at IS NULL AND status = 'ACTIVE';   -- Scheduler scan

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
    id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id      UUID NOT NULL REFERENCES parking_sessions(id),
    amount          NUMERIC(15,0) NOT NULL CHECK (amount > 0),
    method          VARCHAR(50) NOT NULL,   -- CASH | INTERNAL_TRANSFER
    status          payment_status_enum NOT NULL,
    reference_code  VARCHAR(50),
    note            TEXT,
    paid_at         TIMESTAMP,
    collected_by    BIGINT NOT NULL REFERENCES users(user_id),
    refunded_by     BIGINT REFERENCES users(user_id),
    refunded_at     TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_session_id  ON payments(session_id);
CREATE INDEX idx_payments_created_at  ON payments(created_at);
CREATE INDEX idx_payments_collector   ON payments(collected_by);

-- ============================================================
-- EXCEPTIONS
-- ============================================================

CREATE TABLE exceptions (
    id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id      UUID NOT NULL REFERENCES parking_sessions(id),
    exception_type  exception_type_enum  NOT NULL,
    status          exception_status_enum NOT NULL DEFAULT 'PENDING',
    reason          TEXT NOT NULL,
    -- BR-34: resolution bắt buộc trước khi đổi status → APPROVED/REJECTED
    resolution      TEXT,
    resolved_at     TIMESTAMP,
    -- BR-36: hệ thống tự điền, không cho Staff nhập tay
    created_by      BIGINT NOT NULL REFERENCES users(user_id),
    -- BR-33: Manager duyệt Overstay
    approved_by     BIGINT REFERENCES users(user_id),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exceptions_session_type ON exceptions(session_id, exception_type);
CREATE INDEX idx_exceptions_status       ON exceptions(status);
CREATE INDEX idx_exceptions_staff        ON exceptions(created_by);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id  BIGINT NOT NULL REFERENCES users(user_id),
    type          notification_type_enum NOT NULL,
    reference_id  UUID,    -- ID của session / exception liên quan
    message       TEXT NOT NULL,
    is_read       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_unread   ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_created  ON notifications(created_at);

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE reports (
    id               UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    -- BR-41: chỉ Manager được generate
    generated_by     BIGINT NOT NULL REFERENCES users(user_id),
    report_type      report_type_enum NOT NULL,
    period_from      DATE NOT NULL,
    period_to        DATE NOT NULL,
    total_vehicles   INTEGER,
    total_revenue    NUMERIC(15,0),
    -- BR-39: (Occupied+Reserved) / (Total-Maintenance) * 100
    utilization_rate NUMERIC(5,2),
    -- BR-40: khung giờ 60 phút nhiều session nhất
    peak_hour        TIME,
    -- BR-42: snapshot toàn bộ data lúc generate để xem lại
    snapshot_data    JSONB,
    generated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_report_period CHECK (period_to >= period_from)
);

CREATE INDEX idx_reports_manager ON reports(generated_by);
CREATE INDEX idx_reports_period  ON reports(period_from, period_to);

-- ============================================================
-- AUDIT LOGS (Append-only — không UPDATE, không DELETE)
-- ============================================================

CREATE TABLE audit_logs (
    id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(user_id),
    -- SESSION_CREATE | SESSION_EXIT | SLOT_OVERRIDE | PRICING_UPDATE |
    -- EXCEPTION_CREATE | EXCEPTION_APPROVE | ACCOUNT_CHANGE | MANUALLY_OPEN_GATE
    action       VARCHAR(100) NOT NULL,
    entity_name  VARCHAR(100),   -- tên bảng bị tác động: parking_sessions, ...
    entity_id    VARCHAR(100),   -- ID của record
    old_values   JSONB,          -- snapshot trước khi sửa
    new_values   JSONB,          -- snapshot sau khi sửa
    ip_address   VARCHAR(45),    -- IPv4 hoặc IPv6
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user    ON audit_logs(user_id);
CREATE INDEX idx_audit_entity  ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_time    ON audit_logs(created_at);

-- ============================================================
-- SEED DATA — Roles & Privileges mặc định
-- ============================================================

INSERT INTO roles (role_code, role_name, role_description) VALUES
    ('ADMIN',   'System Admin',     'Quản lý tài khoản và phân quyền hệ thống'),
    ('MANAGER', 'Parking Manager',  'Cấu hình slot/pricing, xem báo cáo, quản lý chính sách phí'),
    ('STAFF',   'Parking Staff',    'Xử lý xe vào/ra, tạo session, thu phí, xử lý ngoại lệ'),
    ('DRIVER', 'Driver', 'Vehicle owner');


INSERT INTO privileges (privilege_code, privilege_name) VALUES
    ('USER_MANAGE',       'Quản lý tài khoản'),
    ('ROLE_ASSIGN',       'Phân quyền'),
    ('SESSION_CREATE',    'Tạo session xe vào'),
    ('SESSION_EXIT',      'Xử lý xe ra'),
    ('EXCEPTION_CREATE',  'Tạo exception'),
    ('EXCEPTION_APPROVE', 'Duyệt exception'),
    ('SLOT_MANAGE',       'Quản lý slot/tầng/zone'),
    ('PRICING_MANAGE',    'Cấu hình bảng giá'),
    ('REPORT_VIEW',       'Xem báo cáo'),
    ('DASHBOARD_VIEW',    'Xem dashboard capacity'),
    ('BOOKING_MANAGE',    'Quản lý đặt trước');

-- Admin: tất cả quyền
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.role_id, p.id FROM roles r CROSS JOIN privileges p WHERE r.role_code = 'ADMIN';

-- Manager
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.role_id, p.id FROM roles r JOIN privileges p
ON p.privilege_code IN ('EXCEPTION_APPROVE','SLOT_MANAGE','PRICING_MANAGE','REPORT_VIEW','DASHBOARD_VIEW','BOOKING_MANAGE')
WHERE r.role_code = 'MANAGER';

-- Staff
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.role_id, p.id FROM roles r JOIN privileges p
ON p.privilege_code IN ('SESSION_CREATE','SESSION_EXIT','EXCEPTION_CREATE','DASHBOARD_VIEW')
WHERE r.role_code = 'STAFF';
