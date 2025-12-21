-- Add soft delete support for wallets
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for faster queries on non-deleted wallets
CREATE INDEX IF NOT EXISTS idx_wallets_deleted_at ON wallets(deleted_at) WHERE deleted_at IS NULL;

-- Update foreign key constraint to allow soft delete
-- Change from CASCADE to SET NULL or RESTRICT
-- Note: We'll handle this in application logic instead of changing FK constraint
-- to maintain data integrity while allowing soft delete

