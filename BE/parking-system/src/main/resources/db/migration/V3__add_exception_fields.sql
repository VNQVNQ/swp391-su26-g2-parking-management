-- V3__add_exception_fields.sql
-- 1. Thêm các cột hỗ trợ xử lý ngoại lệ vào bảng exceptions
-- 2. Thêm loại ngoại lệ WRONG_SPOT vào enum exception_type_enum
-- 3. Tạo bảng penalty_configs lưu cấu hình phí phạt cho ngoại lệ theo loại xe

-- 1. Thêm cột cho bảng exceptions
ALTER TABLE public.exceptions
    ADD COLUMN IF NOT EXISTS evidence_note TEXT,
    ADD COLUMN IF NOT EXISTS sub_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS penalty_fee NUMERIC(15, 0);

COMMENT ON COLUMN public.exceptions.evidence_note IS 'Thông tin xác minh danh tính (SĐT, CCCD, mô tả nhận dạng) cho trường hợp mất vé';
COMMENT ON COLUMN public.exceptions.sub_type IS 'Phân loại chi tiết: WRONG_VEHICLE_TYPE, WRONG_FLOOR, OCCUPIED_RESERVED, MULTIPLE_SLOTS (dùng cho WRONG_ZONE)';
COMMENT ON COLUMN public.exceptions.penalty_fee IS 'Phụ phí ghi nhận trực tiếp trên bản ghi ngoại lệ (VND)';

-- 2. Thêm giá trị WRONG_SPOT vào enum exception_type_enum và RESOLVED vào exception_status_enum
ALTER TYPE exception_type_enum ADD VALUE IF NOT EXISTS 'WRONG_SPOT';
ALTER TYPE exception_status_enum ADD VALUE IF NOT EXISTS 'RESOLVED';

-- 3. Tạo bảng penalty_configs
CREATE TABLE IF NOT EXISTS public.penalty_configs (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type    VARCHAR(20)    NOT NULL,
    exception_type  VARCHAR(30)    NOT NULL,
    penalty_amount  NUMERIC(15, 0) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_by      BIGINT         NOT NULL REFERENCES public.users(user_id),
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP      NOT NULL DEFAULT NOW(),

    -- One config per (vehicle_type × exception_type)
    CONSTRAINT uq_penalty_vehicle_exception UNIQUE (vehicle_type, exception_type)
);

CREATE INDEX IF NOT EXISTS idx_penalty_lookup
    ON public.penalty_configs (vehicle_type, exception_type, is_active);

COMMENT ON TABLE public.penalty_configs IS
    'Admin-configured penalty fees by vehicle type and exception type';
COMMENT ON COLUMN public.penalty_configs.vehicle_type IS
    'MOTORBIKE | CAR | TRUCK';
COMMENT ON COLUMN public.penalty_configs.exception_type IS
    'LOST_TICKET | WRONG_ZONE | WRONG_SPOT';
COMMENT ON COLUMN public.penalty_configs.penalty_amount IS
    'Fixed penalty fee in VND';
COMMENT ON COLUMN public.penalty_configs.is_active IS
    'Soft delete — false means config is disabled';
