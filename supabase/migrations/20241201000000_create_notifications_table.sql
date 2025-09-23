-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('success', 'warning', 'error', 'info')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'pending', 'failed')),
    recipient VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('visa', 'document', 'system', 'approval')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Indexes for better performance
    INDEX idx_notifications_created_at ON notifications(created_at),
    INDEX idx_notifications_status ON notifications(status),
    INDEX idx_notifications_category ON notifications(category),
    INDEX idx_notifications_type ON notifications(type),
    INDEX idx_notifications_recipient ON notifications(recipient)
);

-- Add RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
-- Admin users can read all notifications
CREATE POLICY "Admin users can read all notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@cubstechnical.com',
                'info@cubstechnical.com'
            )
        )
    );

-- Admin users can insert notifications
CREATE POLICY "Admin users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@cubstechnical.com',
                'info@cubstechnical.com'
            )
        )
    );

-- Admin users can update notifications
CREATE POLICY "Admin users can update notifications" ON notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@cubstechnical.com',
                'info@cubstechnical.com'
            )
        )
    );

-- Admin users can delete notifications
CREATE POLICY "Admin users can delete notifications" ON notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@cubstechnical.com',
                'info@cubstechnical.com'
            )
        )
    );

-- Add notification tracking columns to employee_table if they don't exist
DO $$ 
BEGIN
    -- Add notification tracking columns for visa expiry notifications
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_table' AND column_name = 'notification_sent_60') THEN
        ALTER TABLE employee_table ADD COLUMN notification_sent_60 BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_table' AND column_name = 'notification_sent_30') THEN
        ALTER TABLE employee_table ADD COLUMN notification_sent_30 BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_table' AND column_name = 'notification_sent_15') THEN
        ALTER TABLE employee_table ADD COLUMN notification_sent_15 BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_table' AND column_name = 'notification_sent_7') THEN
        ALTER TABLE employee_table ADD COLUMN notification_sent_7 BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_table' AND column_name = 'notification_sent_1') THEN
        ALTER TABLE employee_table ADD COLUMN notification_sent_1 BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create a function to reset notification flags (useful for testing)
CREATE OR REPLACE FUNCTION reset_visa_notification_flags()
RETURNS void AS $$
BEGIN
    UPDATE employee_table 
    SET 
        notification_sent_60 = FALSE,
        notification_sent_30 = FALSE,
        notification_sent_15 = FALSE,
        notification_sent_7 = FALSE,
        notification_sent_1 = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get visa expiry statistics
CREATE OR REPLACE FUNCTION get_visa_expiry_stats()
RETURNS TABLE (
    total_employees BIGINT,
    expiring_soon BIGINT,
    expired BIGINT,
    notifications_sent BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN visa_expiry_date IS NOT NULL AND visa_expiry_date::date - CURRENT_DATE BETWEEN 0 AND 30 THEN 1 END) as expiring_soon,
        COUNT(CASE WHEN visa_expiry_date IS NOT NULL AND visa_expiry_date::date < CURRENT_DATE THEN 1 END) as expired,
        (
            COUNT(CASE WHEN notification_sent_60 = TRUE THEN 1 END) +
            COUNT(CASE WHEN notification_sent_30 = TRUE THEN 1 END) +
            COUNT(CASE WHEN notification_sent_15 = TRUE THEN 1 END) +
            COUNT(CASE WHEN notification_sent_7 = TRUE THEN 1 END) +
            COUNT(CASE WHEN notification_sent_1 = TRUE THEN 1 END)
        ) as notifications_sent
    FROM employee_table 
    WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample notifications for testing
INSERT INTO notifications (title, message, type, status, recipient, category) VALUES
('System Startup', 'CUBS Technical notification system is now active', 'info', 'sent', 'info@cubstechnical.com', 'system'),
('Email Service Test', 'Gmail SMTP service is configured and working', 'success', 'sent', 'info@cubstechnical.com', 'system'),
('Visa Monitoring Active', 'Automated visa expiry monitoring is now active', 'info', 'sent', 'info@cubstechnical.com', 'visa');

-- Create a view for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week,
    COUNT(CASE WHEN category = 'visa' THEN 1 END) as visa_count,
    COUNT(CASE WHEN category = 'document' THEN 1 END) as document_count,
    COUNT(CASE WHEN category = 'system' THEN 1 END) as system_count,
    COUNT(CASE WHEN category = 'approval' THEN 1 END) as approval_count
FROM notifications;

-- Grant access to the view
GRANT SELECT ON notification_stats TO authenticated;


