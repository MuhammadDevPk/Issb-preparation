-- Add referral fields to profiles table
alter table public.profiles 
add column if not exists referral_code text unique,
add column if not exists referred_by uuid references public.profiles(id) on delete set null,
add column if not exists referral_clicks integer not null default 0;

-- Index for fast referral lookup
create index if not exists idx_profiles_referral_code on public.profiles(referral_code);

-- Create app settings table
create table if not exists public.app_settings (
  id integer primary key check (id = 1),
  course_price integer not null default 1499,
  referral_bonus integer not null default 200,
  max_discount_pct integer not null default 90, -- Stop deducting after e.g. 90% discount
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed default settings
insert into public.app_settings (id, course_price, referral_bonus, max_discount_pct)
values (1, 1499, 200, 90)
on conflict (id) do nothing;

-- Enable RLS on settings
alter table public.app_settings enable row level security;

-- Drop existing settings policies if they exist
drop policy if exists "Anyone can view app settings" on public.app_settings;
drop policy if exists "Admins can update app settings" on public.app_settings;

-- Create settings policies
create policy "Anyone can view app settings" 
on public.app_settings 
for select 
using (true);

create policy "Admins can update app settings" 
on public.app_settings 
for update 
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Update trigger handle_new_user to generate referral_code and set referred_by
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
    referred_by
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
    ref_by_id
  );
  return new;
end;
$$ language plpgsql security definer;

-- Assign referral codes to existing users
update public.profiles 
set referral_code = lower(substring(md5(random()::text), 1, 8)) 
where referral_code is null;
