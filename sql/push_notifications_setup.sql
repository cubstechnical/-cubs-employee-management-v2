-- =====================================================
-- Push Notifications Database Setup
-- =====================================================

-- Create device_tokens table for storing push notification tokens
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_device_tokens_created_at ON device_tokens(created_at);

-- Enable Row Level Security
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for device_tokens table

-- Users can view their own device tokens
CREATE POLICY "Users can view their own device tokens" ON device_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own device tokens
CREATE POLICY "Users can insert their own device tokens" ON device_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own device tokens
CREATE POLICY "Users can update their own device tokens" ON device_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own device tokens
CREATE POLICY "Users can delete their own device tokens" ON device_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all device tokens (for sending notifications)
CREATE POLICY "Admins can view all device tokens" ON device_tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.approved_by IS NOT NULL
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_device_tokens_updated_at();

-- Create function to clean up old device tokens
CREATE OR REPLACE FUNCTION cleanup_old_device_tokens()
RETURNS void AS $$
BEGIN
  -- Delete device tokens older than 30 days
  DELETE FROM device_tokens 
  WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a view for admin to see device token statistics
CREATE OR REPLACE VIEW device_token_stats AS
SELECT 
  platform,
  COUNT(*) as total_tokens,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(updated_at) as last_updated
FROM device_tokens
GROUP BY platform
ORDER BY platform;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON device_tokens TO authenticated;
GRANT SELECT ON device_token_stats TO authenticated;

-- Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  platform TEXT
);

-- Create indexes for notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);

-- Enable RLS for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_logs
CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification logs" ON notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.approved_by IS NOT NULL
    )
  );

CREATE POLICY "System can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- Grant permissions for notification_logs
GRANT SELECT, INSERT ON notification_logs TO authenticated;

-- Create view for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  notification_type,
  platform,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed,
  AVG(EXTRACT(EPOCH FROM (sent_at - LAG(sent_at) OVER (ORDER BY sent_at)))) as avg_interval_seconds
FROM notification_logs
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type, platform
ORDER BY notification_type, platform;

GRANT SELECT ON notification_stats TO authenticated;

-- Insert sample data for testing (optional)
-- INSERT INTO device_tokens (user_id, device_token, platform) VALUES 
-- ('sample-user-id', 'sample-device-token', 'android');

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if tables were created successfully
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name IN ('device_tokens', 'notification_logs')
ORDER BY table_name;

-- Check if policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('device_tokens', 'notification_logs')
ORDER BY tablename, policyname;

-- Check if indexes were created
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('device_tokens', 'notification_logs')
ORDER BY tablename, indexname;
