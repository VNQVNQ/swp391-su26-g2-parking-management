-- ============================================================
-- PARKING BUILDING MANAGEMENT SYSTEM — Sample Data v1.0
-- SWP391 · SU26SWP07
-- Sample/Test data for development environment
-- ============================================================

-- ============================================================
-- 1. SEED USERS
-- ============================================================

-- Admin user (password hashed: 123456 using bcrypt)
-- Real hash: $2a$10$wi1hoLfJzrT5QWecLxm0/eHOOv0kboMDlXVkjRUGMkq1LD74Jwm6i





-- ============================================================
-- 1. SEED USERS (Đã sửa đổi role_code và thêm tài khoản Driver)
-- ============================================================

-- Admin user
INSERT INTO users (role_id, full_name, email, phone_number, identify_number, password, address, date_of_birth, gender, user_is_active)
VALUES (
    (SELECT role_id FROM roles WHERE role_code = 'ADMIN' LIMIT 1),
    'Phạm Văn Admin',
    'admin@parking.com',
    '0901000001',
    '001234567890',
    '$2a$10$wi1hoLfJzrT5QWecLxm0/eHOOv0kboMDlXVkjRUGMkq1LD74Jwm6i',
    '100 Đường Abc, TP.HCM',
    '1990-01-15',
    'MALE',
    true
);

-- PARKING_MANAGER user (Sửa từ 'PARKING_MANAGER' thành 'PARKING_MANAGER')
INSERT INTO users (role_id, full_name, email, phone_number, identify_number, password, address, date_of_birth, gender, user_is_active)
VALUES (
    (SELECT role_id FROM roles WHERE role_code = 'PARKING_MANAGER' LIMIT 1),
    'Trần Thị PARKING_MANAGER',
    'PARKING_MANAGER@parking.com',
    '0901000002',
    '001234567891',
    '$2a$10$wi1hoLfJzrT5QWecLxm0/eHOOv0kboMDlXVkjRUGMkq1LD74Jwm6i',
    '101 Đường Def, TP.HCM',
    '1992-03-20',
    'FEMALE',
    true
);

-- PARKING_STAFF users (Sửa từ 'PARKING_STAFF' thành 'PARKING_STAFF')
INSERT INTO users (role_id, full_name, email, phone_number, identify_number, password, address, date_of_birth, gender, user_is_active)
VALUES
(
    (SELECT role_id FROM roles WHERE role_code = 'PARKING_STAFF' LIMIT 1),
    'Nguyễn Văn PARKING_STAFF01',
    'PARKING_STAFF01@parking.com',
    '0901000003',
    '001234567892',
    '$2a$10$wi1hoLfJzrT5QWecLxm0/eHOOv0kboMDlXVkjRUGMkq1LD74Jwm6i',
    '102 Đường Ghi, TP.HCM',
    '1995-05-10',
    'MALE',
    true
),
(
    (SELECT role_id FROM roles WHERE role_code = 'PARKING_STAFF' LIMIT 1),
    'Lê Thị PARKING_STAFF02',
    'PARKING_STAFF02@parking.com',
    '0901000004',
    '001234567893',
    '$2a$10$wi1hoLfJzrT5QWecLxm0/eHOOv0kboMDlXVkjRUGMkq1LD74Jwm6i',
    '103 Đường Jkl, TP.HCM',
    '1996-07-25',
    'FEMALE',
    true
),
(
    (SELECT role_id FROM roles WHERE role_code = 'PARKING_STAFF' LIMIT 1),
    'Hoàng Văn PARKING_STAFF03',
    'PARKING_STAFF03@parking.com',
    '0901000005',
    '001234567894',
    '$2a$10$wi1hoLfJzrT5QWecLxm0/eHOOv0kboMDlXVkjRUGMkq1LD74Jwm6i',
    '104 Đường Mno, TP.HCM',
    '1998-09-30',
    'MALE',
    true
),
(
    (SELECT role_id FROM roles WHERE role_code = 'PARKING_STAFF' LIMIT 1),
    'Đỗ Thị PARKING_STAFF04',
    'PARKING_STAFF04@parking.com',
    '0901000006',
    '001234567895',
    '$2a$10$wi1hoLfJzrT5QWecLxm0/eHOOv0kboMDlXVkjRUGMkq1LD74Jwm6i',
    '105 Đường Pqr, TP.HCM',
    '1997-11-12',
    'FEMALE',
    true
);

