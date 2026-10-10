-- Check existing users and their confirmation status
SELECT 
  email, 
  email_confirmed_at, 
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Unconfirmed'
  END as status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
