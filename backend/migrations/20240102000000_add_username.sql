-- Add username field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Update existing users: set username from name (lowercase, replace spaces with underscore)
-- Add unique suffix if username already exists
UPDATE users 
SET username = LOWER(REPLACE(name, ' ', '_')) || '_' || SUBSTRING(id::text, 1, 8)
WHERE username IS NULL;

-- Make username NOT NULL and UNIQUE after setting default values
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);

