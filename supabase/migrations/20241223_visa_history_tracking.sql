-- =====================================================
-- Visa History Tracking System
-- Automatically logs all visa-related changes for trend analysis
-- =====================================================

-- Create visa history table
CREATE TABLE IF NOT EXISTS visa_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee_table(id) ON DELETE CASCADE,
    old_expiry_date DATE,
    new_expiry_date DATE,
    old_status TEXT,
    new_status TEXT,
    change_type TEXT, -- 'renewal', 'new_visa', 'status_change', 'correction'
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID, -- References admin user if available
    notes TEXT
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_visa_history_employee ON visa_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_visa_history_changed_at ON visa_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_visa_history_status ON visa_history(new_status, changed_at);

-- Function to calculate visa status from expiry date
CREATE OR REPLACE FUNCTION calculate_visa_status(expiry_date DATE)
RETURNS TEXT AS $$
BEGIN
    IF expiry_date IS NULL THEN
        RETURN 'unknown';
    END IF;
    
    IF expiry_date < CURRENT_DATE THEN
        RETURN 'expired';
    ELSIF expiry_date <= (CURRENT_DATE + INTERVAL '30 days') THEN
        RETURN 'expiring_soon';
    ELSE
        RETURN 'valid';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to automatically log visa changes
CREATE OR REPLACE FUNCTION log_visa_change()
RETURNS TRIGGER AS $$
DECLARE
    old_status TEXT;
    new_status TEXT;
    change_type TEXT;
BEGIN
    -- Calculate statuses
    old_status := calculate_visa_status(OLD.visa_expiry_date);
    new_status := calculate_visa_status(NEW.visa_expiry_date);
    
    -- Determine change type
    IF OLD.visa_expiry_date IS NULL AND NEW.visa_expiry_date IS NOT NULL THEN
        change_type := 'new_visa';
    ELSIF OLD.visa_expiry_date != NEW.visa_expiry_date THEN
        change_type := 'renewal';
    ELSIF old_status != new_status THEN
        change_type := 'status_change';
    ELSE
        -- No meaningful change, skip logging
        RETURN NEW;
    END IF;
    
    -- Insert history record
    INSERT INTO visa_history(
        employee_id,
        old_expiry_date,
        new_expiry_date,
        old_status,
        new_status,
        change_type,
        changed_at
    ) VALUES (
        NEW.id,
        OLD.visa_expiry_date,
        NEW.visa_expiry_date,
        old_status,
        new_status,
        change_type,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only fires when visa_expiry_date actually changes)
DROP TRIGGER IF EXISTS track_visa_changes ON employee_table;
CREATE TRIGGER track_visa_changes
    AFTER UPDATE OF visa_expiry_date ON employee_table
    FOR EACH ROW
    WHEN (OLD.visa_expiry_date IS DISTINCT FROM NEW.visa_expiry_date)
    EXECUTE FUNCTION log_visa_change();

-- RPC function to get visa trends for last N months
CREATE OR REPLACE FUNCTION get_visa_trends(months_back INT DEFAULT 6)
RETURNS JSON AS $$
DECLARE
    result JSON;
    month_names TEXT[];
    expiring_counts INT[];
    expired_counts INT[];
    renewed_counts INT[];
    start_date DATE;
BEGIN
    -- Calculate start date
    start_date := CURRENT_DATE - (months_back || ' months')::INTERVAL;
    
    -- Build arrays for each month
    WITH month_series AS (
        SELECT 
            generate_series(
                DATE_TRUNC('month', start_date),
                DATE_TRUNC('month', CURRENT_DATE),
                '1 month'::INTERVAL
            ) AS month_date
    ),
    monthly_data AS (
        SELECT 
            ms.month_date,
            TO_CHAR(ms.month_date, 'Mon') as month_name,
            COALESCE(COUNT(*) FILTER (WHERE vh.new_status = 'expiring_soon'), 0)::INT as expiring,
            COALESCE(COUNT(*) FILTER (WHERE vh.new_status = 'expired'), 0)::INT as expired,
            COALESCE(COUNT(*) FILTER (WHERE vh.change_type = 'renewal'), 0)::INT as renewed
        FROM month_series ms
        LEFT JOIN visa_history vh ON DATE_TRUNC('month', vh.changed_at) = ms.month_date
        GROUP BY ms.month_date
        ORDER BY ms.month_date ASC
    )
    SELECT 
        ARRAY_AGG(month_name ORDER BY month_date),
        ARRAY_AGG(expiring ORDER BY month_date),
        ARRAY_AGG(expired ORDER BY month_date),
        ARRAY_AGG(renewed ORDER BY month_date)
    INTO month_names, expiring_counts, expired_counts, renewed_counts
    FROM monthly_data;
    
    -- Build JSON result
    result := json_build_object(
        'months', COALESCE(month_names, ARRAY[]::TEXT[]),
        'expiring', COALESCE(expiring_counts, ARRAY[]::INT[]),
        'expired', COALESCE(expired_counts, ARRAY[]::INT[]),
        'renewed', COALESCE(renewed_counts, ARRAY[]::INT[])
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON visa_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_visa_trends(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_visa_status(DATE) TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE visa_history IS 'Automatic log of all visa expiry date changes for trend analysis and compliance monitoring';
COMMENT ON FUNCTION get_visa_trends(INT) IS 'Returns visa status trends for the specified number of months back';
COMMENT ON FUNCTION calculate_visa_status(DATE) IS 'Calculates visa status (expired/expiring_soon/valid) from expiry date';
