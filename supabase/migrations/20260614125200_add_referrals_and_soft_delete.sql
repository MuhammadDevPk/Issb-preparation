-- Add columns to public.profiles if they don't exist
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists course_amount numeric not null default 0;
alter table public.profiles add column if not exists referral_commission numeric not null default 0;
alter table public.profiles add column if not exists deleted_at timestamp with time zone;

-- Create function to generate a unique random referral code
create or replace function public.generate_referral_code()
returns text as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  
  -- Check for uniqueness, regenerate if it collides
  if exists (select 1 from public.profiles where referral_code = result) then
    return public.generate_referral_code();
  end if;
  
  return result;
end;
$$ language plpgsql;

-- Retroactively generate referral codes for existing profiles that don't have one
do $$
declare
  r record;
begin
  for r in select id from public.profiles where referral_code is null loop
    update public.profiles 
    set referral_code = public.generate_referral_code()
    where id = r.id;
  end loop;
end;
$$;

-- Update the user creation trigger function to support referral capture and code generation
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
  referred_by_id uuid := null;
  ref_code text;
begin
  -- Check if this is the first user registering in profiles
  select not exists (select 1 from public.profiles) into is_first_user;

  -- Resolve referrer ID if code is supplied in metadata
  if new.raw_user_meta_data->>'referral_code' is not null then
    select id into referred_by_id from public.profiles 
    where referral_code = upper(trim(new.raw_user_meta_data->>'referral_code'))
      and deleted_at is null; -- Only active referrers
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
    ref_code,
    referred_by_id
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop old RLS policies on public.profiles
drop policy if exists "Users can select their own profile" on public.profiles;
drop policy if exists "Users can update their own profile fields" on public.profiles;

-- Create new RLS policies that respect soft delete
create policy "Users can select their own profile"
on public.profiles
for select
using (auth.uid() = id and deleted_at is null);

create policy "Users can update their own profile fields"
on public.profiles
for update
using (auth.uid() = id and deleted_at is null)
with check (
  auth.uid() = id
  and (
    public.is_admin(auth.uid())
    or (
      role = 'student'
      and status = (select status from public.profiles where id = auth.uid())
    )
  )
);

-- Admin security definer function to permanently delete any auth.user
create or replace function public.delete_auth_user(target_user_id uuid)
returns void as $$
begin
  -- Restrict access to admins only
  if not public.is_admin(auth.uid()) then
    raise exception 'Unauthorized: Only administrators can permanently delete users.';
  end if;
  
  -- Deleting from auth.users will automatically cascade to public.profiles via references
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer;
