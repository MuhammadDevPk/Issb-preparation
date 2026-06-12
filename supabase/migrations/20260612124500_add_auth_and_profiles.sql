-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  whatsapp text,
  target_branch text,
  payment_screenshot_url text,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  role text not null default 'student', -- 'student', 'admin'
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Drop existing policies if they exist to avoid duplication
drop policy if exists "Admins can do everything on profiles" on public.profiles;
drop policy if exists "Users can select their own profile" on public.profiles;
drop policy if exists "Users can update their own profile fields" on public.profiles;

-- Create policies for profiles
create policy "Admins can do everything on profiles"
on public.profiles
for all
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Users can select their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update their own profile fields"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and (
    -- If updating user is admin, allow anything
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
    -- If normal user, check that status and role have not changed
    or (
      role = 'student'
      and status = (select status from public.profiles where id = auth.uid())
    )
  )
);

-- Setup trigger on auth.users to create profiles
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  -- Check if this is the first user registering in profiles
  select not exists (select 1 from public.profiles) into is_first_user;

  insert into public.profiles (id, email, full_name, whatsapp, target_branch, payment_screenshot_url, status, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    coalesce(new.raw_user_meta_data->>'target_branch', 'army'),
    coalesce(new.raw_user_meta_data->>'payment_screenshot_url', ''),
    case when is_first_user then 'approved' else 'pending' end,
    case when is_first_user then 'admin' else 'student' end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Setup payment screenshots storage bucket
insert into storage.buckets (id, name, public)
values ('payment_screenshots', 'payment_screenshots', true)
on conflict (id) do nothing;

-- Enable storage RLS policies
-- Note: Policies are defined on storage.objects

drop policy if exists "Allow public read access to screenshots" on storage.objects;
drop policy if exists "Allow authenticated uploads to payment_screenshots" on storage.objects;
drop policy if exists "Allow admin full control on payment_screenshots" on storage.objects;

create policy "Allow public read access to screenshots"
on storage.objects for select
using (bucket_id = 'payment_screenshots');

create policy "Allow authenticated uploads to payment_screenshots"
on storage.objects for insert
with check (
  bucket_id = 'payment_screenshots'
  and auth.role() = 'authenticated'
);

create policy "Allow admin full control on payment_screenshots"
on storage.objects for all
using (
  bucket_id = 'payment_screenshots'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);
