-- Migration: Add booth column to voters table
-- This allows storing polling booth information for each voter

-- Add booth_number column to voters table
ALTER TABLE voters
ADD COLUMN IF NOT EXISTS booth_number VARCHAR(50);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_voters_booth_number ON voters(booth_number);

-- Add comment to document the column
COMMENT ON COLUMN voters.booth_number IS 'Polling booth number or identifier where the voter is registered';
