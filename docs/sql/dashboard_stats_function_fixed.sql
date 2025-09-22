-- FIXED Dashboard Stats Function
-- This version resolves the EXTRACT function error and PostgreSQL compatibility issues
-- Run this in Supabase SQL Editor to create the dashboard functionality

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_dashboard_stats();

-- Create the fixed dashboard stats function
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalEmployees', (
      SELECT COUNT(*)::INTEGER 
      FROM employee_table
    ),
    'activeEmployees', (
      SELECT COUNT(*)::INTEGER 
      FROM employee_table 
      WHERE is_active = true
    ),
    'totalDocuments', (
      SELECT COUNT(*)::INTEGER 
      FROM employee_documents
    ),
    'pendingApprovals', (
      SELECT COUNT(*)::INTEGER 
      FROM profiles 
      WHERE approved_by IS NULL
    ),
    'visasExpiringSoon', (
      SELECT COUNT(*)::INTEGER 
      FROM employee_table 
      WHERE visa_expiry_date IS NOT NULL 
        AND visa_expiry_date >= CURRENT_DATE 
        AND visa_expiry_date <= CURRENT_DATE + INTERVAL '90 days'
        AND is_active = true
    ),
    'departments', (
      SELECT COUNT(DISTINCT trade)::INTEGER 
      FROM employee_table 
      WHERE trade IS NOT NULL AND trade != ''
    ),
    'companyDistribution', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'name', company_name,
          'employees', employee_count,
          'percentage', ROUND((employee_count::DECIMAL / GREATEST(total_employees::DECIMAL, 1)) * 100, 1)
        )
      ), '[]'::json)
      FROM (
        SELECT 
          company_name,
          COUNT(*) as employee_count
        FROM employee_table 
        WHERE is_active = true AND company_name IS NOT NULL
        GROUP BY company_name
        ORDER BY employee_count DESC
        LIMIT 10
      ) company_stats
      CROSS JOIN (
        SELECT COUNT(*) as total_employees 
        FROM employee_table 
        WHERE is_active = true
      ) total
    ),
    'departmentDistribution', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'name', trade,
          'employees', employee_count,
          'percentage', ROUND((employee_count::DECIMAL / GREATEST(total_employees::DECIMAL, 1)) * 100, 1)
        )
      ), '[]'::json)
      FROM (
        SELECT 
          trade,
          COUNT(*) as employee_count
        FROM employee_table 
        WHERE is_active = true AND trade IS NOT NULL AND trade != ''
        GROUP BY trade
        ORDER BY employee_count DESC
        LIMIT 10
      ) dept_stats
      CROSS JOIN (
        SELECT COUNT(*) as total_employees 
        FROM employee_table 
        WHERE is_active = true AND trade IS NOT NULL AND trade != ''
      ) total
    ),
    'expiringVisas', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'employee_id', visa_data.employee_id,
          'name', visa_data.name,
          'visa_type', visa_data.visa_type,
          'visa_expiry_date', visa_data.visa_expiry_date,
          'daysLeft', visa_data.days_left,
          'urgency', visa_data.urgency
        )
      ), '[]'::json)
      FROM (
        SELECT 
          employee_id,
          name,
          COALESCE(visa_status, 'Unknown') as visa_type,
          visa_expiry_date,
          (visa_expiry_date - CURRENT_DATE)::INTEGER as days_left,
          CASE 
            WHEN (visa_expiry_date - CURRENT_DATE) <= 7 THEN 'critical'
            WHEN (visa_expiry_date - CURRENT_DATE) <= 30 THEN 'high'
            WHEN (visa_expiry_date - CURRENT_DATE) <= 60 THEN 'medium'
            ELSE 'low'
          END as urgency
        FROM employee_table 
        WHERE visa_expiry_date IS NOT NULL 
          AND visa_expiry_date >= CURRENT_DATE 
          AND visa_expiry_date <= CURRENT_DATE + INTERVAL '90 days'
          AND is_active = true
          AND name IS NOT NULL
        ORDER BY visa_expiry_date ASC
        LIMIT 10
      ) visa_data
    ),
    'recentActivity', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'type', 'employee_created',
          'description', 'New employee added: ' || name,
          'date', created_at,
          'employee_id', employee_id
        )
      ), '[]'::json)
      FROM employee_table 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND name IS NOT NULL
        AND employee_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;

-- Create a simpler test function to verify database connectivity
CREATE OR REPLACE FUNCTION test_dashboard_connection()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'status', 'success',
    'timestamp', CURRENT_TIMESTAMP,
    'message', 'Dashboard function is working'
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION test_dashboard_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION test_dashboard_connection() TO anon;

-- Create the growth trend data function (fixed)
CREATE OR REPLACE FUNCTION get_growth_trend_data(months_back INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'month', month_label,
      'employees', employee_count,
      'documents', document_count
    )
  ), '[]'::json)
  INTO result
  FROM (
    SELECT 
      TO_CHAR(month_start, 'Mon') as month_label,
      COALESCE(employee_count, 0) as employee_count,
      COALESCE(document_count, 0) as document_count
    FROM (
      SELECT 
        generate_series(
          CURRENT_DATE - INTERVAL '1 month' * (months_back - 1),
          CURRENT_DATE,
          INTERVAL '1 month'
        )::DATE as month_start
    ) months
    LEFT JOIN (
      SELECT 
        DATE_TRUNC('month', created_at)::DATE as month,
        COUNT(*) as employee_count
      FROM employee_table
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 month' * months_back
        AND created_at IS NOT NULL
      GROUP BY DATE_TRUNC('month', created_at)
    ) emp_stats ON months.month_start = emp_stats.month
    LEFT JOIN (
      SELECT 
        DATE_TRUNC('month', created_at)::DATE as month,
        COUNT(*) as document_count
      FROM employee_documents
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 month' * months_back
        AND created_at IS NOT NULL
      GROUP BY DATE_TRUNC('month', created_at)
    ) doc_stats ON months.month_start = doc_stats.month
    ORDER BY month_start
  ) trend_data;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_growth_trend_data(INTEGER) TO authenticated;

-- Verification queries to run after deployment
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'DASHBOARD FUNCTION DEPLOYMENT COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  - get_dashboard_stats()';
  RAISE NOTICE '  - test_dashboard_connection()';
  RAISE NOTICE '  - get_growth_trend_data(months_back)';
  RAISE NOTICE '';
  RAISE NOTICE 'Test the functions:';
  RAISE NOTICE '  SELECT * FROM test_dashboard_connection();';
  RAISE NOTICE '  SELECT * FROM get_dashboard_stats();';
  RAISE NOTICE '';
  RAISE NOTICE 'If no errors above, your dashboard is ready!';
END $$;
