-- =====================================================
-- GENERATED REPORTS TABLE
-- Stores metadata for all generated reports
-- =====================================================

CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Organization
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Report Details
    report_type VARCHAR(50) CHECK (report_type IN ('sentiment', 'trends', 'competitor', 'regional', 'custom')) NOT NULL,
    format VARCHAR(20) CHECK (format IN ('pdf', 'excel', 'csv')) NOT NULL,

    -- Filters applied
    filters JSONB DEFAULT '{}'::jsonb,

    -- File information (metadata only, files are generated on-demand client-side)
    file_size BIGINT, -- Size in bytes

    -- Status
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'completed',
    error_message TEXT,

    -- Audit
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_generated_reports_organization ON generated_reports(organization_id);
CREATE INDEX idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX idx_generated_reports_created_by ON generated_reports(created_by);
CREATE INDEX idx_generated_reports_created_at ON generated_reports(created_at DESC);
CREATE INDEX idx_generated_reports_status ON generated_reports(status);

-- RLS Policies
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reports from their organization
CREATE POLICY "Users can view their organization's reports"
    ON generated_reports
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM users
            WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Users can create reports for their organization
CREATE POLICY "Users can create reports for their organization"
    ON generated_reports
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM users
            WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Users can update their own reports
CREATE POLICY "Users can update their own reports"
    ON generated_reports
    FOR UPDATE
    USING (
        created_by IN (
            SELECT id
            FROM users
            WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own reports
CREATE POLICY "Users can delete their own reports"
    ON generated_reports
    FOR DELETE
    USING (
        created_by IN (
            SELECT id
            FROM users
            WHERE auth_user_id = auth.uid()
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_generated_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_generated_reports_updated_at
    BEFORE UPDATE ON generated_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_generated_reports_updated_at();

-- Comment
COMMENT ON TABLE generated_reports IS 'Stores metadata for all generated reports. Actual files are generated client-side on-demand.';
