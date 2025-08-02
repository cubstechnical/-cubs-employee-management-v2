-- CUBS Technical Admin Portal Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employee table
CREATE TABLE IF NOT EXISTS employee_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT,
  trade TEXT,
  nationality TEXT,
  joining_date DATE,
  passport_no TEXT,
  passport_expiry DATE,
  labourcard_no TEXT,
  labourcard_expiry DATE,
  visastamping_date DATE,
  visa_expiry_date DATE,
  eid TEXT,
  leave_date DATE,
  wcc TEXT,
  lulu_wps_card TEXT,
  basic_salary DECIMAL(10,2),
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  passport_number TEXT,
  visa_number TEXT,
  visa_type TEXT,
  visa_status TEXT,
  date_of_birth DATE,
  join_date DATE,
  mobile_number TEXT,
  home_phone_number TEXT,
  email_id TEXT,
  company_id TEXT,
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('master_admin', 'admin')),
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin invites table
CREATE TABLE IF NOT EXISTS admin_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  invited_by UUID REFERENCES admin_users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employee_table(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES admin_users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visa notifications table
CREATE TABLE IF NOT EXISTS visa_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employee_table(id) ON DELETE CASCADE,
  visa_type TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  days_until_expiry INTEGER NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) policies

-- Enable RLS on all tables
ALTER TABLE employee_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Employee table policies
CREATE POLICY "Admins can view all employees" ON employee_table
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_approved = true
    )
  );

CREATE POLICY "Admins can insert employees" ON employee_table
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_approved = true
    )
  );

CREATE POLICY "Admins can update employees" ON employee_table
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_approved = true
    )
  );

CREATE POLICY "Admins can delete employees" ON employee_table
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_approved = true
    )
  );

-- Admin users policies
CREATE POLICY "Users can view their own admin profile" ON admin_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Master admins can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() 
      AND au.role = 'master_admin'
      AND au.is_approved = true
    )
  );

CREATE POLICY "Master admins can insert admin users" ON admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() 
      AND au.role = 'master_admin'
      AND au.is_approved = true
    )
  );

CREATE POLICY "Master admins can update admin users" ON admin_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() 
      AND au.role = 'master_admin'
      AND au.is_approved = true
    )
  );

-- Admin invites policies
CREATE POLICY "Master admins can manage invites" ON admin_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() 
      AND au.role = 'master_admin'
      AND au.is_approved = true
    )
  );

-- Documents policies
CREATE POLICY "Admins can view all documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_approved = true
    )
  );

CREATE POLICY "Admins can insert documents" ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_approved = true
    )
  );

CREATE POLICY "Admins can update documents" ON documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_approved = true
    )
  );

CREATE POLICY "Admins can delete documents" ON documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_approved = true
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_table_employee_id ON employee_table(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_table_company_name ON employee_table(company_name);
CREATE INDEX IF NOT EXISTS idx_employee_table_visa_expiry_date ON employee_table(visa_expiry_date);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_documents_employee_id ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_visa_notifications_expiry_date ON visa_notifications(expiry_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employee_table_updated_at 
  BEFORE UPDATE ON employee_table 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a master admin user (you'll need to update this with your actual user ID)
-- This should be done after you create your first user account
-- INSERT INTO admin_users (user_id, name, email, role, is_approved) 
-- VALUES ('your-user-id-here', 'Master Admin', 'admin@cubstechnical.com', 'master_admin', true);

-- Sample data for testing (optional)
INSERT INTO employee_table (employee_id, name, trade, nationality, company_name, basic_salary, status) VALUES
('EMP001', 'John Doe', 'Electrician', 'Indian', 'CUBS Technical', 2500.00, 'active'),
('EMP002', 'Jane Smith', 'Plumber', 'Pakistani', 'CUBS Technical', 2200.00, 'active'),
('EMP003', 'Mike Johnson', 'Carpenter', 'Bangladeshi', 'CUBS Technical', 2000.00, 'active');

-- Success message
SELECT 'Database schema created successfully!' as status; 