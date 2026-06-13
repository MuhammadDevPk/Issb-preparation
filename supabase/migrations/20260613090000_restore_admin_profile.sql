-- Re-insert the admin profile row that is missing from the profiles table.
-- The auth user exists (can log in) but the profiles row was lost.
-- User ID: 8ee7f94f-1c41-4d18-aeee-36b6f2f404e8

-- First, get the email from auth.users to ensure correctness
insert into public.profiles (
  id,
  email,
  full_name,
  whatsapp,
  target_branch,
  payment_screenshot_url,
  status,
  role,
  referral_code,
  ip_address,
  trial_ends_at
)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', 'Admin'),
  coalesce(u.raw_user_meta_data->>'whatsapp', ''),
  coalesce(u.raw_user_meta_data->>'target_branch', 'army'),
  '',
  'approved',
  'admin',
  lower(substring(md5(random()::text), 1, 8)),
  '',
  now() + interval '30 minutes'
from auth.users u
where u.id = '8ee7f94f-1c41-4d18-aeee-36b6f2f404e8'
on conflict (id) do nothing;