-- Driver users (Thêm mới 5 khách hàng gửi xe)
INSERT INTO users (role_id, full_name, email, phone_number, identify_number, password, address, date_of_birth, gender, user_is_active)
VALUES
(
    (SELECT role_id FROM roles WHERE role_code = 'DRIVER' LIMIT 1),
    'Nguyễn Khách Tài Xế 01',
    'driver01@gmail.com',
    '0912000001',
    '001300000001',
    '$2a$10$slYQmyNdGzin7olVAklrue86.OJGSLByyL2L.BT1ZvqWnz.74iEm',
    '200 Lý Thường Kiệt, Q.10, TP.HCM',
    '1993-04-12',
    'MALE',
    true
),
(
    (SELECT role_id FROM roles WHERE role_code = 'DRIVER' LIMIT 1),
    'Trần Thị Tài Xế 02',
    'driver02@gmail.com',
    '0912000002',
    '001300000002',
    '$2a$10$slYQmyNdGzin7olVAklrue86.OJGSLByyL2L.BT1ZvqWnz.74iEm',
    '15 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM',
    '1995-08-22',
    'FEMALE',
    true
),
(
    (SELECT role_id FROM roles WHERE role_code = 'DRIVER' LIMIT 1),
    'Lê Huy Tài Xế 03',
    'driver03@gmail.com',
    '0912000003',
    '001300000003',
    '$2a$10$slYQmyNdGzin7olVAklrue86.OJGSLByyL2L.BT1ZvqWnz.74iEm',
    '456 Nguyễn Huệ, Q.1, TP.HCM',
    '1988-12-05',
    'MALE',
    true
),
(
    (SELECT role_id FROM roles WHERE role_code = 'DRIVER' LIMIT 1),
    'Phạm Minh Tài Xế 04',
    'driver04@gmail.com',
    '0912000004',
    '001300000004',
    '$2a$10$slYQmyNdGzin7olVAklrue86.OJGSLByyL2L.BT1ZvqWnz.74iEm',
    '78 Lê Văn Sỹ, Q.3, TP.HCM',
    '1991-02-17',
    'MALE',
    true
),
(
    (SELECT role_id FROM roles WHERE role_code = 'DRIVER' LIMIT 1),
    'Võ Hoàng Tài Xế 05',
    'driver05@gmail.com',
    '0912000005',
    '001300000005',
    '$2a$10$slYQmyNdGzin7olVAklrue86.OJGSLByyL2L.BT1ZvqWnz.74iEm',
    '12 Tôn Đức Thắng, Q.1, TP.HCM',
    '1994-06-28',
    'FEMALE',
    true
);

-- ============================================================
-- 2. SEED FLOORS
-- ============================================================

INSERT INTO floors (name, level_number, description, is_active)
VALUES
('Hầm B1', -1, 'Tầng hầm B1 - Đỗ xe máy', true),
('Tầng 1', 1, 'Tầng 1 - Đỗ xe ô tô', true),
('Tầng 2', 2, 'Tầng 2 - Đỗ xe ô tô và xe tải', true);

-- ============================================================
-- 3. SEED ZONES
-- ============================================================

-- Get floor IDs for zones
WITH floor_data AS (
    SELECT id, level_number FROM floors
)
INSERT INTO zones (floor_id, name, vehicle_type, total_slots, is_active)
SELECT
    (SELECT id FROM floors WHERE level_number = -1),
    'Khu A - Xe máy',
    'MOTORBIKE'::vehicle_type_enum,
    50,
    true
UNION ALL
SELECT
    (SELECT id FROM floors WHERE level_number = -1),
    'Khu B - Xe máy',
    'MOTORBIKE'::vehicle_type_enum,
    50,
    true
UNION ALL
SELECT
    (SELECT id FROM floors WHERE level_number = 1),
    'Khu C - Xe ô tô',
    'CAR'::vehicle_type_enum,
    30,
    true
UNION ALL
SELECT
    (SELECT id FROM floors WHERE level_number = 1),
    'Khu D - Xe ô tô',
    'CAR'::vehicle_type_enum,
    30,
    true
UNION ALL
SELECT
    (SELECT id FROM floors WHERE level_number = 2),
    'Khu E - Xe ô tô',
    'CAR'::vehicle_type_enum,
    40,
    true
