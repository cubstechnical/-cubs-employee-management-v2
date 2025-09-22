-- Document Search Function with Employee Name Joins
-- This function enables searching documents by both file names and employee names
-- Run this in Supabase SQL Editor to create the search functionality

-- Create the search function that joins employee_documents with employee_table
CREATE OR REPLACE FUNCTION search_documents_and_employees(search_term TEXT)
RETURNS TABLE (
  -- Return all columns from the employee_documents table
  id UUID,
  employee_id TEXT,
  document_type TEXT,
  file_name TEXT,
  file_url TEXT,
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  notes TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Also return the employee's name and company
  employee_name TEXT,
  company_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.employee_id,
    d.document_type,
    d.file_name,
    d.file_url,
    d.file_path,
    d.file_size,
    d.mime_type,
    d.notes,
    d.uploaded_by,
    d.created_at,
    d.updated_at,
    e.name as employee_name,
    e.company_name
  FROM
    employee_documents AS d
    LEFT JOIN employee_table AS e ON d.employee_id = e.employee_id
  WHERE
    d.file_name ILIKE '%' || search_term || '%' OR
    e.name ILIKE '%' || search_term || '%' OR
    e.employee_id ILIKE '%' || search_term || '%' OR
    e.company_name ILIKE '%' || search_term || '%'
  ORDER BY
    d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create an optimized version for employee folder search
CREATE OR REPLACE FUNCTION search_employee_folders(search_term TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  employee_id TEXT,
  employee_name TEXT,
  company_name TEXT,
  document_count BIGINT,
  last_modified TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.employee_id,
    e.name as employee_name,
    e.company_name,
    COUNT(d.id) as document_count,
    MAX(d.created_at) as last_modified
  FROM
    employee_table AS e
    LEFT JOIN employee_documents AS d ON e.employee_id = d.employee_id
  WHERE
    e.name ILIKE '%' || search_term || '%' OR
    e.employee_id ILIKE '%' || search_term || '%' OR
    e.company_name ILIKE '%' || search_term || '%'
  GROUP BY
    e.employee_id, e.name, e.company_name
  HAVING
    COUNT(d.id) > 0  -- Only return employees who have documents
  ORDER BY
    MAX(d.created_at) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Enable the trigram extension if not already enabled
-- This is required for the GIN indexes to work properly
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes to optimize search performance (only if pg_trgm is available)
-- These indexes will improve search performance but are optional
DO $$
BEGIN
    -- Check if pg_trgm extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        -- Create GIN trigram indexes for fast text search
        CREATE INDEX IF NOT EXISTS idx_employee_documents_file_name_gin 
        ON employee_documents USING gin (file_name gin_trgm_ops);

        CREATE INDEX IF NOT EXISTS idx_employee_table_name_gin 
        ON employee_table USING gin (name gin_trgm_ops);

        CREATE INDEX IF NOT EXISTS idx_employee_table_employee_id_gin 
        ON employee_table USING gin (employee_id gin_trgm_ops);

        CREATE INDEX IF NOT EXISTS idx_employee_table_company_name_gin 
        ON employee_table USING gin (company_name gin_trgm_ops);
        
        RAISE NOTICE 'GIN trigram indexes created successfully';
    ELSE
        -- Fallback: Create regular B-tree indexes for basic search
        CREATE INDEX IF NOT EXISTS idx_employee_documents_file_name_btree 
        ON employee_documents (file_name);

        CREATE INDEX IF NOT EXISTS idx_employee_table_name_btree 
        ON employee_table (name);

        CREATE INDEX IF NOT EXISTS idx_employee_table_employee_id_btree 
        ON employee_table (employee_id);

        CREATE INDEX IF NOT EXISTS idx_employee_table_company_name_btree 
        ON employee_table (company_name);
        
        RAISE NOTICE 'Regular B-tree indexes created (pg_trgm not available)';
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_documents_and_employees(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_employee_folders(TEXT, INTEGER) TO authenticated;
