-- Add protocol column to ir_buttons table
ALTER TABLE ir_buttons 
ADD COLUMN protocol VARCHAR(50) NOT NULL DEFAULT 'NEC' 
AFTER command;

-- Update existing records to have NEC protocol
UPDATE ir_buttons 
SET protocol = 'NEC' 
WHERE protocol IS NULL OR protocol = '';

-- Add index for protocol column for better query performance
CREATE INDEX IF NOT EXISTS idx_ir_buttons_protocol ON ir_buttons(protocol);

-- Add comment to describe the protocol column
ALTER TABLE ir_buttons MODIFY COLUMN protocol VARCHAR(50) NOT NULL DEFAULT 'NEC' COMMENT 'IR protocol used for the command (NEC, RC5, RC6, Sony, etc.)';
