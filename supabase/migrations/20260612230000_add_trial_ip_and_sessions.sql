-- Add new columns to profiles table
alter table public.profiles 
add column if not exists ip_address text default '',
add column if not exists active_session_id text default '';

-- Recreate trigger function public.handle_new_user to capture ip_address from user metadata
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  -- Check if this is the first user registering in profiles
  select not exists (select 1 from public.profiles) into is_first_user;

  insert into public.profiles (
    id, 
    email, 
    full_name, 
    whatsapp, 
    target_branch, 
    payment_screenshot_url, 
    status, 
    role, 
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
    coalesce(new.raw_user_meta_data->>'ip_address', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create checker function to prevent trial looping via IP addresses
create or replace function public.check_ip_trial_status(ip_addr text)
returns boolean as $$
begin
  -- Return true if the IP is registered and its trial has expired (created_at < now() - interval '30 minutes') and it has not been paid/approved
  return exists (
    select 1 from public.profiles
    where ip_address = ip_addr
      and ip_address != ''
      and ip_address != 'unknown'
      and status != 'approved'
      and role = 'student'
      and created_at < (now() - interval '30 minutes')
  );
end;
$$ language plpgsql security definer;
