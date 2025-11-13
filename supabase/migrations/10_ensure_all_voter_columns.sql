-- Migration: Ensure all voter form columns exist
-- This migration ensures all columns needed by the voter form are present
-- Uses IF NOT EXISTS so it's safe to run multiple times

-- Core identity columns
ALTER TABLE voters ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);

-- Basic info
ALTER TABLE voters ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS voter_id VARCHAR(50);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Contact info
ALTER TABLE voters ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Address
ALTER TABLE voters ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(200);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(200);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS ward VARCHAR(100);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS booth_number VARCHAR(50);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

-- Demographics
ALTER TABLE voters ADD COLUMN IF NOT EXISTS caste VARCHAR(50);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS religion VARCHAR(50);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS education VARCHAR(50);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);

-- Political data
ALTER TABLE voters ADD COLUMN IF NOT EXISTS party_affiliation VARCHAR(20);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS sentiment VARCHAR(30);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS influence_level VARCHAR(20);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS voting_history JSONB;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS is_opinion_leader BOOLEAN;

-- Engagement
ALTER TABLE voters ADD COLUMN IF NOT EXISTS contact_frequency INTEGER;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS interaction_count INTEGER;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS positive_interactions INTEGER;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS negative_interactions INTEGER;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- Status flags
ALTER TABLE voters ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS is_verified BOOLEAN;

-- Metadata
ALTER TABLE voters ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Set defaults for columns that should have them
ALTER TABLE voters ALTER COLUMN party_affiliation SET DEFAULT 'unknown';
ALTER TABLE voters ALTER COLUMN sentiment SET DEFAULT 'neutral';
ALTER TABLE voters ALTER COLUMN influence_level SET DEFAULT 'low';
ALTER TABLE voters ALTER COLUMN voting_history SET DEFAULT '[]'::jsonb;
ALTER TABLE voters ALTER COLUMN tags SET DEFAULT '[]'::jsonb;
ALTER TABLE voters ALTER COLUMN is_opinion_leader SET DEFAULT false;
ALTER TABLE voters ALTER COLUMN contact_frequency SET DEFAULT 0;
ALTER TABLE voters ALTER COLUMN interaction_count SET DEFAULT 0;
ALTER TABLE voters ALTER COLUMN positive_interactions SET DEFAULT 0;
ALTER TABLE voters ALTER COLUMN negative_interactions SET DEFAULT 0;
ALTER TABLE voters ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE voters ALTER COLUMN is_verified SET DEFAULT false;
ALTER TABLE voters ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE voters ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add constraints where needed
DO $$
BEGIN
    -- Make first_name NOT NULL if it isn't already
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'voters'
               AND column_name = 'first_name'
               AND is_nullable = 'YES') THEN
        -- Can't make it NOT NULL if table has data, so skip this
        RAISE NOTICE 'first_name column exists but is nullable';
    END IF;

    -- Add unique constraint on voter_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = 'voters_voter_id_key') THEN
        ALTER TABLE voters ADD CONSTRAINT voters_voter_id_key UNIQUE (voter_id);
    END IF;

    -- Add check constraint on age if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = 'voters_age_check') THEN
        ALTER TABLE voters ADD CONSTRAINT voters_age_check CHECK (age IS NULL OR (age >= 18 AND age <= 120));
    END IF;

    -- Add check constraint on gender if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = 'voters_gender_check') THEN
        ALTER TABLE voters ADD CONSTRAINT voters_gender_check CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_voters_voter_id ON voters(voter_id);
CREATE INDEX IF NOT EXISTS idx_voters_phone ON voters(phone);
CREATE INDEX IF NOT EXISTS idx_voters_booth_number ON voters(booth_number);
CREATE INDEX IF NOT EXISTS idx_voters_ward ON voters(ward);
CREATE INDEX IF NOT EXISTS idx_voters_party ON voters(party_affiliation);
CREATE INDEX IF NOT EXISTS idx_voters_sentiment ON voters(sentiment);
CREATE INDEX IF NOT EXISTS idx_voters_active ON voters(is_active);
CREATE INDEX IF NOT EXISTS idx_voters_created_at ON voters(created_at);

-- Add helpful comments
COMMENT ON COLUMN voters.booth_number IS 'Polling booth number or identifier where the voter is registered';
COMMENT ON COLUMN voters.caste IS 'Caste category: General, OBC, SC, ST, Other';
COMMENT ON COLUMN voters.religion IS 'Religion: Hindu, Muslim, Christian, Sikh, Buddhist, Jain, Other';
COMMENT ON COLUMN voters.education IS 'Education level: Illiterate, Primary, Secondary, Graduate, Post Graduate, Doctorate';
COMMENT ON COLUMN voters.occupation IS 'Voter occupation or profession';
