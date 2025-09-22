-- Performance Optimization Indexes
-- Run this in Supabase SQL Editor to create performance-critical indexes

-- ====================================
-- EMPLOYEE_TABLE INDEXES
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

-- Name search optimization (simple text index)
CREATE INDEX IF NOT EXISTS idx_employee_table_name_search 
ON employee_table(name) 
WHERE is_active = true;

-- ====================================
-- EMPLOYEE_DOCUMENTS INDEXES
-- ====================================

-- Document lookup by employee (most common query)
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id_date 
ON employee_documents(employee_id, created_at DESC);

-- File path optimization for folder navigation
CREATE INDEX IF NOT EXISTS idx_employee_documents_file_path_pattern 
ON employee_documents(file_path, created_at DESC);

-- Document search optimization (simple text index)
CREATE INDEX IF NOT EXISTS idx_employee_documents_search 
ON employee_documents(file_name);

-- Company document queries
CREATE INDEX IF NOT EXISTS idx_employee_documents_company_lookup 
ON employee_documents(employee_id, file_type, created_at DESC);

-- Document count optimization (for dashboard) - simplified
CREATE INDEX IF NOT EXISTS idx_employee_documents_count_optimization 
ON employee_documents(created_at DESC);

-- ====================================
-- PROFILES TABLE INDEXES
-- ====================================

-- Pending approvals optimization (critical for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_profiles_pending_approvals 
ON profiles(approved_by, created_at) 
WHERE approved_by IS NULL;

-- User role lookup optimization
CREATE INDEX IF NOT EXISTS idx_profiles_role_active 
ON profiles(role, approved_by) 
WHERE approved_by IS NOT NULL;

-- ====================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ====================================

-- Dashboard stats optimization - employee counts by company
CREATE INDEX IF NOT EXISTS idx_dashboard_company_stats 
ON employee_table(company_name, is_active, created_at) 
WHERE is_active = true;

-- Dashboard stats optimization - visa expiry urgency (simplified)
CREATE INDEX IF NOT EXISTS idx_dashboard_visa_urgency 
ON employee_table(visa_expiry_date, visa_status, is_active, name) 
WHERE visa_expiry_date IS NOT NULL AND is_active = true;

-- Document folder optimization
CREATE INDEX IF NOT EXISTS idx_document_folders_optimization 
ON employee_documents(employee_id, file_path, created_at DESC);

-- ====================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- ====================================

-- Recent employees index (for dashboard recent activity) - simplified
CREATE INDEX IF NOT EXISTS idx_employee_table_recent 
ON employee_table(created_at DESC, name, company_name);

-- Recent documents index - simplified
CREATE INDEX IF NOT EXISTS idx_employee_documents_recent 
ON employee_documents(created_at DESC, employee_id, file_name);

-- Critical visa expiries - simplified
CREATE INDEX IF NOT EXISTS idx_employee_table_critical_visas 
ON employee_table(visa_expiry_date ASC, name, visa_status, employee_id) 
WHERE visa_expiry_date IS NOT NULL AND is_active = true;

-- ====================================
-- MATERIALIZED VIEW FOR DASHBOARD PERFORMANCE
-- ====================================

-- Create materialized view for dashboard stats (optional - for extreme performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats_mv AS
SELECT 
  (SELECT COUNT(*) FROM employee_table) as total_employees,
  (SELECT COUNT(*) FROM employee_table WHERE is_active = true) as active_employees,
  (SELECT COUNT(*) FROM employee_documents) as total_documents,
  (SELECT COUNT(*) FROM profiles WHERE approved_by IS NULL) as pending_approvals,
  (SELECT COUNT(*) FROM employee_table 
   WHERE visa_expiry_date IS NOT NULL 
     AND visa_expiry_date >= CURRENT_DATE 
     AND visa_expiry_date <= CURRENT_DATE + INTERVAL '90 days'
     AND is_active = true) as visas_expiring_soon,
  (SELECT COUNT(DISTINCT trade) FROM employee_table 
   WHERE trade IS NOT NULL AND trade != '') as departments,
  CURRENT_TIMESTAMP as last_updated;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_mv_unique ON dashboard_stats_mv(last_updated);

-- ====================================
-- QUERY PERFORMANCE ANALYSIS
-- ====================================

-- Enable query plan analysis (run manually when needed)
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM employee_table WHERE is_active = true;
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM employee_documents WHERE employee_id = 'some_id';

-- ====================================
-- INDEX MAINTENANCE
-- ====================================

-- Create function to refresh materialized view (call periodically)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_mv;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats() TO authenticated;

-- ====================================
-- PERFORMANCE MONITORING
-- ====================================

-- Create function to get index usage statistics
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

-- Performance monitoring view
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
  'Total Employees' as metric,
  COUNT(*)::text as value
FROM employee_table
UNION ALL
SELECT 
  'Active Employees' as metric,
  COUNT(*)::text as value
FROM employee_table WHERE is_active = true
UNION ALL
SELECT 
  'Total Documents' as metric,
  COUNT(*)::text as value
FROM employee_documents
UNION ALL
SELECT 
  'Index Usage' as metric,
  COUNT(*)::text as value
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' AND idx_scan > 0;

GRANT SELECT ON performance_stats TO authenticated;

-- ====================================
-- CLEANUP OLD DATA (OPTIONAL)
-- ====================================

-- Function to archive old documents (run monthly)
CREATE OR REPLACE FUNCTION archive_old_documents(archive_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- This is a placeholder - implement according to your archival strategy
  -- UPDATE employee_documents SET archived = true 
  -- WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * archive_days
  -- AND archived IS NOT true;
  
  -- GET DIAGNOSTICS archived_count = ROW_COUNT;
  archived_count := 0; -- Placeholder
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION archive_old_documents(INTEGER) TO authenticated;
