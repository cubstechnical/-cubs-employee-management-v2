-- Notifications Page Optimization
-- This migration creates RPC functions for efficient notification stats and search

-- 1. Function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats()
RETURNS TABLE (
  total_count bigint,
  sent_count bigint,
  pending_count bigint,
  failed_count bigint,
  today_count bigint,
  week_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_count,
    COUNT(*) FILTER (WHERE status = 'sent')::bigint as sent_count,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint as pending_count,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed_count,
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::bigint as today_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::bigint as week_count
  FROM notifications;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_notification_stats() TO authenticated;

-- 2. Function to search notifications with pagination
CREATE OR REPLACE FUNCTION search_notifications_rpc(
  p_search_term text DEFAULT '',
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  message text,
  type text,
  status text,
  user_id text,
  created_at timestamptz,
  category text,
  read boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.message,
    COALESCE(n.type, 'info') as type,
    COALESCE(n.status, 'sent') as status,
    COALESCE(n.user_id, 'system') as user_id,
    n.created_at,
    COALESCE(n.category, 'system') as category,
    COALESCE(n.read, false) as read
  FROM notifications n
  WHERE
    p_search_term = '' OR
    n.title ILIKE '%' || p_search_term || '%' OR
    n.message ILIKE '%' || p_search_term || '%' OR
    COALESCE(n.user_id, 'system') ILIKE '%' || p_search_term || '%'
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_notifications_rpc(text, int, int) TO authenticated;
