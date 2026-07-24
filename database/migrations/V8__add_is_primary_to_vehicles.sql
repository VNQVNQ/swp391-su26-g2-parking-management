-- Migration V8: Add is_primary column to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;
