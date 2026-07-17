-- V5__add_in_progress_to_exception_status.sql
-- Thêm giá trị IN_PROGRESS vào enum exception_status_enum

ALTER TYPE exception_status_enum ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
