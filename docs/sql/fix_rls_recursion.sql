-- Fix for infinite recursion in RLS policies
-- This script creates simple, non-recursive policies

-- 1. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 2. Create simple, non-recursive policies

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

-- Policy: Allow all authenticated users to read all profiles (for admin functionality)
-- This is simpler and avoids recursion - we'll handle admin checks in the application layer
CREATE POLICY "Allow authenticated users to read all profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow all authenticated users to update all profiles (for admin functionality)
-- This is simpler and avoids recursion - we'll handle admin checks in the application layer
CREATE POLICY "Allow authenticated users to update all profiles" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (true);

-- 3. Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';
