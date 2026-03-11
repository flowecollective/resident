-- Reset enrollment for a specific user (replace the email)
UPDATE profiles
SET enrollment_completed = false, enrollment_date = NULL, enrollment_plan = NULL
WHERE email = 'info@marcowang.com';
