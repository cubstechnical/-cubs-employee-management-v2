-- =====================================================
-- Dashboard Metrics RPC Function
-- Calculates all metrics in a single optimized database call
-- Replaces client-side aggregation for better performance
-- =====================================================

CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_employees INT;
  active_employees INT;
  inactive_employees INT;
  total_documents INT;
  visa_expiring_soon INT;
  visa_expired INT;
  visa_valid INT;
  unique_companies INT;
BEGIN
  -- Get employee counts in a single scan
  SELECT 
    COUNT(*) FILTER (WHERE is_active = true),
    COUNT(*) FILTER (WHERE is_active = true),
    COUNT(*) FILTER (WHERE is_active = false)
  INTO total_employees, active_employees, inactive_employees
  FROM employee_table;
  
  -- Get document count
  SELECT COUNT(*) INTO total_documents
  FROM employee_documents;
  
  -- Get visa status counts with date-based filtering
  -- expiring_soon: expires within 30 days
  -- expired: already expired
  -- valid: expires after 30 days
  SELECT 
    COUNT(*) FILTER (WHERE visa_expiry_date < NOW()),
    COUNT(*) FILTER (WHERE visa_expiry_date >= NOW() AND visa_expiry_date <= NOW() + INTERVAL '30 days'),
    COUNT(*) FILTER (WHERE visa_expiry_date > NOW() + INTERVAL '30 days')
  INTO visa_expired, visa_expiring_soon, visa_valid
  FROM employee_table
  WHERE is_active = true AND visa_expiry_date IS NOT NULL;
  
  -- Get unique companies count
  SELECT COUNT(DISTINCT company_name) INTO unique_companies
  FROM employee_table
  WHERE is_active = true;
  
  -- Build JSON result with camelCase keys to match TypeScript interface
  result := json_build_object(
    'totalEmployees', COALESCE(total_employees, 0),
    'activeEmployees', COALESCE(active_employees, 0),
    'inactiveEmployees', COALESCE(inactive_employees, 0),
    'totalDocuments', COALESCE(total_documents, 0),
    'visaExpiringSoon', COALESCE(visa_expiring_soon, 0),
    'visaExpired', COALESCE(visa_expired, 0),
    'visaValid', COALESCE(visa_valid, 0),
    'totalCompanies', COALESCE(unique_companies, 0),
    'employeeGrowth', 0,  -- TODO: Calculate from historical data when implemented
    'documentGrowth', 0   -- TODO: Calculate from historical data when implemented
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_dashboard_metrics() IS 'Returns dashboard metrics aggregated at the database level for optimal performance. Replaces client-side aggregation.';
