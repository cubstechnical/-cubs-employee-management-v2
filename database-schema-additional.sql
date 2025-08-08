-- Updated database schema to work with existing Supabase tables
-- Run these SQL commands in your Supabase SQL editor

-- Ensure employee_documents table exists to match app/services and materialized views
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employee_documents'
  ) THEN
    CREATE TABLE public.employee_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER,
      file_path TEXT,
      file_type TEXT,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      uploaded_by TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      mime_type TEXT,
      document_number TEXT,
      issuing_authority TEXT,
      expiry_date DATE
    );

    -- Basic indexes for performance
    CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON public.employee_documents(employee_id);
    CREATE INDEX IF NOT EXISTS idx_employee_documents_file_path ON public.employee_documents(file_path);
    CREATE INDEX IF NOT EXISTS idx_employee_documents_uploaded_at ON public.employee_documents(uploaded_at);

    -- Enable RLS and allow authenticated read/write consistent with app usage
    ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_documents' AND policyname='Allow authenticated read'
      ) THEN
        CREATE POLICY "Allow authenticated read" ON public.employee_documents
          FOR SELECT USING (auth.role() = 'authenticated');
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_documents' AND policyname='Allow authenticated write'
      ) THEN
        CREATE POLICY "Allow authenticated write" ON public.employee_documents
          FOR ALL USING (auth.role() = 'authenticated');
      END IF;
    END $$;
  END IF;
END $$;

-- Update existing notifications table to support admin notifications
-- (Uses existing 'notifications' table from your database-schema.sql)

-- First, check if title column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notifications' AND column_name = 'title') THEN
        ALTER TABLE notifications ADD COLUMN title TEXT;
    END IF;
