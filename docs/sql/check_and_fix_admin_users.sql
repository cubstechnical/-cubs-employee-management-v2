-- Check and fix admin users in profiles table
-- This script will help identify and fix missing admin records

-- 1. First, let's see what users exist in the profiles table
SELECT 
    id,
    email,
    full_name,
    role,
    approved,
    created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- 2. Check if info@cubstechnical.com exists in auth.users
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email = 'info@cubstechnical.com';

-- 3. If info@cubstechnical.com exists in auth.users but not in profiles, create the profile
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    approved,
    first_name,
    last_name
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', 'CUBS Technical Admin'),
    'admin',
    true,
    'CUBS',
    'Technical'
FROM auth.users u
WHERE u.email = 'info@cubstechnical.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 4. If info@cubstechnical.com exists in profiles but has wrong role, update it
UPDATE public.profiles 
SET 
    role = 'admin',
    approved = true,
    full_name = COALESCE(full_name, 'CUBS Technical Admin'),
    first_name = COALESCE(first_name, 'CUBS'),
    last_name = COALESCE(last_name, 'Technical')
WHERE email = 'info@cubstechnical.com';

-- 5. Show final admin users
SELECT 
    id,
    email,
    full_name,
    role,
    approved,
    created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 6. Grant admin role to specific user if needed (replace with actual user ID)
-- UPDATE public.profiles 
-- SET role = 'admin', approved = true
-- WHERE email = 'info@cubstechnical.com';
