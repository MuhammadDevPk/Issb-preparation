-- Add explicit trial_ends_at field for reliable 30-minute trial tracking
alter table public.profiles 
add column if not exists trial_ends_at timestamp with time zone;

-- Set trial_ends_at for all existing users who don't have it yet
-- (created_at + 30 minutes)
update public.profiles 
set trial_ends_at = created_at + interval '30 minutes'
where trial_ends_at is null;

-- Update handle_new_user to set trial_ends_at on registration
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
  ref_by_id uuid;
  gen_ref_code text;
  ref_code_exists boolean;
begin
  -- Check if this is the first user registering in profiles
  select not exists (select 1 from public.profiles) into is_first_user;

  -- Resolve referred_by if referred_by_code metadata exists
  if new.raw_user_meta_data->>'referred_by_code' is not null then
    select id into ref_by_id from public.profiles 
    where referral_code = lower(new.raw_user_meta_data->>'referred_by_code');
  end if;

  -- Generate unique referral code
  loop
    gen_ref_code := lower(substring(md5(random()::text), 1, 8));
    select exists(select 1 from public.profiles where referral_code = gen_ref_code) into ref_code_exists;
    exit when not ref_code_exists;
  end loop;

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
    ip_address,
    trial_ends_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    coalesce(new.raw_user_meta_data->>'target_branch', 'army'),
    coalesce(new.raw_user_meta_data->>'payment_screenshot_url', ''),
    case when is_first_user then 'approved' else 'pending' end,
    case when is_first_user then 'admin' else 'student' end,
    gen_ref_code,
    ref_by_id,
    coalesce(new.raw_user_meta_data->>'ip_address', ''),
    now() + interval '30 minutes'
  );
  return new;
end;
$$ language plpgsql security definer;
