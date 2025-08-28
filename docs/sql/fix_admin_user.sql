-- Quick fix for info@cubstechnical.com admin user
-- Run this in your Supabase SQL editor

-- 1. Check if the user exists in auth.users
SELECT 'Auth Users:' as source, id, email, created_at 
FROM auth.users 
WHERE email = 'info@cubstechnical.com';

-- 2. Check if the user exists in profiles
SELECT 'Profiles:' as source, id, email, role, approved, created_at 
FROM public.profiles 
WHERE email = 'info@cubstechnical.com';

-- 3. Create profile for info@cubstechnical.com if it doesn't exist
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
    'CUBS Technical Admin',
    'admin',
    true,
    'CUBS',
    'Technical'
FROM auth.users u
WHERE u.email = 'info@cubstechnical.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 4. Update existing profile to admin if it exists
UPDATE public.profiles 
SET 
    role = 'admin',
    approved = true,
    full_name = 'CUBS Technical Admin',
    first_name = 'CUBS',
    last_name = 'Technical'
WHERE email = 'info@cubstechnical.com';

-- 5. Show all admin users
SELECT 'All Admin Users:' as info, id, email, full_name, role, approved, created_at 
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;