END $$;

                                    -- Check if priority column exists, if not add it
                                    DO $$
                                    BEGIN
                                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                                    WHERE table_name = 'notifications' AND column_name = 'priority') THEN
                                            ALTER TABLE notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
                                        END IF;
                                    END $$;

                                    -- Add other columns if they don't exist
                                    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50);
                                    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unread';
                                    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(255);
                                    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);
                                    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
                                    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT false;
                                    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
                                    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

                                    -- Rename 'read' column to 'status' approach (we'll handle this in code)
                                    -- UPDATE notifications SET status = CASE WHEN read = true THEN 'read' ELSE 'unread' END;

                                    -- Create employee mappings table (this is new and needed)
                                    CREATE TABLE IF NOT EXISTS employee_mappings (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    employee_id VARCHAR(100) NOT NULL,
                                    employee_name VARCHAR(255) NOT NULL,
                                    company_name VARCHAR(255) NOT NULL,
                                    supervisor_id VARCHAR(100),
                                    supervisor_name VARCHAR(255),
                                    department VARCHAR(100),
                                    role VARCHAR(100),
                                    team VARCHAR(100),
                                    project VARCHAR(100),
                                    start_date DATE,
                                    end_date DATE,
                                    status VARCHAR(20) DEFAULT 'active',
                                    created_at TIMESTAMP DEFAULT NOW(),
                                    updated_at TIMESTAMP DEFAULT NOW()
                                    );

                                    -- Create admin settings table (this is new and needed)
                                    CREATE TABLE IF NOT EXISTS admin_settings (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    user_id VARCHAR(255) NOT NULL,
                                    setting_key VARCHAR(100) NOT NULL,
                                    setting_value TEXT,
                                    created_at TIMESTAMP DEFAULT NOW(),
                                    updated_at TIMESTAMP DEFAULT NOW(),
                                    UNIQUE(user_id, setting_key)
                                    );

                                    -- Create email_templates table (this is new and needed)
                                    CREATE TABLE IF NOT EXISTS email_templates (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    name VARCHAR(255) NOT NULL,
                                    subject TEXT NOT NULL,
                                    content TEXT NOT NULL,
                                    variables TEXT[] DEFAULT '{}',
                                    type VARCHAR(100) NOT NULL,
                                    days_threshold INTEGER,
                                    is_active BOOLEAN DEFAULT true,
                                    created_at TIMESTAMP DEFAULT NOW(),
                                    updated_at TIMESTAMP DEFAULT NOW()
                                    );

                                    -- Create visa_expiry_monitor table if not exists (based on your existing structure)
                                    CREATE TABLE IF NOT EXISTS visa_expiry_monitor (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    employee_id VARCHAR(100) NOT NULL,
                                    employee_name VARCHAR(255) NOT NULL,
                                    email_id VARCHAR(255),
                                    visa_expiry_date DATE NOT NULL,
                                    visa_type VARCHAR(100),
                                    company_name VARCHAR(255),
                                    notification_sent_90 BOOLEAN DEFAULT false,
                                    notification_sent_60 BOOLEAN DEFAULT false,
                                    notification_sent_30 BOOLEAN DEFAULT false,
                                    notification_sent_15 BOOLEAN DEFAULT false,
                                    notification_sent_7 BOOLEAN DEFAULT false,
                                    last_notification_date TIMESTAMP,
                                    days_remaining INTEGER,
                                    created_at TIMESTAMP DEFAULT NOW(),
                                    updated_at TIMESTAMP DEFAULT NOW()
                                    );

                                    -- Insert sample notifications (after columns are added)
                                    INSERT INTO notifications (title, message, type, category, priority, status, company_name, created_at) VALUES
                                    ('System Maintenance', 'Scheduled maintenance will occur tonight at 2 AM EST.', 'info', 'system', 'low', 'read', 'CUBS Technical', NOW() - INTERVAL '1 day'),
                                    ('Email Sent Successfully', 'Visa expiry reminder email has been sent to 5 employees.', 'success', 'email', 'low', 'read', 'CUBS Technical', NOW() - INTERVAL '2 hours'),
                                    ('Database Backup Complete', 'Daily database backup completed successfully.', 'success', 'system', 'low', 'read', 'CUBS Technical', NOW() - INTERVAL '6 hours'),
                                    ('New Employee Added', 'Employee John Doe has been successfully added to the system.', 'success', 'employee', 'medium', 'unread', 'AL HANA TOURS & TRAVELS', NOW() - INTERVAL '30 minutes'),
                                    ('Document Upload Required', 'New employee Sarah Smith needs passport copy uploaded.', 'info', 'document', 'medium', 'unread', 'GOLDEN CUBS', NOW() - INTERVAL '1 hour')
                                    ON CONFLICT DO NOTHING;

                                    -- Insert sample employee mappings (based on existing employees)
                                    INSERT INTO employee_mappings (employee_id, employee_name, company_name, department, role, team, project, start_date, status) VALUES
                                    ('ALHT001', 'John Smith', 'AL HANA TOURS & TRAVELS', 'Engineering', 'Software Engineer', 'Frontend Team', 'CUBS Portal', '2023-01-15', 'active'),
                                    ('ALHT002', 'Emily Davis', 'AL HANA TOURS & TRAVELS', 'HR', 'HR Specialist', 'HR Team', 'Employee Management', '2023-02-01', 'active'),
                                    ('ALHT003', 'Michael Johnson', 'AL HANA TOURS & TRAVELS', 'Engineering', 'Senior Developer', 'Backend Team', 'CUBS Portal', '2023-01-10', 'active'),
                                    ('ALHT004', 'Lisa Wang', 'GOLDEN CUBS', 'Finance', 'Accountant', 'Finance Team', 'Financial Reporting', '2023-03-01', 'active'),
                                    ('ALHT005', 'David Brown', 'AL HANA TOURS & TRAVELS', 'Marketing', 'Marketing Specialist', 'Digital Marketing', 'Brand Campaign', '2023-04-01', 'active')
                                    ON CONFLICT DO NOTHING;

                                    -- Insert sample admin settings
                                    INSERT INTO admin_settings (user_id, setting_key, setting_value) VALUES
                                    ('info@cubstechnical.com', 'notification_preferences', '{"email": true, "sms": false, "push": true}'),
                                    ('info@cubstechnical.com', 'theme_preference', 'dark'),
                                    ('info@cubstechnical.com', 'dashboard_layout', 'default'),
                                    ('info@cubstechnical.com', 'company_info', '{"name": "CUBS Technical", "address": "Dubai, UAE", "phone": "+971-50-123-4567"}')
                                    ON CONFLICT DO NOTHING;

                                    -- Insert sample email templates
                                    INSERT INTO email_templates (name, subject, content, variables, type, days_threshold, is_active) VALUES
                                    ('Visa Expiry - 90 Days', 'Visa Renewal Required - {{employee_name}} (90 Days Notice)', 
                                    'Dear {{employee_name}},

                                    This is a reminder that your visa will expire on {{visa_expiry_date}} (in 90 days).

                                    Please ensure you start the renewal process soon to avoid any complications.

                                    Employee Details:
                                    - Name: {{employee_name}}
                                    - Employee ID: {{employee_id}}
                                    - Company: {{company_name}}
                                    - Visa Type: {{visa_type}}
                                    - Expiry Date: {{visa_expiry_date}}

                                    Please contact HR for assistance with the renewal process.

                                    Best regards,
                                    {{company_name}} HR Team',
                                    ARRAY['employee_name', 'employee_id', 'company_name', 'visa_type', 'visa_expiry_date'],
                                    'visa_expiry', 90, true),
                                    ('Visa Expiry - 30 Days', 'URGENT: Visa Renewal Required - {{employee_name}} (30 Days Notice)',
                                    'Dear {{employee_name}},

                                    This is an URGENT reminder that your visa will expire on {{visa_expiry_date}} (in 30 days).

                                    Please contact HR immediately to complete the renewal process.

                                    Employee Details:
                                    - Name: {{employee_name}}
                                    - Employee ID: {{employee_id}}
                                    - Company: {{company_name}}
                                    - Visa Type: {{visa_type}}
                                    - Expiry Date: {{visa_expiry_date}}

                                    Immediate action is required to avoid visa expiry.

                                    Best regards,
                                    {{company_name}} HR Team',
                                    ARRAY['employee_name', 'employee_id', 'company_name', 'visa_type', 'visa_expiry_date'],
                                    'visa_expiry', 30, true),
                                    ('Visa Expiry - 7 Days', 'CRITICAL: Visa Expiring Soon - {{employee_name}} (7 Days Notice)',
                                    'Dear {{employee_name}},

                                    CRITICAL ALERT: Your visa will expire on {{visa_expiry_date}} (in 7 days).

                                    Please contact HR IMMEDIATELY to address this urgent matter.

                                    Employee Details:
                                    - Name: {{employee_name}}
                                    - Employee ID: {{employee_id}}
                                    - Company: {{company_name}}
                                    - Visa Type: {{visa_type}}
                                    - Expiry Date: {{visa_expiry_date}}

                                    This requires immediate attention to avoid legal complications.

                                    Best regards,
                                    {{company_name}} HR Team',
                                    ARRAY['employee_name', 'employee_id', 'company_name', 'visa_type', 'visa_expiry_date'],
                                    'visa_expiry', 7, true)
                                    ON CONFLICT DO NOTHING;

                                    -- Create indexes for better performance
                                    CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
                                    CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
                                    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

                                    CREATE INDEX IF NOT EXISTS idx_employee_mappings_employee_id ON employee_mappings(employee_id);
                                    CREATE INDEX IF NOT EXISTS idx_employee_mappings_company_name ON employee_mappings(company_name);
                                    CREATE INDEX IF NOT EXISTS idx_employee_mappings_status ON employee_mappings(status);

                                    CREATE INDEX IF NOT EXISTS idx_admin_settings_user_id ON admin_settings(user_id);
                                    CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

                                    CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
                                    CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
                                    CREATE INDEX IF NOT EXISTS idx_email_templates_days_threshold ON email_templates(days_threshold);

                                    CREATE INDEX IF NOT EXISTS idx_visa_expiry_monitor_employee_id ON visa_expiry_monitor(employee_id);
                                    CREATE INDEX IF NOT EXISTS idx_visa_expiry_monitor_expiry_date ON visa_expiry_monitor(visa_expiry_date);
                                    CREATE INDEX IF NOT EXISTS idx_visa_expiry_monitor_days_remaining ON visa_expiry_monitor(days_remaining);

                                    -- Enable Row Level Security (RLS)
                                    ALTER TABLE employee_mappings ENABLE ROW LEVEL SECURITY;
                                    ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
                                    ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
                                    ALTER TABLE visa_expiry_monitor ENABLE ROW LEVEL SECURITY;

                                    -- Create RLS policies
                                    CREATE POLICY "Allow all operations for authenticated users" ON employee_mappings
                                    FOR ALL USING (auth.role() = 'authenticated');

                                    CREATE POLICY "Allow users to access their own settings" ON admin_settings
                                    FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.email());

                                    CREATE POLICY "Allow all operations for authenticated users" ON email_templates
                                    FOR ALL USING (auth.role() = 'authenticated');

                                    CREATE POLICY "Allow all operations for authenticated users" ON visa_expiry_monitor
                                    FOR ALL USING (auth.role() = 'authenticated'); 
