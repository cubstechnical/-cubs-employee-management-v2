-- Phase 2: Internal View & Search Optimization

-- 1. Optimized function to get employee folders for a specific company
CREATE OR REPLACE FUNCTION get_employee_folders_for_company(p_company_prefix text)
RETURNS TABLE (
  employee_id text,
  document_count bigint,
  last_modified timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ed.employee_id,
    COUNT(*)::bigint as document_count,
    MAX(ed.uploaded_at) as last_modified
  FROM employee_documents ed
  WHERE ed.file_path ILIKE p_company_prefix || '/%'
  AND ed.employee_id IS NOT NULL
  GROUP BY ed.employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_employee_folders_for_company(text) TO authenticated;

-- 2. Optimized search function
CREATE OR REPLACE FUNCTION search_documents_rpc(p_search_term text, p_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  file_path text,
  file_name text,
  employee_id text,
  employee_name text,
  company_name text,
  uploaded_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ed.id,
    ed.file_path,
    ed.file_name,
    ed.employee_id,
    et.name as employee_name,
    et.company_name,
    ed.uploaded_at
  FROM employee_documents ed
  LEFT JOIN employee_table et ON ed.employee_id = et.employee_id
  WHERE
    ed.file_name ILIKE '%' || p_search_term || '%'
    OR et.name ILIKE '%' || p_search_term || '%'
    OR et.employee_id ILIKE '%' || p_search_term || '%'
  ORDER BY ed.uploaded_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_documents_rpc(text, int) TO authenticated;
