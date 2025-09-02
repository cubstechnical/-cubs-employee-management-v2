-- FIXED Performance Optimization Indexes
-- This version resolves the IMMUTABLE function error
-- Run this in Supabase SQL Editor to create performance-critical indexes

-- ====================================
-- EMPLOYEE_TABLE INDEXES (FIXED)
-- ====================================

-- Primary performance index for active employees (most common filter)
CREATE INDEX IF NOT EXISTS idx_employee_table_is_active_performance 
ON employee_table(is_active, company_name, created_at) 
WHERE is_active = true;

-- Visa expiry performance index (critical for dashboard)
CREATE INDEX IF NOT EXISTS idx_employee_table_visa_expiry_performance 
ON employee_table(visa_expiry_date, is_active) 
WHERE visa_expiry_date IS NOT NULL AND is_active = true;

-- Company-based queries optimization
CREATE INDEX IF NOT EXISTS idx_employee_table_company_active 
ON employee_table(company_name, is_active, created_at) 
WHERE is_active = true;

-- Department/Trade analysis optimization
CREATE INDEX IF NOT EXISTS idx_employee_table_trade_active 
ON employee_table(trade, is_active) 
WHERE trade IS NOT NULL AND trade != '' AND is_active = true;

-- Employee ID lookup optimization (frequently used)
CREATE INDEX IF NOT EXISTS idx_employee_table_employee_id_active 
ON employee_table(employee_id, is_active);

-- Name search optimization (simple text index - no functions)
CREATE INDEX IF NOT EXISTS idx_employee_table_name_search 
ON employee_table(name) 
WHERE is_active = true;

-- Employee name pattern matching (for ILIKE searches)
CREATE INDEX IF NOT EXISTS idx_employee_table_name_pattern 
ON employee_table(lower(name)) 
WHERE is_active = true;

-- ====================================
-- EMPLOYEE_DOCUMENTS INDEXES (FIXED)
-- ====================================

-- Document lookup by employee (most common query)
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id_date 
ON employee_documents(employee_id, created_at DESC);

-- File path optimization for folder navigation
CREATE INDEX IF NOT EXISTS idx_employee_documents_file_path_pattern 
ON employee_documents(file_path, created_at DESC);

-- Document search optimization (simple text index - no functions)
CREATE INDEX IF NOT EXISTS idx_employee_documents_search 
ON employee_documents(file_name);

-- File name pattern matching (for ILIKE searches)
CREATE INDEX IF NOT EXISTS idx_employee_documents_filename_pattern 
ON employee_documents(lower(file_name));

-- Company document queries
CREATE INDEX IF NOT EXISTS idx_employee_documents_company_lookup 
ON employee_documents(employee_id, file_type, created_at DESC);

-- Document count optimization (for dashboard)
CREATE INDEX IF NOT EXISTS idx_employee_documents_count_optimization 
ON employee_documents(created_at DESC);

-- ====================================
-- PROFILES TABLE INDEXES (FIXED)
-- ====================================

