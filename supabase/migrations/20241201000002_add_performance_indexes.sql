-- Performance Optimization Indexes
-- These indexes will significantly improve query performance for frequently accessed data

-- Employee table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_company_name 
ON employee_table(company_name) 
WHERE company_name IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_visa_expiry 
ON employee_table(visa_expiry_date) 
WHERE visa_expiry_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_status 
ON employee_table(is_active) 
WHERE is_active IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_created_at 
ON employee_table(created_at DESC);

-- Composite index for company and status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_company_status 
ON employee_table(company_name, is_active) 
WHERE company_name IS NOT NULL AND is_active IS NOT NULL;

-- Employee documents indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_docs_emp_id 
ON employee_documents(employee_id) 
WHERE employee_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_docs_uploaded_at 
ON employee_documents(uploaded_at DESC) 
WHERE uploaded_at IS NOT NULL;

-- Full-text search index for employee names and emails
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_search 
ON employee_table USING GIN(to_tsvector('english', 
  COALESCE(name, '') || ' ' || COALESCE(email_id, '') || ' ' || COALESCE(employee_id, '')
));

-- Visa expiry monitoring index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_visa_monitoring 
ON employee_table(visa_expiry_date, is_active) 
WHERE visa_expiry_date IS NOT NULL AND is_active = true;

-- Company statistics optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_company_stats 
ON employee_table(company_name, is_active, visa_expiry_date) 
WHERE company_name IS NOT NULL;

-- Recent activities optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_recent_activities 
ON employee_table(created_at DESC, is_active) 
WHERE created_at IS NOT NULL;

-- Document type optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_docs_type 
ON employee_documents(document_type) 
WHERE document_type IS NOT NULL;

-- Performance monitoring table (if exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_timestamp 
ON performance_metrics(created_at DESC) 
WHERE created_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_employee_company_name IS 'Optimizes company-based employee queries';
COMMENT ON INDEX idx_employee_visa_expiry IS 'Optimizes visa expiry date queries';
COMMENT ON INDEX idx_employee_search IS 'Enables fast full-text search on employee data';
COMMENT ON INDEX idx_employee_visa_monitoring IS 'Optimizes visa monitoring dashboard queries';
COMMENT ON INDEX idx_employee_docs_emp_id IS 'Optimizes document-employee relationship queries';

-- Update table statistics for better query planning
ANALYZE employee_table;
ANALYZE employee_documents;
