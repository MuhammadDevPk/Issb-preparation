-- Create database RPC function to self-heal missing user profiles
create or replace function public.create_profile_if_missing()
returns jsonb as $$
declare
  user_id uuid;
  user_email text;
  is_first_user boolean;
  ref_code text;
  default_course_price numeric := 1499;
  default_referral_commission numeric := 500;
  created_profile public.profiles;
begin
  -- Get the current authenticated user's ID
  user_id := auth.uid();
  if user_id is null then
    raise exception 'Unauthorized: No active session';
  end if;

  -- Check if profile already exists
  if exists (select 1 from public.profiles where id = user_id and deleted_at is null) then
    select * into created_profile from public.profiles where id = user_id and deleted_at is null;
    return to_jsonb(created_profile);
  end if;

  -- Get email from auth.users
  select email into user_email from auth.users where id = user_id;
  if user_email is null then
    raise exception 'User not found in auth.users';
  end if;

  -- Check if this is the first user registering in profiles
  select not exists (select 1 from public.profiles) into is_first_user;

  -- Fetch settings
  select course_price, referral_bonus 
  into default_course_price, default_referral_commission 
  from public.app_settings 
  where id = 1;

  if default_course_price is null then
    default_course_price := 1499;
  end if;
  if default_referral_commission is null then
    default_referral_commission := 500;
  end if;

  -- Generate referral code
  ref_code := public.generate_referral_code();

  -- Insert profile
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
    referred_by,
    course_amount,
    referral_commission
  )
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', 'Admin'),
    coalesce(u.raw_user_meta_data->>'whatsapp', ''),
    coalesce(u.raw_user_meta_data->>'target_branch', 'army'),
    '',
    case when is_first_user or u.id = '8ee7f94f-1c41-4d18-aeee-36b6f2f404e8' then 'approved' else 'pending' end,
    case when is_first_user or u.id = '8ee7f94f-1c41-4d18-aeee-36b6f2f404e8' then 'admin' else 'student' end,
    ref_code,
    null,
    default_course_price,
    default_referral_commission
  from auth.users u
  where u.id = user_id
  returning * into created_profile;

  return to_jsonb(created_profile);
end;
$$ language plpgsql security definer;