-- First, check if title column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'title') THEN
        ALTER TABLE notifications ADD COLUMN title TEXT;
    END IF;
END $$;

-- Check if priority column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'priority') THEN
        ALTER TABLE notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
    END IF;
END $$;

-- Add other columns if they don't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unread';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Rename 'read' column to 'status' approach (we'll handle this in code)
-- UPDATE notifications SET status = CASE WHEN read = true THEN 'read' ELSE 'unread' END;

-- Create employee mappings table (this is new and needed)
CREATE TABLE IF NOT EXISTS employee_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(100) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  supervisor_id VARCHAR(100),
  supervisor_name VARCHAR(255),
  department VARCHAR(100),
  role VARCHAR(100),
  team VARCHAR(100),
  project VARCHAR(100),
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create admin settings table (this is new and needed)
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- Create visa_expiry_monitor table if not exists (based on your existing structure)
CREATE TABLE IF NOT EXISTS visa_expiry_monitor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(100) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  email_id VARCHAR(255),
  visa_expiry_date DATE NOT NULL,
  visa_type VARCHAR(100),
  company_name VARCHAR(255),
  notification_sent_90 BOOLEAN DEFAULT false,
  notification_sent_60 BOOLEAN DEFAULT false,
  notification_sent_30 BOOLEAN DEFAULT false,
  notification_sent_15 BOOLEAN DEFAULT false,
  notification_sent_7 BOOLEAN DEFAULT false,
  last_notification_date TIMESTAMP,
  days_remaining INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample notifications (after columns are added)
INSERT INTO notifications (title, message, type, category, priority, status, company_name, created_at) VALUES
('System Maintenance', 'Scheduled maintenance will occur tonight at 2 AM EST.', 'info', 'system', 'low', 'read', 'CUBS Technical', NOW() - INTERVAL '1 day'),
('Email Sent Successfully', 'Visa expiry reminder email has been sent to 5 employees.', 'success', 'email', 'low', 'read', 'CUBS Technical', NOW() - INTERVAL '2 hours'),
('Database Backup Complete', 'Daily database backup completed successfully.', 'success', 'system', 'low', 'read', 'CUBS Technical', NOW() - INTERVAL '6 hours'),
('New Employee Added', 'Employee John Doe has been successfully added to the system.', 'success', 'employee', 'medium', 'unread', 'AL HANA TOURS & TRAVELS', NOW() - INTERVAL '30 minutes'),
('Document Upload Required', 'New employee Sarah Smith needs passport copy uploaded.', 'info', 'document', 'medium', 'unread', 'GOLDEN CUBS', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Insert sample employee mappings (based on existing employees)
INSERT INTO employee_mappings (employee_id, employee_name, company_name, department, role, team, project, start_date, status) VALUES
('ALHT001', 'John Smith', 'AL HANA TOURS & TRAVELS', 'Engineering', 'Software Engineer', 'Frontend Team', 'CUBS Portal', '2023-01-15', 'active'),
('ALHT002', 'Emily Davis', 'AL HANA TOURS & TRAVELS', 'HR', 'HR Specialist', 'HR Team', 'Employee Management', '2023-02-01', 'active'),
('ALHT003', 'Michael Johnson', 'AL HANA TOURS & TRAVELS', 'Engineering', 'Senior Developer', 'Backend Team', 'CUBS Portal', '2023-01-10', 'active'),
('ALHT004', 'Lisa Wang', 'GOLDEN CUBS', 'Finance', 'Accountant', 'Finance Team', 'Financial Reporting', '2023-03-01', 'active'),
('ALHT005', 'David Brown', 'AL HANA TOURS & TRAVELS', 'Marketing', 'Marketing Specialist', 'Digital Marketing', 'Brand Campaign', '2023-04-01', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample admin settings
INSERT INTO admin_settings (user_id, setting_key, setting_value) VALUES
('info@cubstechnical.com', 'notification_preferences', '{"email": true, "sms": false, "push": true}'),
('info@cubstechnical.com', 'theme_preference', 'dark'),
('info@cubstechnical.com', 'dashboard_layout', 'default'),
('info@cubstechnical.com', 'company_info', '{"name": "CUBS Technical", "address": "Dubai, UAE", "phone": "+971-50-123-4567"}')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_employee_mappings_employee_id ON employee_mappings(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_mappings_company_name ON employee_mappings(company_name);
CREATE INDEX IF NOT EXISTS idx_employee_mappings_status ON employee_mappings(status);

CREATE INDEX IF NOT EXISTS idx_admin_settings_user_id ON admin_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

CREATE INDEX IF NOT EXISTS idx_visa_expiry_monitor_employee_id ON visa_expiry_monitor(employee_id);
CREATE INDEX IF NOT EXISTS idx_visa_expiry_monitor_expiry_date ON visa_expiry_monitor(visa_expiry_date);
CREATE INDEX IF NOT EXISTS idx_visa_expiry_monitor_days_remaining ON visa_expiry_monitor(days_remaining);

-- Enable Row Level Security (RLS)
ALTER TABLE employee_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_expiry_monitor ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON employee_mappings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to access their own settings" ON admin_settings
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.email());

CREATE POLICY "Allow all operations for authenticated users" ON visa_expiry_monitor
  FOR ALL USING (auth.role() = 'authenticated'); 