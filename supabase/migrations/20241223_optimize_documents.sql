-- =====================================================
-- Documents Performance Optimization
-- Optimized fetching of document folders
-- =====================================================

-- Function to efficiently aggregate document folders
-- Replaces client-side aggregation of thousands of records
CREATE OR REPLACE FUNCTION get_document_folders_overview()
RETURNS TABLE (
  folder_name text,
  document_count bigint,
  last_modified timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    split_part(file_path, '/', 1) as folder_name,
    COUNT(*) as document_count,
    MAX(uploaded_at) as last_modified
  FROM employee_documents
  WHERE file_path IS NOT NULL
  GROUP BY split_part(file_path, '/', 1)
  ORDER BY folder_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_document_folders_overview() TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION get_document_folders_overview() IS 'Returns an overview of document folders (companies) with counts and timestamps, optimized for performance';
