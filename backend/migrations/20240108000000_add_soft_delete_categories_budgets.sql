-- Add soft delete to categories and budgets
-- Also fix budget constraint from CASCADE to SET NULL for data safety

-- 1. Add deleted_at to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;

-- 2. Add deleted_at to budgets
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_budgets_deleted_at ON budgets(deleted_at) WHERE deleted_at IS NULL;

-- 3. Fix budget constraint: Change from CASCADE to SET NULL for data safety
-- Drop existing constraint
ALTER TABLE budgets 
DROP CONSTRAINT IF EXISTS budgets_category_id_fkey;

-- Add new constraint with SET NULL (safer - budgets won't be deleted when category is deleted)
ALTER TABLE budgets 
ADD CONSTRAINT budgets_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES categories(id) 
ON DELETE SET NULL;

-- Add comments
COMMENT ON COLUMN categories.deleted_at IS 'Soft delete timestamp. NULL means not deleted.';
COMMENT ON COLUMN budgets.deleted_at IS 'Soft delete timestamp. NULL means not deleted.';
COMMENT ON CONSTRAINT budgets_category_id_fkey ON budgets IS 
'Category reference with SET NULL on delete to preserve budget data when category is deleted';




