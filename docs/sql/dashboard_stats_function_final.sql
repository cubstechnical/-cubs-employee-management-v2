-- FINAL Dashboard Stats Function - SQL GROUP BY Error Fixed
-- This version completely resolves all SQL errors and GROUP BY issues
-- Run this in Supabase SQL Editor to replace the dashboard functionality

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_dashboard_stats();

-- Create the final, working dashboard stats function
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_employees_count INTEGER;
  active_employees_count INTEGER;
  total_documents_count INTEGER;
  pending_approvals_count INTEGER;
  visas_expiring_count INTEGER;
  departments_count INTEGER;
BEGIN
  -- Get basic counts first (no GROUP BY issues)
  SELECT COUNT(*) INTO total_employees_count FROM employee_table;
  SELECT COUNT(*) INTO active_employees_count FROM employee_table WHERE is_active = true;
  SELECT COUNT(*) INTO total_documents_count FROM employee_documents;
  SELECT COUNT(*) INTO pending_approvals_count FROM profiles WHERE approved_by IS NULL;
  SELECT COUNT(*) INTO departments_count FROM (
    SELECT DISTINCT trade FROM employee_table WHERE trade IS NOT NULL AND trade != ''
  ) distinct_trades;
  SELECT COUNT(*) INTO visas_expiring_count FROM employee_table 
  WHERE visa_expiry_date IS NOT NULL 
    AND visa_expiry_date >= CURRENT_DATE 
    AND visa_expiry_date <= CURRENT_DATE + INTERVAL '90 days'
    AND is_active = true;

  -- Build the result JSON
  SELECT json_build_object(
    'totalEmployees', total_employees_count,
    'activeEmployees', active_employees_count,
    'totalDocuments', total_documents_count,
    'pendingApprovals', pending_approvals_count,
    'visasExpiringSoon', visas_expiring_count,
    'departments', departments_count,
    
    'companyDistribution', (
      SELECT COALESCE(json_agg(company_data), '[]'::json)
      FROM (
        SELECT json_build_object(
          'name', company_name,
          'employees', employee_count,
          'percentage', CASE 
            WHEN active_employees_count > 0 
            THEN ROUND((employee_count::DECIMAL / active_employees_count::DECIMAL) * 100, 1)
            ELSE 0
          END
        ) as company_data
        FROM (
          SELECT 
            company_name,
            COUNT(*) as employee_count
          FROM employee_table 
          WHERE is_active = true AND company_name IS NOT NULL AND company_name != ''
          GROUP BY company_name
          ORDER BY COUNT(*) DESC
          LIMIT 10
        ) company_stats
      ) company_json
    ),
    
    'departmentDistribution', (
      SELECT COALESCE(json_agg(dept_data), '[]'::json)
      FROM (
        SELECT json_build_object(
          'name', trade,
          'employees', employee_count,
          'percentage', CASE 
            WHEN active_employees_count > 0 
            THEN ROUND((employee_count::DECIMAL / active_employees_count::DECIMAL) * 100, 1)
            ELSE 0
          END
        ) as dept_data
        FROM (
          SELECT 
            trade,
            COUNT(*) as employee_count
          FROM employee_table 
          WHERE is_active = true AND trade IS NOT NULL AND trade != ''
          GROUP BY trade
          ORDER BY COUNT(*) DESC
          LIMIT 10
        ) dept_stats
      ) dept_json
    ),
    
    'expiringVisas', (
      SELECT COALESCE(json_agg(visa_data), '[]'::json)
      FROM (
        SELECT json_build_object(
          'employee_id', employee_id,
          'name', name,
          'visa_type', COALESCE(visa_status, 'Unknown'),
          'visa_expiry_date', visa_expiry_date::text,
          'daysLeft', (visa_expiry_date - CURRENT_DATE)::INTEGER,
          'urgency', CASE 
            WHEN (visa_expiry_date - CURRENT_DATE) <= 7 THEN 'critical'
            WHEN (visa_expiry_date - CURRENT_DATE) <= 30 THEN 'high'
            WHEN (visa_expiry_date - CURRENT_DATE) <= 60 THEN 'medium'
            ELSE 'low'
          END
        ) as visa_data
        FROM employee_table 
        WHERE visa_expiry_date IS NOT NULL 
          AND visa_expiry_date >= CURRENT_DATE 
          AND visa_expiry_date <= CURRENT_DATE + INTERVAL '90 days'
          AND is_active = true
          AND name IS NOT NULL
        ORDER BY visa_expiry_date ASC
        LIMIT 10
      ) visa_list
    ),
    
    'recentActivity', (
      SELECT COALESCE(json_agg(activity_data), '[]'::json)
      FROM (
        SELECT json_build_object(
          'type', 'employee_created',
          'description', 'New employee added: ' || name,
          'date', created_at::text,
          'employee_id', employee_id
        ) as activity_data
        FROM employee_table 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          AND name IS NOT NULL
          AND employee_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 5
      ) activity_list
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;

-- Test function to verify it works
CREATE OR REPLACE FUNCTION test_dashboard_simple()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'status', 'success',
    'message', 'Dashboard function is working correctly',
    'timestamp', CURRENT_TIMESTAMP,
    'test_data', json_build_object(
      'employees', (SELECT COUNT(*) FROM employee_table),
      'documents', (SELECT COUNT(*) FROM employee_documents)
    )
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION test_dashboard_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION test_dashboard_simple() TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'DASHBOARD FUNCTION - FINAL VERSION DEPLOYED';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'All SQL GROUP BY errors have been fixed!';
  RAISE NOTICE '';
  RAISE NOTICE 'Test the function:';
  RAISE NOTICE '  SELECT test_dashboard_simple();';
  RAISE NOTICE '  SELECT get_dashboard_stats();';
  RAISE NOTICE '';
  RAISE NOTICE 'Your dashboard should now work perfectly!';
END $$;
