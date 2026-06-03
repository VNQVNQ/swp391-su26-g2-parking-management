-- Flyway Migration: V1__Create_Parking_Tables.sql
-- Version: 1.0
-- Description: Create initial parking management database schema

-- Create FLOORS table
CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL UNIQUE,
    total_slots INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for floors
CREATE INDEX IF NOT EXISTS idx_floor_level ON floors(level);

-- Create ZONES table
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    total_slots INTEGER NOT NULL,
    available_slots INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_zones_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
);

-- Create indexes for zones
CREATE INDEX IF NOT EXISTS idx_zone_floor_id ON zones(floor_id);
CREATE INDEX IF NOT EXISTS idx_zone_vehicle_type ON zones(vehicle_type);

-- Create PARKING_SLOTS table
CREATE TABLE IF NOT EXISTS parking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_code VARCHAR(20) NOT NULL UNIQUE,
    floor_id UUID NOT NULL,
    zone_id UUID NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'FREE',
    current_session_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parking_slot_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE,
    CONSTRAINT fk_parking_slot_zone FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

-- Create indexes for parking_slots
CREATE INDEX IF NOT EXISTS idx_parking_slot_code ON parking_slots(slot_code);
CREATE INDEX IF NOT EXISTS idx_parking_slot_floor_id ON parking_slots(floor_id);
CREATE INDEX IF NOT EXISTS idx_parking_slot_zone_id ON parking_slots(zone_id);
CREATE INDEX IF NOT EXISTS idx_parking_slot_status ON parking_slots(status);

-- Add comment on tables
COMMENT ON TABLE floors IS 'Stores physical floor layout of the parking building';
COMMENT ON TABLE zones IS 'Each floor is divided into zones by vehicle type';
COMMENT ON TABLE parking_slots IS 'Individual slot records with real-time status';