UNION ALL
SELECT
    (SELECT id FROM floors WHERE level_number = 2),
    'Khu F - Xe tải',
    'TRUCK'::vehicle_type_enum,
    20,
    true;

-- ============================================================
-- 4. SEED PARKING SLOTS
-- ============================================================

-- Tầng -1 (Hầm B1): Khu A Xe máy (A1-01 đến A1-50)
INSERT INTO parking_slots (id, slot_code, floor_id, zone_id, vehicle_type, maintenance_status, current_session_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'A1-' || LPAD(counter::text, 2, '0'),
    (SELECT id FROM floors WHERE level_number = -1),
    (SELECT id FROM zones WHERE name = 'Khu A - Xe máy'),
    'MOTORBIKE'::vehicle_type_enum,
    CASE WHEN counter = 5 THEN 'MAINTENANCE'::slot_maintenance_enum ELSE 'AVAILABLE'::slot_maintenance_enum END,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM generate_series(1, 50) AS g(counter);

-- Tầng -1 (Hầm B1): Khu B Xe máy (B1-01 đến B1-50)
INSERT INTO parking_slots (id, slot_code, floor_id, zone_id, vehicle_type, maintenance_status, current_session_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'B1-' || LPAD(counter::text, 2, '0'),
    (SELECT id FROM floors WHERE level_number = -1),
    (SELECT id FROM zones WHERE name = 'Khu B - Xe máy'),
    'MOTORBIKE'::vehicle_type_enum,
    CASE WHEN counter = 25 THEN 'MAINTENANCE'::slot_maintenance_enum ELSE 'AVAILABLE'::slot_maintenance_enum END,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM generate_series(1, 50) AS g(counter);

-- Tầng 1: Khu C Xe ô tô (C1-01 đến C1-30)
INSERT INTO parking_slots (id, slot_code, floor_id, zone_id, vehicle_type, maintenance_status, current_session_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'C1-' || LPAD(counter::text, 2, '0'),
    (SELECT id FROM floors WHERE level_number = 1),
    (SELECT id FROM zones WHERE name = 'Khu C - Xe ô tô'),
    'CAR',
    'AVAILABLE',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM generate_series(1, 30) AS g(counter);

-- Tầng 1: Khu D Xe ô tô (D1-01 đến D1-30)
INSERT INTO parking_slots (id, slot_code, floor_id, zone_id, vehicle_type, maintenance_status, current_session_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'D1-' || LPAD(counter::text, 2, '0'),
    (SELECT id FROM floors WHERE level_number = 1),
    (SELECT id FROM zones WHERE name = 'Khu D - Xe ô tô'),
    'CAR',
    'AVAILABLE',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM generate_series(1, 30) AS g(counter);

-- Tầng 2: Khu E Xe ô tô (E2-01 đến E2-40)
INSERT INTO parking_slots (id, slot_code, floor_id, zone_id, vehicle_type, maintenance_status, current_session_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'E2-' || LPAD(counter::text, 2, '0'),
    (SELECT id FROM floors WHERE level_number = 2),
    (SELECT id FROM zones WHERE name = 'Khu E - Xe ô tô'),
    'CAR',
    'AVAILABLE',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM generate_series(1, 40) AS g(counter);

-- Tầng 2: Khu F Xe tải (F2-01 đến F2-20)
INSERT INTO parking_slots (id, slot_code, floor_id, zone_id, vehicle_type, maintenance_status, current_session_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'F2-' || LPAD(counter::text, 2, '0'),
    (SELECT id FROM floors WHERE level_number = 2),
    (SELECT id FROM zones WHERE name = 'Khu F - Xe tải'),
    'TRUCK',
    'AVAILABLE',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM generate_series(1, 20) AS g(counter);

-- ============================================================
-- 5. SEED VEHICLES
-- ============================================================

INSERT INTO vehicles (id, user_id, license_plate, vehicle_type, has_monthly_pass, monthly_pass_expiry, is_active)
VALUES
-- Motors
(gen_random_uuid(), NULL, '59A1-20001', 'MOTORBIKE', false, NULL, true),
(gen_random_uuid(), NULL, '59A1-20002', 'MOTORBIKE', false, NULL, true),
(gen_random_uuid(), NULL, '59A1-20003', 'MOTORBIKE', true, CURRENT_DATE + INTERVAL '30 days', true),

-- Cars
(gen_random_uuid(), NULL, '51A-12345', 'CAR', false, NULL, true),
(gen_random_uuid(), NULL, '51A-12346', 'CAR', false, NULL, true),
(gen_random_uuid(), NULL, '51A-12347', 'CAR', true, CURRENT_DATE + INTERVAL '15 days', true),
(gen_random_uuid(), NULL, '51A-12348', 'CAR', false, NULL, true),

-- Trucks
(gen_random_uuid(), NULL, '51A-99001', 'TRUCK', false, NULL, true),
(gen_random_uuid(), NULL, '51A-99002', 'TRUCK', true, CURRENT_DATE + INTERVAL '45 days', true);

-- ============================================================
-- 6. SEED PRICING RULES
-- ============================================================

-- PARKING_MANAGER user ID for creating pricing rules
-- We'll use the first PARKING_MANAGER ID

-- Motorbike pricing
INSERT INTO pricing_rules (zone_id, name, vehicle_type, ticket_type, rate_per_hour, minimum_fee, maximum_daily_fee, overstay_rate_multiplier, peak_hour_start, peak_hour_end, peak_hour_multiplier, effective_from, effective_to, is_active, created_by)
VALUES
(NULL, 'Giá xe máy - Vé theo giờ', 'MOTORBIKE', 'HOURLY', 5000, 5000, 50000, 2.0, '08:00', '17:00', 1.5, CURRENT_DATE, NULL, true, (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com' LIMIT 1)),
(NULL, 'Giá xe máy - Vé theo ngày', 'MOTORBIKE', 'DAILY', 4000, 20000, 30000, 2.0, NULL, NULL, NULL, CURRENT_DATE, NULL, true, (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com' LIMIT 1)),
(NULL, 'Giá xe máy - Vé tháng', 'MOTORBIKE', 'MONTHLY', 2000, 200000, NULL, 1.0, NULL, NULL, NULL, CURRENT_DATE, NULL, true, (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com' LIMIT 1)),

-- Car pricing
(NULL, 'Giá xe ô tô - Vé theo giờ', 'CAR', 'HOURLY', 10000, 15000, 150000, 2.5, '08:00', '17:00', 1.5, CURRENT_DATE, NULL, true, (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com' LIMIT 1)),
(NULL, 'Giá xe ô tô - Vé theo ngày', 'CAR', 'DAILY', 8000, 50000, 100000, 2.5, NULL, NULL, NULL, CURRENT_DATE, NULL, true, (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com' LIMIT 1)),
(NULL, 'Giá xe ô tô - Vé tháng', 'CAR', 'MONTHLY', 5000, 500000, NULL, 1.0, NULL, NULL, NULL, CURRENT_DATE, NULL, true, (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com' LIMIT 1)),

-- Truck pricing
(NULL, 'Giá xe tải - Vé theo giờ', 'TRUCK', 'HOURLY', 20000, 30000, 250000, 2.0, '08:00', '17:00', 1.5, CURRENT_DATE, NULL, true, (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com' LIMIT 1)),
(NULL, 'Giá xe tải - Vé theo ngày', 'TRUCK', 'DAILY', 15000, 80000, 200000, 2.0, NULL, NULL, NULL, CURRENT_DATE, NULL, true, (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com' LIMIT 1)),
(NULL, 'Giá xe tải - Vé tháng', 'TRUCK', 'MONTHLY', 10000, 1000000, NULL, 1.0, NULL, NULL, NULL, CURRENT_DATE, NULL, true, (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com' LIMIT 1));

-- ============================================================
-- 7. SEED MONTHLY PASSES
-- ============================================================

INSERT INTO monthly_passes (vehicle_id, slot_id, start_date, end_date, fee, payment_status, is_active)
SELECT DISTINCT ON (v.id)
    v.id,
    ps.id,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    CASE
        WHEN v.vehicle_type = 'MOTORBIKE' THEN 200000
        WHEN v.vehicle_type = 'CAR' THEN 500000
        WHEN v.vehicle_type = 'TRUCK' THEN 1000000
    END,
    'PAID',
    true
FROM vehicles v
CROSS JOIN parking_slots ps
WHERE v.has_monthly_pass = true
  AND ps.maintenance_status = 'AVAILABLE'
  AND ps.vehicle_type = v.vehicle_type;

-- ============================================================
-- 8. SEED BOOKINGS
-- ============================================================

-- Sample bookings for next 2 days
INSERT INTO bookings (vehicle_id, slot_id, booking_code, start_time, end_time, booking_expiry_at, status)
SELECT
    v.id,
    ps.id,
    'BR-' || UPPER(SUBSTR(MD5(RANDOM()::text || v.id::text), 1, 8)),
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '1 day 2 hours',
    CURRENT_TIMESTAMP + INTERVAL '1 day 30 minutes',
    'PENDING'
FROM (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 5) v
CROSS JOIN (SELECT id FROM parking_slots WHERE maintenance_status = 'AVAILABLE' ORDER BY RANDOM() LIMIT 5) ps
LIMIT 5;

-- ============================================================
-- 9. SEED PARKING SESSIONS
-- ============================================================

-- Recent completed sessions
INSERT INTO parking_sessions (vehicle_id, slot_id, staff_entry_id, staff_exit_id, applied_rule_id, entry_time, exit_time, fee, discount_amount, final_fee, payment_status, status, ticket_type, face_verified_at_exit, staff_override_used)
SELECT DISTINCT ON (v.id, ps.id)
    v.id,
    ps.id,
    (SELECT user_id FROM users WHERE email = 'PARKING_STAFF01@parking.com'),
    (SELECT user_id FROM users WHERE email = 'PARKING_STAFF02@parking.com'),
    (SELECT id FROM pricing_rules WHERE vehicle_type = v.vehicle_type AND ticket_type = 'HOURLY' LIMIT 1),
    (CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    (CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    CASE WHEN v.vehicle_type = 'MOTORBIKE' THEN 10000
         WHEN v.vehicle_type = 'CAR' THEN 20000
         ELSE 40000 END,
    0,
    CASE WHEN v.vehicle_type = 'MOTORBIKE' THEN 10000
         WHEN v.vehicle_type = 'CAR' THEN 20000
         ELSE 40000 END,
    'PAID',
    'COMPLETED',
    'HOURLY',
    true,
    false
FROM (
    SELECT id, vehicle_type FROM vehicles ORDER BY RANDOM() LIMIT 3
) v
CROSS JOIN (SELECT id, vehicle_type FROM parking_slots WHERE maintenance_status = 'AVAILABLE' ORDER BY RANDOM() LIMIT 1) ps
WHERE ps.vehicle_type = v.vehicle_type;

-- Active sessions (currently parked)
INSERT INTO parking_sessions (vehicle_id, slot_id, staff_entry_id, applied_rule_id, entry_time, fee, discount_amount, final_fee, payment_status, status, ticket_type, face_verified_at_exit, staff_override_used)
SELECT DISTINCT ON (v.id, ps.id)
    v.id,
    ps.id,
    (SELECT user_id FROM users WHERE email = 'PARKING_STAFF03@parking.com'),
    (SELECT id FROM pricing_rules WHERE vehicle_type = v.vehicle_type AND ticket_type = 'HOURLY' LIMIT 1),
    (CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
    NULL,
    0,
    NULL,
    'UNPAID',
    'ACTIVE',
    'HOURLY',
    false,
    false
FROM (
    SELECT id, vehicle_type FROM vehicles ORDER BY RANDOM() LIMIT 2 OFFSET 3
) v
CROSS JOIN (SELECT id, vehicle_type FROM parking_slots WHERE maintenance_status = 'AVAILABLE' ORDER BY RANDOM() LIMIT 1) ps
WHERE ps.vehicle_type = v.vehicle_type;

-- ============================================================
-- 10. SEED PAYMENTS
-- ============================================================

INSERT INTO payments (session_id, amount, method, status, reference_code, paid_at, collected_by)
SELECT
    ps.id,
    COALESCE(ps.final_fee, ps.fee, 0),
    CASE WHEN RANDOM() > 0.5 THEN 'CASH' ELSE 'INTERNAL_TRANSFER' END,
    'PAID',
    'REF-' || UPPER(SUBSTR(MD5(RANDOM()::text), 1, 6)),
    CURRENT_TIMESTAMP,
    (SELECT user_id FROM users WHERE email = 'PARKING_STAFF04@parking.com')
FROM parking_sessions ps
WHERE ps.status = 'COMPLETED' AND ps.payment_status = 'PAID'
AND NOT EXISTS (SELECT 1 FROM payments WHERE session_id = ps.id);

-- ============================================================
-- 11. SEED EXCEPTIONS
-- ============================================================

INSERT INTO exceptions (session_id, exception_type, status, reason, created_by)
SELECT
    ps.id,
    'OVERSTAY',
    'PENDING',
    'Xe đỗ quá thời gian cho phép, vượt quá 24 giờ',
    (SELECT user_id FROM users WHERE email = 'PARKING_STAFF01@parking.com')
FROM parking_sessions ps
WHERE ps.status = 'ACTIVE'
AND (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ps.entry_time)) / 3600) > 24
AND NOT EXISTS (SELECT 1 FROM exceptions WHERE session_id = ps.id)
LIMIT 2;

-- ============================================================
-- 12. SEED NOTIFICATIONS
-- ============================================================

INSERT INTO notifications (recipient_id, type, reference_id, message, is_read)
SELECT
    (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com'),
    'OVERSTAY_ALERT',
    ps.id,
    'Cảnh báo: Xe ' || v.license_plate || ' đang đỗ quá 24 giờ tại slot ' || slots.slot_code,
    false
FROM parking_sessions ps
JOIN vehicles v ON ps.vehicle_id = v.id
JOIN parking_slots slots ON ps.slot_id = slots.id
WHERE ps.status = 'ACTIVE'
AND (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ps.entry_time)) / 3600) > 24
LIMIT 2;

INSERT INTO notifications (recipient_id, type, message, is_read)
SELECT
    (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com'),
    'EXCEPTION_PENDING',
    'Có ' || COUNT(*) || ' exception đang chờ duyệt',
    false
FROM exceptions
WHERE status = 'PENDING'
GROUP BY 1
HAVING COUNT(*) > 0;

-- ============================================================
-- 13. SEED REPORTS
-- ============================================================

INSERT INTO reports (generated_by, report_type, period_from, period_to, total_vehicles, total_revenue, utilization_rate, generated_at)
VALUES
(
    (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com'),
    'REVENUE',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE,
    45,
    (SELECT SUM(COALESCE(final_fee, fee, 0)) FROM parking_sessions WHERE status = 'COMPLETED'),
    65.5,
    CURRENT_TIMESTAMP
),
(
    (SELECT user_id FROM users WHERE email = 'PARKING_MANAGER@parking.com'),
    'UTILIZATION',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    NULL,
    NULL,
    72.3,
    CURRENT_TIMESTAMP
);

-- ============================================================
-- 14. SEED AUDIT LOGS
-- ============================================================

INSERT INTO audit_logs (user_id, action, entity_name, entity_id, new_values, ip_address)
SELECT
    (SELECT user_id FROM users WHERE email = 'PARKING_STAFF01@parking.com'),
    'SESSION_CREATE',
    'parking_sessions',
    ps.id::text,
    jsonb_build_object(
        'vehicle_id', ps.vehicle_id::text,
        'slot_id', ps.slot_id::text,
        'entry_time', ps.entry_time::text
    ),
    '192.168.1.100'
FROM parking_sessions ps
WHERE ps.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
LIMIT 5;

INSERT INTO audit_logs (user_id, action, entity_name, entity_id, old_values, new_values, ip_address)
SELECT
    (SELECT user_id FROM users WHERE email = 'PARKING_STAFF02@parking.com'),
    'SESSION_EXIT',
    'parking_sessions',
    ps.id::text,
    jsonb_build_object('status', 'ACTIVE'),
    jsonb_build_object(
        'status', 'COMPLETED',
        'exit_time', ps.exit_time::text,
        'fee', ps.fee::text
    ),
    '192.168.1.101'
FROM parking_sessions ps
WHERE ps.status = 'COMPLETED' AND ps.exit_time IS NOT NULL
LIMIT 5;

-- ============================================================
-- SUMMARY
-- ============================================================
-- Data seeded successfully:
-- - 1 Admin, 1 PARKING_MANAGER, 4 PARKING_STAFF users
-- - 3 Floors with 6 Zones
-- - 270 Parking Slots (50+50+30+30+40+20)
-- - 9 Vehicles (3 motorbikes, 4 cars, 2 trucks)
-- - 10 Pricing Rules
-- - 3 Monthly Passes
-- - 5 Bookings
-- - 5 Parking Sessions (3 completed, 2 active)
-- - Payment records for completed sessions
-- - Exception records (overstay)
-- - Notification samples
-- - Report samples
-- - Audit logs





