-- Add credit_limit field to wallets table for credit cards and paylater
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS credit_limit FLOAT8;

-- Add comment to explain the field
COMMENT ON COLUMN wallets.credit_limit IS 'Credit limit for credit cards and paylater. NULL for regular wallets.';

