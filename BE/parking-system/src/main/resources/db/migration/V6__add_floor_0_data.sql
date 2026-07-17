-- V6__add_floor_0_data.sql
-- Thêm Tầng 0, các Zone và danh sách các chỗ đỗ xe tương ứng an toàn.

-- 1. Thêm Tầng 0 (Nếu đã tồn tại level_number = 0 thì bỏ qua)
INSERT INTO floors (name, level_number, description, is_active)
VALUES ('Tầng trệt', 0, 'Tầng 0 - Đỗ xe máy và ô tô', true)
ON CONFLICT (level_number) DO NOTHING;

-- 2. Thêm các Zone cho Tầng 0 (nếu chưa tồn tại)
INSERT INTO zones (floor_id, name, vehicle_type, total_slots, is_active)
SELECT (SELECT id FROM floors WHERE level_number = 0 LIMIT 1), 'Khu G - Xe máy', 'MOTORBIKE'::vehicle_type_enum, 20, true
WHERE NOT EXISTS (
    SELECT 1 FROM zones 
    WHERE floor_id = (SELECT id FROM floors WHERE level_number = 0 LIMIT 1) 
    AND name = 'Khu G - Xe máy'
);

INSERT INTO zones (floor_id, name, vehicle_type, total_slots, is_active)
SELECT (SELECT id FROM floors WHERE level_number = 0 LIMIT 1), 'Khu H - Xe ô tô', 'CAR'::vehicle_type_enum, 15, true
WHERE NOT EXISTS (
    SELECT 1 FROM zones 
    WHERE floor_id = (SELECT id FROM floors WHERE level_number = 0 LIMIT 1) 
    AND name = 'Khu H - Xe ô tô'
);

-- 3. Xóa các slot cũ (nếu có) và thêm mới các Slot cho Khu G (Xe máy)
DELETE FROM parking_slots 
WHERE zone_id = (SELECT id FROM zones WHERE name = 'Khu G - Xe máy' AND floor_id = (SELECT id FROM floors WHERE level_number = 0 LIMIT 1) LIMIT 1);

INSERT INTO parking_slots (id, slot_code, floor_id, zone_id, vehicle_type, maintenance_status, current_session_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'G0-' || LPAD(counter::text, 2, '0'),
    (SELECT id FROM floors WHERE level_number = 0 LIMIT 1),
    (SELECT id FROM zones WHERE name = 'Khu G - Xe máy' AND floor_id = (SELECT id FROM floors WHERE level_number = 0 LIMIT 1) LIMIT 1),
    'MOTORBIKE'::vehicle_type_enum,
    'AVAILABLE'::slot_maintenance_enum,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM generate_series(1, 20) AS g(counter);

-- 4. Xóa các slot cũ (nếu có) và thêm mới các Slot cho Khu H (Xe ô tô)
DELETE FROM parking_slots 
WHERE zone_id = (SELECT id FROM zones WHERE name = 'Khu H - Xe ô tô' AND floor_id = (SELECT id FROM floors WHERE level_number = 0 LIMIT 1) LIMIT 1);

INSERT INTO parking_slots (id, slot_code, floor_id, zone_id, vehicle_type, maintenance_status, current_session_id, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'H0-' || LPAD(counter::text, 2, '0'),
    (SELECT id FROM floors WHERE level_number = 0 LIMIT 1),
    (SELECT id FROM zones WHERE name = 'Khu H - Xe ô tô' AND floor_id = (SELECT id FROM floors WHERE level_number = 0 LIMIT 1) LIMIT 1),
    'CAR'::vehicle_type_enum,
    'AVAILABLE'::slot_maintenance_enum,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM generate_series(1, 15) AS g(counter);
