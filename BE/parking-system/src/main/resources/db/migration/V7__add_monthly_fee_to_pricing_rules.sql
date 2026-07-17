-- Add monthly_fee column to pricing_rules
ALTER TABLE pricing_rules ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(15, 0);

-- Migrate existing MONTHLY rules to populate monthly_fee from minimum_fee if null
UPDATE pricing_rules
SET monthly_fee = minimum_fee
WHERE ticket_type = 'MONTHLY' AND (monthly_fee IS NULL OR monthly_fee = 0);
