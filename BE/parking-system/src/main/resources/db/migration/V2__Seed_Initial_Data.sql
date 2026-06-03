-- Flyway Migration: V2__Seed_Initial_Data.sql
-- Version: 1.0
-- Description: Insert initial seed data for testing

-- Insert sample floors
INSERT INTO floors (name, level, total_slots, created_at, updated_at) VALUES
('Basement 2', -2, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Basement 1', -1, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Ground Floor', 0, 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Floor 1', 1, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Floor 2', 2, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Get floor IDs for zones
DO $$
DECLARE
    floor_minus2_id UUID;
    floor_minus1_id UUID;
    floor_0_id UUID;
    floor_1_id UUID;
    floor_2_id UUID;
    zone_id UUID;
    i INTEGER;
BEGIN
    SELECT id INTO floor_minus2_id FROM floors WHERE level = -2 LIMIT 1;
    SELECT id INTO floor_minus1_id FROM floors WHERE level = -1 LIMIT 1;
    SELECT id INTO floor_0_id FROM floors WHERE level = 0 LIMIT 1;
    SELECT id INTO floor_1_id FROM floors WHERE level = 1 LIMIT 1;
    SELECT id INTO floor_2_id FROM floors WHERE level = 2 LIMIT 1;

    -- Insert zones for Basement 2 (Motorbikes and Cars)
    IF floor_minus2_id IS NOT NULL THEN
        INSERT INTO zones (floor_id, name, vehicle_type, total_slots, available_slots, created_at, updated_at)
        VALUES
            (floor_minus2_id, 'Zone A - Motorbikes', 'MOTORBIKE', 25, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (floor_minus2_id, 'Zone B - Cars', 'CAR', 25, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;

        -- Insert parking slots for Basement 2
        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_minus2_id AND vehicle_type = 'MOTORBIKE' LIMIT 1;
        FOR i IN 1..25 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('B2-MB-' || LPAD(i::text, 3, '0'), floor_minus2_id, zone_id, 'MOTORBIKE', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;

        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_minus2_id AND vehicle_type = 'CAR' LIMIT 1;
        FOR i IN 1..25 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('B2-CA-' || LPAD(i::text, 3, '0'), floor_minus2_id, zone_id, 'CAR', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Insert zones for Basement 1
    IF floor_minus1_id IS NOT NULL THEN
        INSERT INTO zones (floor_id, name, vehicle_type, total_slots, available_slots, created_at, updated_at)
        VALUES
            (floor_minus1_id, 'Zone A - Motorbikes', 'MOTORBIKE', 20, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (floor_minus1_id, 'Zone B - Cars', 'CAR', 25, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (floor_minus1_id, 'Zone C - Trucks', 'TRUCK', 15, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;

        -- Insert parking slots for Basement 1
        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_minus1_id AND vehicle_type = 'MOTORBIKE' LIMIT 1;
        FOR i IN 1..20 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('B1-MB-' || LPAD(i::text, 3, '0'), floor_minus1_id, zone_id, 'MOTORBIKE', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;

        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_minus1_id AND vehicle_type = 'CAR' LIMIT 1;
        FOR i IN 1..25 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('B1-CA-' || LPAD(i::text, 3, '0'), floor_minus1_id, zone_id, 'CAR', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;

        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_minus1_id AND vehicle_type = 'TRUCK' LIMIT 1;
        FOR i IN 1..15 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('B1-TR-' || LPAD(i::text, 3, '0'), floor_minus1_id, zone_id, 'TRUCK', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Insert zones for Ground Floor
    IF floor_0_id IS NOT NULL THEN
        INSERT INTO zones (floor_id, name, vehicle_type, total_slots, available_slots, created_at, updated_at)
        VALUES
            (floor_0_id, 'Zone A - Motorbikes', 'MOTORBIKE', 30, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (floor_0_id, 'Zone B - Cars', 'CAR', 40, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (floor_0_id, 'Zone C - Trucks', 'TRUCK', 10, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;

        -- Insert parking slots for Ground Floor
        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_0_id AND vehicle_type = 'MOTORBIKE' LIMIT 1;
        FOR i IN 1..30 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('G0-MB-' || LPAD(i::text, 3, '0'), floor_0_id, zone_id, 'MOTORBIKE', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;

        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_0_id AND vehicle_type = 'CAR' LIMIT 1;
        FOR i IN 1..40 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('G0-CA-' || LPAD(i::text, 3, '0'), floor_0_id, zone_id, 'CAR', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;

        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_0_id AND vehicle_type = 'TRUCK' LIMIT 1;
        FOR i IN 1..10 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('G0-TR-' || LPAD(i::text, 3, '0'), floor_0_id, zone_id, 'TRUCK', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Insert zones for Floor 1
    IF floor_1_id IS NOT NULL THEN
        INSERT INTO zones (floor_id, name, vehicle_type, total_slots, available_slots, created_at, updated_at)
        VALUES
            (floor_1_id, 'Zone A - Motorbikes', 'MOTORBIKE', 40, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (floor_1_id, 'Zone B - Cars', 'CAR', 50, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (floor_1_id, 'Zone C - Trucks', 'TRUCK', 10, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;

        -- Insert parking slots for Floor 1
        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_1_id AND vehicle_type = 'MOTORBIKE' LIMIT 1;
        FOR i IN 1..40 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('F1-MB-' || LPAD(i::text, 3, '0'), floor_1_id, zone_id, 'MOTORBIKE', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;

        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_1_id AND vehicle_type = 'CAR' LIMIT 1;
        FOR i IN 1..50 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('F1-CA-' || LPAD(i::text, 3, '0'), floor_1_id, zone_id, 'CAR', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;

        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_1_id AND vehicle_type = 'TRUCK' LIMIT 1;
        FOR i IN 1..10 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('F1-TR-' || LPAD(i::text, 3, '0'), floor_1_id, zone_id, 'TRUCK', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Insert zones for Floor 2
    IF floor_2_id IS NOT NULL THEN
        INSERT INTO zones (floor_id, name, vehicle_type, total_slots, available_slots, created_at, updated_at)
        VALUES
            (floor_2_id, 'Zone A - Motorbikes', 'MOTORBIKE', 40, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (floor_2_id, 'Zone B - Cars', 'CAR', 50, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (floor_2_id, 'Zone C - Trucks', 'TRUCK', 10, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;

        -- Insert parking slots for Floor 2
        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_2_id AND vehicle_type = 'MOTORBIKE' LIMIT 1;
        FOR i IN 1..40 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('F2-MB-' || LPAD(i::text, 3, '0'), floor_2_id, zone_id, 'MOTORBIKE', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;

        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_2_id AND vehicle_type = 'CAR' LIMIT 1;
        FOR i IN 1..50 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('F2-CA-' || LPAD(i::text, 3, '0'), floor_2_id, zone_id, 'CAR', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;

        SELECT id INTO zone_id FROM zones WHERE floor_id = floor_2_id AND vehicle_type = 'TRUCK' LIMIT 1;
        FOR i IN 1..10 LOOP
            INSERT INTO parking_slots (slot_code, floor_id, zone_id, vehicle_type, status, created_at, updated_at)
            VALUES
                ('F2-TR-' || LPAD(i::text, 3, '0'), floor_2_id, zone_id, 'TRUCK', 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

