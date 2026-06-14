-- Create or replace handle_new_user() function with default course amount lookup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
  referred_by_id uuid := null;
  ref_code text;
  default_course_price numeric := 1499;
  default_referral_commission numeric := 500;
begin
  -- Check if this is the first user registering in profiles
  select not exists (select 1 from public.profiles) into is_first_user;

  -- Resolve referrer ID if code is supplied in metadata
  if new.raw_user_meta_data->>'referral_code' is not null then
    select id into referred_by_id from public.profiles 
    where referral_code = upper(trim(new.raw_user_meta_data->>'referral_code'))
      and deleted_at is null; -- Only active referrers
  end if;

  -- Fetch current course price and referral bonus from settings
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
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    coalesce(new.raw_user_meta_data->>'target_branch', 'army'),
    coalesce(new.raw_user_meta_data->>'payment_screenshot_url', ''),
    case when is_first_user then 'approved' else 'pending' end,
    case when is_first_user then 'admin' else 'student' end,
    ref_code,
    referred_by_id,
    default_course_price,
    default_referral_commission
  );
  return new;
end;
$$ language plpgsql security definer;

-- Update existing profiles that have course_amount = 0 to the current settings course price
do $$
declare
  current_price numeric;
  current_commission numeric;
begin
  select course_price, referral_bonus into current_price, current_commission from public.app_settings where id = 1;
  if current_price is null then
    current_price := 1499;
  end if;
  if current_commission is null then
    current_commission := 500;
  end if;

  update public.profiles 
  set course_amount = current_price
  where course_amount = 0;

  update public.profiles 
  set referral_commission = current_commission
  where referral_commission = 0;
end;
$$;
