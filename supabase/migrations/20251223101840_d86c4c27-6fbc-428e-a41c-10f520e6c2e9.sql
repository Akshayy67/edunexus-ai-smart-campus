-- Delete the corrupted demo users from auth.users
DELETE FROM auth.users WHERE email IN ('admin@demo.com', 'faculty@demo.com', 'student@demo.com');

-- Also clean up the user_roles entries (they should cascade, but let's be safe)
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);