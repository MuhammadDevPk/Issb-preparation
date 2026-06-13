-- Fix: Merge referral code generation + IP tracking into one trigger function
-- The previous trial migration accidentally overwrote the referral-aware trigger.

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
    ip_address
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
    coalesce(new.raw_user_meta_data->>'ip_address', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Assign referral codes to any existing users that still don't have one
update public.profiles 
set referral_code = lower(substring(md5(random()::text), 1, 8)) 
where referral_code is null;
