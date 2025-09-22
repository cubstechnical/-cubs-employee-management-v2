-- Simplified RLS fix for existing profiles table
-- This script only adds RLS policies without modifying table structure

-- 1. Enable Row Level Security (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3. Create the correct RLS policies

-- Policy: Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy: Allow admins to read all profiles (for approval management)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'public')
        )
    );

-- Policy: Allow admins to update all profiles (for approval management)
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'public')
        )
    );

-- 4. Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_approved_by ON public.profiles(approved_by);

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
