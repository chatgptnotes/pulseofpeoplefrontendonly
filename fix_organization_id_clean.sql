-- Query 1: Check user's current organization_id
SELECT
    id,
    email,
    organization_id,
    auth_user_id,
    full_name,
    role
FROM users
WHERE email = 'venkat.murugan.admin@tvk.com';
