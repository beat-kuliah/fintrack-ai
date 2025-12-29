-- Budget System Migration
-- Add budgets table for monthly budget tracking per category

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    -- category_id NULL = total budget bulanan (untuk semua expense)
    -- category_id UUID = budget untuk category tertentu
    amount FLOAT8 NOT NULL CHECK (amount > 0),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    alert_threshold INTEGER DEFAULT 80 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
    -- alert_threshold: persentase untuk trigger alert (default 80%)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: satu budget per category per bulan per user
    -- category_id NULL dianggap sebagai satu entitas untuk total budget
    CONSTRAINT unique_budget_per_category_month 
        UNIQUE(user_id, category_id, month, year)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(year, month);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year ON budgets(user_id, year, month);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE budgets IS 'Monthly budgets per category or total monthly budget';
COMMENT ON COLUMN budgets.category_id IS 'NULL for total monthly budget, UUID for category-specific budget';
COMMENT ON COLUMN budgets.alert_threshold IS 'Percentage threshold for budget alerts (0-100)';





