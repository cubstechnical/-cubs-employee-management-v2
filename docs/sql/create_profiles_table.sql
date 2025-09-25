-- Create profiles table for user management and approvals
-- This script creates the missing profiles table that the authentication system expects

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text NOT NULL,
    full_name text,
    first_name text,
    last_name text,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'public')),
    approved boolean DEFAULT false,
    approved_by uuid REFERENCES auth.users(id),
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Additional metadata
    phone text,
    department text,
    position text,
    avatar_url text,

    -- Audit fields
    last_login timestamp with time zone,
    login_count integer DEFAULT 0,

    -- Constraints
    CONSTRAINT valid_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'user', 'public'))
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON public.profiles(approved);
CREATE INDEX IF NOT EXISTS idx_profiles_approved_by ON public.profiles(approved_by);
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON public.profiles(role, approved) WHERE approved = true;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (for approval management)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can update all profiles (for approval management)
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can insert profiles (for approval management)
CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Function to automatically create user profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a new profile for the user
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        approved
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'user',
        CASE
            WHEN NEW.email IN ('admin@cubstechnical.com', 'info@cubstechnical.com') THEN true
            ELSE false
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert admin user profile for info@cubstechnical.com if it doesn't exist
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    approved
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'info@cubstechnical.com' LIMIT 1),
    'info@cubstechnical.com',
    'CUBS Technical Admin',
    'admin',
    true
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    approved = true,
    full_name = 'CUBS Technical Admin',
    updated_at = now();

-- Insert admin user profile for admin@cubstechnical.com if it doesn't exist
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    approved
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@cubstechnical.com' LIMIT 1),
    'admin@cubstechnical.com',
    'CUBS Technical Admin',
    'admin',
    true
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    approved = true,
    full_name = 'CUBS Technical Admin',
    updated_at = now();

-- Success message
SELECT '✅ Profiles table created successfully!' as status;
