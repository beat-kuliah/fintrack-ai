-- Add is_default field to wallets table
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

-- Create unique partial index to ensure only one default wallet per user
-- This ensures only one wallet can be default at a time per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_user_default 
ON wallets(user_id) 
WHERE is_default = true AND deleted_at IS NULL;

-- Set existing wallets: if user has no default, set the first cash wallet as default
-- This is a one-time migration for existing data
UPDATE wallets w1
SET is_default = true
WHERE w1.wallet_type = 'cash' 
  AND w1.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM wallets w2 
    WHERE w2.user_id = w1.user_id 
      AND w2.is_default = true 
      AND w2.deleted_at IS NULL
  )
  AND w1.id = (
    SELECT id FROM wallets w3
    WHERE w3.user_id = w1.user_id
      AND w3.wallet_type = 'cash'
      AND w3.deleted_at IS NULL
    ORDER BY w3.created_at ASC
    LIMIT 1
  );

