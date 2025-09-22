-- Dashboard Stats Function
-- This function provides consolidated dashboard statistics in a single API call
-- Run this in Supabase SQL Editor to create the dashboard functionality

-- Create the dashboard stats function
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
      SELECT json_agg(
        json_build_object(
          'name', company_name,
          'employees', employee_count,
          'percentage', ROUND((employee_count::DECIMAL / total_employees::DECIMAL) * 100, 1)
        )
      )
      FROM (
        SELECT 
          company_name,
          COUNT(*) as employee_count
        FROM employee_table 
        WHERE is_active = true
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
      SELECT json_agg(
        json_build_object(
          'name', trade,
          'employees', employee_count,
          'percentage', ROUND((employee_count::DECIMAL / total_employees::DECIMAL) * 100, 1)
        )
      )
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
        WHERE is_active = true
      ) total
    ),
    'expiringVisas', (
      SELECT json_agg(
        json_build_object(
          'employee_id', employee_id,
          'name', name,
          'visa_type', visa_status,
          'visa_expiry_date', visa_expiry_date,
          'daysLeft', EXTRACT(DAY FROM (visa_expiry_date - CURRENT_DATE))::INTEGER,
          'urgency', CASE 
            WHEN visa_expiry_date - CURRENT_DATE <= 7 THEN 'critical'
            WHEN visa_expiry_date - CURRENT_DATE <= 30 THEN 'high'
            WHEN visa_expiry_date - CURRENT_DATE <= 60 THEN 'medium'
            ELSE 'low'
          END
        )
      )
      FROM employee_table 
      WHERE visa_expiry_date IS NOT NULL 
        AND visa_expiry_date >= CURRENT_DATE 
        AND visa_expiry_date <= CURRENT_DATE + INTERVAL '90 days'
        AND is_active = true
      ORDER BY visa_expiry_date ASC
      LIMIT 10
    ),
    'recentActivity', (
      SELECT json_agg(
        json_build_object(
          'type', 'employee_created',
          'description', 'New employee added: ' || name,
          'date', created_at,
          'employee_id', employee_id
        )
      )
      FROM employee_table 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 5
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function for growth trend data
CREATE OR REPLACE FUNCTION get_growth_trend_data(months_back INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'month', month_label,
      'employees', employee_count,
      'documents', document_count
    )
  )
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
      GROUP BY DATE_TRUNC('month', created_at)
    ) emp_stats ON months.month_start = emp_stats.month
    LEFT JOIN (
      SELECT 
        DATE_TRUNC('month', created_at)::DATE as month,
        COUNT(*) as document_count
      FROM employee_documents
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 month' * months_back
      GROUP BY DATE_TRUNC('month', created_at)
    ) doc_stats ON months.month_start = doc_stats.month
    ORDER BY month_start
  ) trend_data;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_growth_trend_data(INTEGER) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_table_is_active ON employee_table(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_table_visa_expiry ON employee_table(visa_expiry_date) WHERE visa_expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employee_table_created_at ON employee_table(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_documents_created_at ON employee_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_approved_by ON profiles(approved_by) WHERE approved_by IS NULL;

