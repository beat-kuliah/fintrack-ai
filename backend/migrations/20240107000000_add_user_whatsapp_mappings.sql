-- Migration: Add user_whatsapp_mappings table
-- Description: Maps WhatsApp phone numbers to user accounts for transaction creation via WhatsApp

CREATE TABLE IF NOT EXISTS user_whatsapp_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(6),
    verification_expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_phone_number UNIQUE (phone_number),
    CONSTRAINT unique_user_phone UNIQUE (user_id, phone_number)
);

-- Indexes for performance
CREATE INDEX idx_phone_number ON user_whatsapp_mappings(phone_number);
CREATE INDEX idx_user_id ON user_whatsapp_mappings(user_id);
CREATE INDEX idx_is_verified ON user_whatsapp_mappings(is_verified);

-- Comments
COMMENT ON TABLE user_whatsapp_mappings IS 'Maps WhatsApp phone numbers to user accounts';
COMMENT ON COLUMN user_whatsapp_mappings.phone_number IS 'WhatsApp phone number in format: 6281234567890 (without +)';
COMMENT ON COLUMN user_whatsapp_mappings.is_verified IS 'Whether the phone number has been verified';
COMMENT ON COLUMN user_whatsapp_mappings.verification_code IS '6-digit verification code sent to user';
COMMENT ON COLUMN user_whatsapp_mappings.verification_expires_at IS 'When the verification code expires (10 minutes from creation)';

