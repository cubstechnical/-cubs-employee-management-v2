-- =====================================================
-- Navigation Performance Optimization
-- Optimized fetching of unique values for filters
-- =====================================================

-- Function to get unique company names efficiently
-- replacing client-side aggregation
CREATE OR REPLACE FUNCTION get_unique_companies()
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT company_name
    FROM employee_table
    WHERE company_name IS NOT NULL
    ORDER BY company_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_unique_companies() TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION get_unique_companies() IS 'Returns a distinct list of company names for UI filters, optimized for performance';
