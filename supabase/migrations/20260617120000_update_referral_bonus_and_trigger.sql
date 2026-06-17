-- Update default referral bonus to 500 in app_settings table
update public.app_settings
set referral_bonus = 500
where id = 1;

-- If for some reason the row doesn't exist, insert it (safety check)
insert into public.app_settings (id, course_price, referral_bonus, max_discount_pct)
values (1, 1499, 500, 93)
on conflict (id) do update
set referral_bonus = 500;

-- Update the new user creation trigger function to fully support:
-- 1. unique referral code generation (lowercase 8-char md5)
-- 2. referred_by resolution (supports referral_code or referred_by_code from metadata)
-- 3. ip_address capture
-- 4. trial_ends_at (30 mins free trial)
-- 5. course_amount capture (fetched from settings, defaults to 1499)
-- 6. referral_commission capture (fetched from settings, defaults to 500, respects custom_referral_bonus of referrer)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
  ref_by_id uuid := null;
  referrer_custom_bonus numeric := null;
  gen_ref_code text;
  ref_code_exists boolean;
  default_course_price numeric := 1499;
  default_referral_commission numeric := 500;
  metadata_ref_code text;
begin
  -- Check if this is the first user registering (they become admin)
  select not exists (select 1 from public.profiles) into is_first_user;

  -- Fetch current course price and default referral bonus from settings
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

  -- Resolve referred_by UUID and custom referral bonus if a referral code was passed in metadata
  -- Supports both 'referral_code' and 'referred_by_code' metadata keys
  metadata_ref_code := coalesce(
    new.raw_user_meta_data->>'referral_code',
    new.raw_user_meta_data->>'referred_by_code'
  );

  if metadata_ref_code is not null then
    select id, custom_referral_bonus into ref_by_id, referrer_custom_bonus
    from public.profiles
    where referral_code = lower(trim(metadata_ref_code))
      and deleted_at is null;
      
    -- If referrer has a custom referral bonus, use it as the commission for this registration
    if referrer_custom_bonus is not null then
      default_referral_commission := referrer_custom_bonus;
    end if;
  end if;

  -- Generate a unique 8-character lowercase referral code
  loop
    gen_ref_code := lower(substring(md5(random()::text), 1, 8));
    select exists(
      select 1 from public.profiles where referral_code = gen_ref_code
    ) into ref_code_exists;
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
    trial_ends_at,
    course_amount,
    referral_commission
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
    -- First user (admin) gets no trial; new students get 30-minute free trial
    case when is_first_user then null else now() + interval '30 minutes' end,
    default_course_price,
    default_referral_commission
  );

  return new;
end;
$$ language plpgsql security definer;

-- Update existing profiles that have a referral_commission of 200 to 500
update public.profiles
set referral_commission = 500
where referral_commission = 200;
