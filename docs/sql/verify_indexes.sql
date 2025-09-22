-- Verification Script for Performance Indexes
-- Run this after deploying the performance_indexes_fixed.sql file

-- ====================================
-- VERIFY INDEXES WERE CREATED
-- ====================================

-- Check if our performance indexes exist
SELECT 
    schemaname,
    tablename,
    indexrelname as indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexrelname LIKE 'idx_%performance%'
ORDER BY tablename, indexrelname;

-- ====================================
-- VERIFY FUNCTIONS WERE CREATED
-- ====================================

-- Check if our functions exist
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_index_usage_stats',
    'test_index_performance'
  );

-- ====================================
-- VERIFY VIEWS WERE CREATED
-- ====================================

-- Check if performance_stats view exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'performance_stats';

-- ====================================
-- TEST THE PERFORMANCE FUNCTIONS
-- ====================================

-- Test the performance monitoring
SELECT * FROM performance_stats;

-- Test index usage stats (this should work now)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM get_index_usage_stats() 
WHERE indexname LIKE 'idx_%'
LIMIT 10;

-- Test performance benchmarking
SELECT * FROM test_index_performance();

-- ====================================
-- VERIFY SPECIFIC INDEXES
-- ====================================

-- Check critical indexes exist
DO $$
DECLARE
    critical_indexes text[] := ARRAY[
        'idx_employee_table_is_active_performance',
        'idx_employee_table_visa_expiry_performance',
        'idx_employee_documents_employee_id_date',
        'idx_profiles_pending_approvals'
    ];
    idx_name text;
    idx_exists boolean;
BEGIN
    FOREACH idx_name IN ARRAY critical_indexes LOOP
        SELECT EXISTS(
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexrelname = idx_name
        ) INTO idx_exists;
        
        IF idx_exists THEN
            RAISE NOTICE 'Index % exists ✓', idx_name;
        ELSE
            RAISE WARNING 'Index % is missing ✗', idx_name;
        END IF;
    END LOOP;
END $$;

-- ====================================
-- PERFORMANCE TEST QUERIES
-- ====================================

-- Test query 1: Active employees (should use idx_employee_table_is_active_performance)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT count(*) FROM employee_table WHERE is_active = true;

-- Test query 2: Visa expiry (should use idx_employee_table_visa_expiry_performance)
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM employee_table 
WHERE visa_expiry_date IS NOT NULL AND is_active = true;

-- Test query 3: Pending approvals (should use idx_profiles_pending_approvals)
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM profiles WHERE approved_by IS NULL;

-- ====================================
-- SUCCESS MESSAGE
-- ====================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'INDEX VERIFICATION COMPLETE';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'If you see ✓ for all critical indexes above,';
    RAISE NOTICE 'your performance optimization is ready!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Deploy the dashboard RPC function';
    RAISE NOTICE '2. Test the optimized dashboard';
    RAISE NOTICE '3. Monitor performance improvements';
END $$;
