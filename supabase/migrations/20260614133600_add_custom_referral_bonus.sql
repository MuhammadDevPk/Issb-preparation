-- Add custom_referral_bonus column to public.profiles if it doesn't exist
alter table public.profiles add column if not exists custom_referral_bonus numeric;

-- Create or replace handle_new_user() function to check for referrer's custom referral bonus
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
  referred_by_id uuid := null;
  referrer_custom_bonus numeric := null;
  ref_code text;
  default_course_price numeric := 1499;
  default_referral_commission numeric := 500;
begin
  -- Check if this is the first user registering in profiles
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

  -- Resolve referrer ID and check for custom referral bonus if code is supplied
  if new.raw_user_meta_data->>'referral_code' is not null then
    select id, custom_referral_bonus 
    into referred_by_id, referrer_custom_bonus
    from public.profiles 
    where referral_code = upper(trim(new.raw_user_meta_data->>'referral_code'))
      and deleted_at is null;

    -- If referrer has a custom referral bonus, use it as the commission for this registration
    if referrer_custom_bonus is not null then
      default_referral_commission := referrer_custom_bonus;
    end if;
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