-- Pending approvals optimization (critical for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_profiles_pending_approvals 
ON profiles(approved_by, created_at) 
WHERE approved_by IS NULL;

-- User role lookup optimization
CREATE INDEX IF NOT EXISTS idx_profiles_role_active 
ON profiles(role, approved_by) 
WHERE approved_by IS NOT NULL;

-- User ID lookup optimization
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(id);

-- ====================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES (FIXED)
-- ====================================

-- Dashboard stats optimization - employee counts by company
CREATE INDEX IF NOT EXISTS idx_dashboard_company_stats 
ON employee_table(company_name, is_active, created_at) 
WHERE is_active = true;

-- Dashboard stats optimization - visa expiry (simplified)
CREATE INDEX IF NOT EXISTS idx_dashboard_visa_urgency 
ON employee_table(visa_expiry_date, visa_status, is_active, name) 
WHERE visa_expiry_date IS NOT NULL AND is_active = true;

-- Document folder optimization
CREATE INDEX IF NOT EXISTS idx_document_folders_optimization 
ON employee_documents(employee_id, file_path, created_at DESC);

-- ====================================
-- SIMPLE INDEXES FOR COMMON QUERIES (FIXED)
-- ====================================

-- Recent employees index (for dashboard recent activity)
CREATE INDEX IF NOT EXISTS idx_employee_table_recent 
ON employee_table(created_at DESC, name, company_name);

-- Recent documents index
CREATE INDEX IF NOT EXISTS idx_employee_documents_recent 
ON employee_documents(created_at DESC, employee_id, file_name);

-- Critical visa expiries
CREATE INDEX IF NOT EXISTS idx_employee_table_critical_visas 
ON employee_table(visa_expiry_date ASC, name, visa_status, employee_id) 
WHERE visa_expiry_date IS NOT NULL AND is_active = true;

-- ====================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ====================================

-- Employee status optimization
CREATE INDEX IF NOT EXISTS idx_employee_table_status 
ON employee_table(is_active, visa_status, created_at);

-- Document type optimization
CREATE INDEX IF NOT EXISTS idx_employee_documents_type 
ON employee_documents(file_type, created_at DESC);

-- Employee company and trade combination
CREATE INDEX IF NOT EXISTS idx_employee_table_company_trade 
ON employee_table(company_name, trade, is_active) 
WHERE is_active = true;

-- Document employee and path combination
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_path 
ON employee_documents(employee_id, file_path);

-- ====================================
-- QUERY PERFORMANCE VERIFICATION
-- ====================================

-- Create a function to test index usage
CREATE OR REPLACE FUNCTION test_index_performance()
RETURNS TABLE(
  test_name text,
  execution_time_ms numeric,
  rows_returned bigint
) AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  row_count bigint;
BEGIN
  -- Test 1: Active employees query
  start_time := clock_timestamp();
  SELECT count(*) INTO row_count FROM employee_table WHERE is_active = true;
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'active_employees_count'::text,
    EXTRACT(MILLISECONDS FROM (end_time - start_time)),
    row_count;
  
  -- Test 2: Visa expiry query
  start_time := clock_timestamp();
  SELECT count(*) INTO row_count FROM employee_table 
  WHERE visa_expiry_date IS NOT NULL AND is_active = true;
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'visa_expiry_count'::text,
    EXTRACT(MILLISECONDS FROM (end_time - start_time)),
    row_count;
  
  -- Test 3: Document count query
  start_time := clock_timestamp();
  SELECT count(*) INTO row_count FROM employee_documents;
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'document_count'::text,
    EXTRACT(MILLISECONDS FROM (end_time - start_time)),
    row_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION test_index_performance() TO authenticated;

-- ====================================
-- INDEX MAINTENANCE FUNCTIONS
-- ====================================

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
  schemaname text,
  tablename text,
  indexname text,
  idx_scan bigint,
  idx_tup_read bigint,
  idx_tup_fetch bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.schemaname::text,
    s.tablename::text,
    s.indexrelname::text,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch
  FROM pg_stat_user_indexes s
  WHERE s.schemaname = 'public'
  ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_index_usage_stats() TO authenticated;

-- ====================================
-- PERFORMANCE MONITORING VIEW
-- ====================================

CREATE OR REPLACE VIEW performance_stats AS
SELECT 
  'Total Employees' as metric,
  COUNT(*)::text as value,
  'count' as type
FROM employee_table
UNION ALL
SELECT 
  'Active Employees' as metric,
  COUNT(*)::text as value,
  'count' as type
FROM employee_table WHERE is_active = true
UNION ALL
SELECT 
  'Total Documents' as metric,
  COUNT(*)::text as value,
  'count' as type
FROM employee_documents
UNION ALL
SELECT 
  'Pending Approvals' as metric,
  COUNT(*)::text as value,
  'count' as type
FROM profiles WHERE approved_by IS NULL
UNION ALL
SELECT 
  'Indexes Created' as metric,
  COUNT(*)::text as value,
  'count' as type
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' AND indexrelname LIKE 'idx_%';

GRANT SELECT ON performance_stats TO authenticated;

-- ====================================
-- SUCCESS MESSAGE
-- ====================================

DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully!';
  RAISE NOTICE 'Run: SELECT * FROM performance_stats; to verify';
  RAISE NOTICE 'Run: SELECT * FROM test_index_performance(); to test performance';
  RAISE NOTICE 'Run: SELECT * FROM get_index_usage_stats(); to monitor index usage';
END $$;
