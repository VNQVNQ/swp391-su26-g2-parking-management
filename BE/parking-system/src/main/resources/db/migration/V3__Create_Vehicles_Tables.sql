-- Flyway Migration: V3__Create_Vehicles_Tables.sql
-- Version: 1.0
-- Description: Create vehicles and monthly_passes tables with comprehensive indexing

-- Create VEHICLES table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL,
    owner_name VARCHAR(100),
    phone VARCHAR(20),
    has_monthly_pass BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_pass_expiry DATE,
    face_descriptor BYTEA,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_license_plate_pattern ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_has_monthly_pass ON vehicles(has_monthly_pass);
CREATE INDEX IF NOT EXISTS idx_monthly_pass_expiry ON vehicles(monthly_pass_expiry);
CREATE INDEX IF NOT EXISTS idx_is_active ON vehicles(is_active);

-- Create MONTHLY_PASSES table
CREATE TABLE IF NOT EXISTS monthly_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    slot_id UUID,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    fee NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_monthly_pass_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_monthly_pass_slot FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE SET NULL
);

-- Create indexes for monthly_passes
CREATE INDEX IF NOT EXISTS idx_monthly_pass_vehicle_id ON monthly_passes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_monthly_pass_end_date ON monthly_passes(end_date);
CREATE INDEX IF NOT EXISTS idx_monthly_pass_status ON monthly_passes(payment_status);
CREATE INDEX IF NOT EXISTS idx_monthly_pass_is_active ON monthly_passes(is_active);

-- Add comments
COMMENT ON TABLE vehicles IS 'Stores vehicle information with license plate and monthly pass details';
COMMENT ON TABLE monthly_passes IS 'Stores monthly parking pass information linked to vehicles';
