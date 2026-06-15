-- Fix: handle_new_user was overwritten by the referrals migration (20260614125200)
-- without trial_ends_at, so new users were not getting their 30-minute free trial.
--
-- Root cause: Each migration that calls CREATE OR REPLACE FUNCTION handle_new_user()
-- must include ALL columns. The 20260614125200 migration added referral/soft-delete
-- support but forgot to carry over trial_ends_at from 20260612232000.
--
-- This migration restores the complete, correct handle_new_user that includes:
--   - referral code resolution (referred_by_code metadata)
--   - unique referral code generation
--   - ip_address capture
--   - trial_ends_at = now() + 30 minutes for new students

create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
  ref_by_id uuid;
  gen_ref_code text;
  ref_code_exists boolean;
begin
  -- Check if this is the first user registering (they become admin)
  select not exists (select 1 from public.profiles) into is_first_user;

  -- Resolve referred_by UUID if a referral code was passed in metadata
  -- Supports both 'referral_code' and 'referred_by_code' metadata keys
  if coalesce(
      new.raw_user_meta_data->>'referral_code',
      new.raw_user_meta_data->>'referred_by_code'
    ) is not null then
    select id into ref_by_id
    from public.profiles
    where referral_code = lower(trim(coalesce(
        new.raw_user_meta_data->>'referral_code',
        new.raw_user_meta_data->>'referred_by_code'
      )))
      and deleted_at is null;
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
    -- First user (admin) gets no trial; new students get 30-minute free trial
    case when is_first_user then null else now() + interval '30 minutes' end
  );

  return new;
end;
$$ language plpgsql security definer;
