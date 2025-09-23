-- Create user_settings table for storing user preferences
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings_type text NOT NULL CHECK (settings_type IN ('profile', 'notifications', 'security', 'preferences', 'appearance', 'system')),
  settings_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, settings_type)
);

-- Create admin_settings table for system-wide settings
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}',
  setting_type text NOT NULL CHECK (setting_type IN ('notifications', 'security', 'system', 'appearance')),
  description text,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX user_settings_user_id_idx ON public.user_settings (user_id);
CREATE INDEX user_settings_type_idx ON public.user_settings (settings_type);
CREATE INDEX admin_settings_key_idx ON public.admin_settings (setting_key);
CREATE INDEX admin_settings_type_idx ON public.admin_settings (setting_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
-- Users can view and modify their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for admin_settings
-- Admins can view all settings, users can view public settings
CREATE POLICY "Admins can view all admin settings" ON public.admin_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND user_role = 'admin')
  );

CREATE POLICY "Users can view public admin settings" ON public.admin_settings
  FOR SELECT TO authenticated
  USING (is_public = true);

-- Only admins can modify admin settings
CREATE POLICY "Admins can insert admin settings" ON public.admin_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND user_role = 'admin')
  );

CREATE POLICY "Admins can update admin settings" ON public.admin_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND user_role = 'admin')
  );

CREATE POLICY "Admins can delete admin settings" ON public.admin_settings
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND user_role = 'admin')
  );

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('notifications', '{"emailNotifications": true, "pushNotifications": true, "visaExpiryAlerts": true, "documentUploadAlerts": true}', 'notifications', 'Default notification settings', true),
('security', '{"twoFactorAuth": false, "sessionTimeout": 30, "passwordPolicy": "strong"}', 'security', 'Default security settings', true),
('system', '{"autoBackup": true, "backupFrequency": "daily", "retentionDays": 30}', 'system', 'Default system settings', false),
('appearance', '{"theme": "system", "compactMode": false, "showAnimations": true}', 'appearance', 'Default appearance settings', true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


